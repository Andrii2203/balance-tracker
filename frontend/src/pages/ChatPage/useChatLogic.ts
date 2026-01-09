/**
 * Chat Logic Hook - IndexedDB Only Architecture
 * 
 * Security: No localStorage - all data in IndexedDB only
 * Offline: Full offline support with background sync
 * Idempotent: Client-generated UUID + server deduplication
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { 
  saveMessage, 
  getAllMessages, 
  getPendingMessages, 
  markMessageSent,
  setLastSyncTime
} from '../../services/db';
import { 
  sendChatMessage, 
  generateClientId, 
  fetchMessagesFromServer,
  syncMessagesToLocal,
  flushPendingMessages,
  saveMessageLocal,
  ChatMessage 
} from '../../services/chatService';
import { useUser } from "../../contexts/UserContext";
import { logger } from '../../utils/logger';

// ============================================
// Types
// ============================================

interface LocalMessage extends ChatMessage {
  id?: number;
}

// ============================================
// Constants
// ============================================

const CHANNEL_NAME = 'chat-messages-channel';
const MESSAGES_PER_PAGE = 100;

// ============================================
// Main Hook
// ============================================

export const useChatLogic = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [loading, setLoading] = useState(false);
  
  const channelRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // ============================================
  // Load Messages from IndexedDB
  // ============================================

  const loadMessages = useCallback(async () => {
    if (!user?.id || loading) {
      logger.warn('[chat] Load skipped - no user or loading');
      return;
    }

    setLoading(true);
    logger.info('[chat] Loading messages from IndexedDB...');

    try {
      // 1. Get all messages from IndexedDB (cached)
      const cached = await getAllMessages();
      const cachedMessages: LocalMessage[] = cached.map(m => ({ ...m, pending: m.pending === 1 }));
      
      logger.info('[chat] Loaded from IndexedDB', { count: cachedMessages.length });
      setMessages(cachedMessages);
      
      // 2. Sync from server in background
      if (navigator.onLine) {
        await syncFromServer();
      }
    } catch (error) {
      logger.error('[chat] Failed to load messages', { error });
    } finally {
      setLoading(false);
    }
  }, [user?.id, loading]);

  // ============================================
  // Sync from Server to IndexedDB
  // ============================================

  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) {
      logger.debug('[chat] Sync skipped - offline');
      return;
    }

    try {
      logger.info('[chat] Syncing from server...');
      
      // Fetch new messages and save to IndexedDB
      const success = await syncMessagesToLocal();
      
      if (success) {
        await setLastSyncTime();
        
        // Update state with new messages from IndexedDB
        const updated = await getAllMessages();
        setMessages(updated.map(m => ({ ...m, pending: m.pending === 1 })));
        
        logger.info('[chat] Sync complete');
        
        // Flush any pending messages
        await flushPendingMessages();
      }
    } catch (error) {
      logger.error('[chat] Sync failed', { error });
    }
  }, []);

  // ============================================
  // Send Message
  // ============================================

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) {
      logger.warn('[chat] Send skipped - empty message or no user');
      return;
    }

    const clientId = generateClientId();
    const createdAt = new Date().toISOString();
    const userEmail = user.email || '';

    const messageObj: LocalMessage = {
      client_id: clientId,
      user_id: user.id,
      message: newMessage,
      created_at: createdAt,
      profiles: { email: userEmail },
      pending: !online,
    };

    logger.info('[chat] Creating message', { clientId, online });

    // 1. Add to UI immediately (optimistic)
    setMessages(prev => [...prev, messageObj]);
    setNewMessage("");

    // 2. Save to IndexedDB
    const savedId = await saveMessageLocal(user.id, newMessage, createdAt, clientId, { email: userEmail });
    messageObj.id = savedId;

    // 3. Try to send if online
    if (online) {
      try {
        const result = await sendChatMessage({
          userId: user.id,
          message: newMessage,
          createdAt,
          clientId,
        });

        if (result.success) {
          logger.info('[chat] Message sent', { clientId, isDuplicate: result.isDuplicate });
          
          // Mark as sent in IndexedDB
          if (savedId) {
            const { pending, ...serverData } = result.data || {};
            await markMessageSent(savedId, serverData);
          }
          
          // Update state
          setMessages(prev => prev.map(m => 
            m.client_id === clientId ? { ...(result.data || m), pending: false, id: savedId } : m
          ));
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        logger.error('[chat] Send failed', { error, clientId });
        // Message stays in IndexedDB as pending
      }
    } else {
      logger.info('[chat] Saved as pending (offline)');
      // Background sync registered
      if ('serviceWorker' in window && 'SyncManager' in window) {
        try {
          const reg = await (navigator as any).serviceWorker.ready;
          await reg.sync.register('bt-flush-chat');
        } catch (e) {
          // Background sync not available
        }
      }
    }
  }, [newMessage, user, online]);

  // ============================================
  // Resend Message
  // ============================================

  const resendMessage = useCallback(async (index: number) => {
    const msg = messages[index];
    if (!msg || !user || !online) return;

    logger.info('[chat] Resending', { index, clientId: msg.client_id });

    try {
      const result = await sendChatMessage({
        userId: user.id,
        message: msg.message,
        createdAt: msg.created_at || new Date().toISOString(),
        clientId: msg.client_id,
      });

      if (result.success) {
        if (msg.id) {
          const { pending, ...serverData } = result.data || {};
          await markMessageSent(msg.id, serverData);
        }
        
        const updated = [...messages];
        updated[index] = { ...(result.data || msg), pending: false };
        setMessages(updated);
        
        logger.info('[chat] Resend success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('[chat] Resend failed', { error });
      alert('Не вдалося надіслати 😞');
    }
  }, [messages, user, online]);

  // ============================================
  // Realtime Subscription
  // ============================================

  const createChannel = useCallback(() => {
    if (channelRef.current || !navigator.onLine) return;

    try {
      channelRef.current = supabase
        .channel(CHANNEL_NAME)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          async (payload) => {
            const newMsg = payload.new as LocalMessage;
            logger.info('[chat] Realtime new message', { clientId: newMsg.client_id });

            // Check if already exists
            const exists = messages.some(m => m.client_id === newMsg.client_id);
            if (exists) {
              logger.debug('[chat] Message already in state');
              return;
            }

            // Save to IndexedDB
            await saveMessage({
              client_id: newMsg.client_id,
              user_id: newMsg.user_id,
              message: newMsg.message,
              created_at: newMsg.created_at,
              pending: 0,
              profiles: newMsg.profiles,
            });

            // Update state
            setMessages(prev => [...prev, newMsg]);
          }
        )
        .subscribe();
        
      logger.debug('[chat] Realtime channel created');
    } catch (error) {
      logger.warn('[chat] Failed to create channel', { error });
    }
  }, [messages]);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      } catch (error) {
        logger.warn('[chat] Cleanup failed', { error });
      }
    }
  }, []);

  // ============================================
  // Network Handlers
  // ============================================

  const handleOnline = useCallback(() => {
    logger.info('[chat] Network online');
    setOnline(true);
    createChannel();
    syncFromServer();
  }, [createChannel, syncFromServer]);

  const handleOffline = useCallback(() => {
    logger.info('[chat] Network offline');
    setOnline(false);
    cleanupChannel();
  }, [cleanupChannel]);

  // ============================================
  // Effects
  // ============================================

  // Initial load
  useEffect(() => {
    if (user?.id && !initializedRef.current) {
      initializedRef.current = true;
      logger.info('[chat] Initial load');
      loadMessages();
    }
  }, [user?.id, loadMessages]);

  // Network listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChannel();
    };
  }, [cleanupChannel]);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    resendMessage,
    online,
    loading,
  };
};
