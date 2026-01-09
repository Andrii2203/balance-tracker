/**
 * Chat Service - Idempotent Message Sending with Offline Support
 * 
 * Architecture:
 * - Client-generated UUID for deduplication
 * - Server-side idempotent insert
 * - IndexedDB for offline storage (no localStorage)
 * - Background sync when online
 */

import { supabase } from '../supabaseClient';
import { 
  saveMessage, 
  getAllMessages, 
  getPendingMessages, 
  markMessageSent,
  MessageRecord 
} from './db';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

export interface ChatMessage extends Omit<MessageRecord, 'pending'> {
  pending?: boolean;
}

export interface SendMessageParams {
  userId: string;
  message: string;
  createdAt: string;
  clientId: string;
}

export interface SendResult {
  success: boolean;
  data?: ChatMessage;
  error?: string;
  isDuplicate?: boolean;
}

// ============================================
// Configuration
// ============================================

const CHAT_TABLE = 'chat_messages';
const RPC_FUNCTION = 'send_chat_message';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================
// Utils
// ============================================

export const generateClientId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================
// Core: Send Message with Retry (Idempotent)
// ============================================

export const sendChatMessage = async (params: SendMessageParams): Promise<SendResult> => {
  const { userId, message, createdAt, clientId } = params;

  // Validate inputs
  if (!userId || !message || !createdAt || !clientId) {
    return { success: false, error: 'Invalid message parameters' };
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`[chatService] Send attempt ${attempt}/${MAX_RETRIES}`, { clientId });

      const { data, error } = await supabase.rpc(RPC_FUNCTION, {
        p_user_id: userId,
        p_message: message,
        p_created_at: createdAt,
        p_client_id: clientId,
      }) as { data: any; error: any };

      if (error) {
        // Check for duplicate key violation
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          logger.info('[chatService] Message already exists (idempotent)', { clientId });
          return { 
            success: true, 
            data: { client_id: clientId, user_id: userId, message, created_at: createdAt },
            isDuplicate: true 
          };
        }
        throw new Error(error.message);
      }

      if (data) {
        logger.info('[chatService] Message sent successfully', { clientId, isDuplicate: false });
        return { success: true, data };
      }

      throw new Error('No data returned from RPC');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[chatService] Attempt ${attempt} failed`, { clientId, error: lastError.message });

      // Don't retry validation errors
      if (lastError.message.includes('cannot be null') || 
          lastError.message.includes('cannot be empty')) {
        return { success: false, error: lastError.message };
      }

      // Exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const errorMsg = `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`;
  logger.error('[chatService] All retries exhausted', { clientId, error: errorMsg });
  return { success: false, error: errorMsg };
};

// ============================================
// Save Message Locally (IndexedDB)
// ============================================

export const saveMessageLocal = async (
  userId: string,
  message: string,
  createdAt: string,
  clientId: string,
  profiles?: { email: string }
): Promise<number> => {
  const record: MessageRecord = {
    client_id: clientId,
    user_id: userId,
    message,
    created_at: createdAt,
    pending: 1,  // Mark as pending
    profiles,
  };

  return saveMessage(record);
};

// ============================================
// Fetch Messages from Server
// ============================================

export const fetchMessagesFromServer = async (): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from(CHAT_TABLE)
      .select('*, profiles(email)')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[chatService] Fetch from server failed', { error });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[chatService] Fetch exception', { err });
    return [];
  }
};

// ============================================
// Sync: Load messages to IndexedDB
// ============================================

/**
 * Sync messages from server to IndexedDB
 * Returns true if sync was successful
 */
export const syncMessagesToLocal = async (): Promise<boolean> => {
  try {
    logger.info('[chatService] Starting sync to IndexedDB');
    
    const serverMessages = await fetchMessagesFromServer();
    const serverClientIds = new Set(serverMessages.map(m => m.client_id));
    
    // Import db dynamically to avoid circular dependencies
    const { db } = await import('./db');
    
    // Get all local messages
    const localMessages = await db.messages.toArray();
    
    // Remove local messages that don't exist on server
    for (const localMsg of localMessages) {
      if (!serverClientIds.has(localMsg.client_id)) {
        logger.info('[chatService] Removing deleted message from IndexedDB', { clientId: localMsg.client_id });
        await db.messages.delete(localMsg.id!);
      }
    }
    
    // Add new messages from server
    for (const msg of serverMessages) {
      // Check if already exists by client_id
      const exists = await messageExistsByClientId(msg.client_id);
      if (!exists) {
        await saveMessage({
          client_id: msg.client_id,
          user_id: msg.user_id,
          message: msg.message,
          created_at: msg.created_at,
          pending: 0,  // Already synced
          profiles: msg.profiles,
        });
      }
    }
    
    logger.info('[chatService] Sync complete', { serverCount: serverMessages.length, localCount: localMessages.length });
    return true;
  } catch (err) {
    logger.error('[chatService] Sync failed', { err });
    return false;
  }
};

// ============================================
// Flush Pending Messages
// ============================================

export const flushPendingMessages = async (): Promise<void> => {
  const pending = await getPendingMessages();
  
  logger.info('[chatService] Flushing pending messages', { count: pending.length });

  for (const msg of pending) {
    try {
      if (!msg.client_id || !msg.user_id) continue;

      const result = await sendChatMessage({
        userId: msg.user_id,
        message: msg.message,
        createdAt: msg.created_at,
        clientId: msg.client_id,
      });

      if (result.success && msg.id) {
        // Convert to Partial<MessageRecord> - remove pending from result
        const { pending, ...serverData } = result.data || {};
        await markMessageSent(msg.id, serverData as Partial<MessageRecord>);
        logger.debug('[chatService] Pending message sent', { id: msg.id, isDuplicate: result.isDuplicate });
      }
    } catch (err) {
      logger.warn('[chatService] Failed to flush pending', { msg, err });
    }
  }
};

// ============================================
// Message Existence Check
// ============================================

export const messageExistsByClientId = async (clientId: string): Promise<boolean> => {
  try {
    const { db } = await import('./db');
    const existing = await db.messages.where('client_id').equals(clientId).first();
    return !!existing;
  } catch {
    return false;
  }
};
