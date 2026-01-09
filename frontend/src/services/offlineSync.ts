import { db, getPendingMessages, markMessageSent } from './db';
import { logger } from '../utils/logger';
import { supabase } from '../supabaseClient';

// Send a pending chat message: use RPC for idempotent insert with client_id deduplication
export const sendPendingChatMessage = async (msg: any) => {
  try {
    // If client_id exists, use RPC for idempotent insert
    if (msg.client_id && msg.user_id) {
      const { data: serverRow, error } = await supabase
        .rpc('send_chat_message', {
          p_user_id: msg.user_id,
          p_message: msg.message,
          p_created_at: msg.created_at,
          p_client_id: msg.client_id
        });

      if (error) {
        logger.warn('[offlineSync] RPC failed, falling back to lookup', error);
      } else if (serverRow) {
        return { data: serverRow };
      }
    }

    // Fallback: Try to find an existing server message matching user_id + created_at
    if (msg.user_id && msg.created_at) {
      try {
        const { data: existing, error: selErr } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', msg.user_id)
          .eq('created_at', msg.created_at)
          .maybeSingle();
        if (selErr) {
          logger.debug('[offlineSync] lookup existing message failed', selErr);
        } else if (existing) {
          return { data: existing };
        }
      } catch (e) {
        logger.debug('[offlineSync] lookup existing thrown', e);
      }
    }

    // If no match found, insert (should not happen with proper client_id)
    const res = await supabase.from('chat_messages').insert([{ 
      message: msg.message, 
      user_id: msg.user_id, 
      created_at: msg.created_at,
      client_id: msg.client_id 
    }]);
    return res;
  } catch (err) {
    logger.warn('[offlineSync] sendPendingChatMessage failed', err);
    throw err;
  }
};

// Simple offline sync PoC: try to send pending messages periodically or when online
export const tryFlushPending = async (sendFn: (msg: any) => Promise<any>) => {
  // Prevent concurrent flushes
  if ((tryFlushPending as any)._inFlight) return;
  (tryFlushPending as any)._inFlight = true;
  try {
    logger.debug('[offlineSync] tryFlushPending start');
    // Skip flushing in dev fake-user mode to avoid sending test data to server
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('bt:dev_user') === 'true') {
        logger.debug('[offlineSync] dev mode detected; skipping flushPending');
        return;
      }
    } catch (dmErr) {
      logger.warn('[offlineSync] failed to read dev mode flag', dmErr);
    }
    const pending = await getPendingMessages();
    logger.debug('[offlineSync] pending count=' + pending.length, pending);
    for (const msg of pending) {
      try {
      logger.debug('[offlineSync] sending pending msg', msg);
        // Fix dev placeholder user id if present to avoid UUID errors on server
        try {
          if (msg.user_id === 'dev_user' && typeof window !== 'undefined') {
            let devId = localStorage.getItem('bt:dev_user_id');
            if (!devId) {
              const gen = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : '00000000-0000-4000-8000-000000000000';
              localStorage.setItem('bt:dev_user_id', gen);
              devId = gen;
            }
            // update IndexedDB record if we have id
            try {
              if (msg.id) await db.messages.update(msg.id, { user_id: devId });
            } catch (uErr) {
              logger.warn('[offlineSync] failed to migrate pending msg user_id in IndexedDB', uErr);
            }
            // also update in-memory object
            (msg as any).user_id = devId;
          }
        } catch (fixErr) {
          logger.warn('[offlineSync] dev_user fix failed', fixErr);
        }

        const res = await sendFn(msg);
        // try to obtain the server-side inserted row (common supabase response shape)
        let serverRow: any = undefined;
        try {
          if (res && res.data) serverRow = Array.isArray(res.data) ? res.data[0] : res.data;
          else if (res && res[0]) serverRow = res[0];
        } catch (e) {
          serverRow = undefined;
        }

        if (msg.id) {
          await markMessageSent(msg.id, serverRow);
          // Also update localStorage to keep it in sync
          try {
            const cached = localStorage.getItem("chat_messages");
            if (cached) {
              const parsed = JSON.parse(cached);
              const updated = parsed.map((m: any) => {
                if (m.id === msg.id || m.client_id === msg.client_id) {
                  return { ...m, ...serverRow, pending: false };
                }
                return m;
              });
              localStorage.setItem("chat_messages", JSON.stringify(updated));
            }
          } catch (syncErr) {
            logger.warn('[offlineSync] failed to sync localStorage', syncErr);
          }
        }
        logger.debug('[offlineSync] sent and marked ' + msg.id, { serverRow });
      } catch (err) {
        // leave as pending
        logger.warn('Failed to send pending message', { err, msg });
      }
    }
  } finally {
    (tryFlushPending as any)._inFlight = false;
  }
};

// Register window online event to flush
export const attachAutoFlush = (sendFn: (msg: any) => Promise<any>) => {
  if (typeof window === 'undefined') return;
  const handler = () => {
    tryFlushPending(sendFn).catch((e) => logger.error('attachAutoFlush error', e));
  };
  window.addEventListener('online', handler);
  // return unsubscribe for cleanup
  return () => {
    try {
      window.removeEventListener('online', handler);
    } catch (err) {
      logger.warn('Failed to remove online handler', err);
    }
  };
};
