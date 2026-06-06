'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  createConversation,
  sendChatMessage,
  markMessagesRead,
  setTypingStatus,
} from '@/lib/firebase/firestoreService';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'system';
  read: boolean;
  readAt?: any;
  createdAt: any;
  attachments?: { type: string; url: string; name: string; size?: number }[];
}

interface ConversationData {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  participantPhotos?: Record<string, string>;
  jobId?: string;
  jobTitle?: string;
  lastMessage: string;
  lastMessageAt: any;
  lastMessageSenderId?: string;
  typingUsers: string[];
  unreadCounts: Record<string, number>;
  status: string;
}

/**
 * Real-time chat hook for a specific conversation.
 *
 * Subscribes to messages in real-time, handles sending,
 * typing indicators, and read receipts.
 */
export function useChat(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time message listener
  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const msgsRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(200));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(msgs);
        setLoading(false);

        // Auto-mark messages as read
        const unreadFromOthers = snapshot.docs.filter(
          (d) => d.data().senderId !== user.uid && !d.data().read
        );
        if (unreadFromOthers.length > 0) {
          markMessagesRead(conversationId, user.uid).catch(console.error);
        }
      },
      (err) => {
        console.error('[useChat] messages error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  // Typing indicator listener
  useEffect(() => {
    if (!conversationId || !user?.uid) return;

    const convRef = doc(db, 'conversations', conversationId);
    const unsubscribe = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const typingUsers = (data.typingUsers || []) as string[];
        setOtherUserTyping(typingUsers.some((uid: string) => uid !== user.uid));
      }
    });

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  // Send message
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !conversationId || !user?.uid) return;

      setSending(true);
      try {
        await sendChatMessage(conversationId, {
          senderId: user.uid,
          senderName: user.displayName || 'User',
          senderRole: (user as any).role || 'user',
          text: text.trim(),
          type: 'text',
        });

        // Clear typing indicator
        await setTypingStatus(conversationId, user.uid, false);
      } catch (err) {
        console.error('[useChat] send error:', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, user]
  );

  // Set typing indicator with auto-clear
  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId || !user?.uid) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      try {
        await setTypingStatus(conversationId, user.uid, isTyping);

        // Auto-clear typing after 3 seconds of inactivity
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(async () => {
            await setTypingStatus(conversationId, user.uid, false);
          }, 3000);
        }
      } catch (err) {
        console.error('[useChat] typing error:', err);
      }
    },
    [conversationId, user]
  );

  // Start a new conversation
  const startConversation = useCallback(
    async (
      otherUserId: string,
      otherUserName: string,
      otherUserRole: string,
      jobId?: string,
      jobTitle?: string,
    ) => {
      if (!user?.uid) return null;

      try {
        const convId = await createConversation({
          participants: [user.uid, otherUserId],
          participantNames: {
            [user.uid]: user.displayName || 'User',
            [otherUserId]: otherUserName,
          },
          participantRoles: {
            [user.uid]: (user as any).role || 'user',
            [otherUserId]: otherUserRole,
          },
          jobId,
          jobTitle,
        });
        return convId;
      } catch (err) {
        console.error('[useChat] create conversation error:', err);
        return null;
      }
    },
    [user]
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    sending,
    otherUserTyping,
    send,
    setTyping,
    startConversation,
  };
}

/**
 * Hook for listing all conversations for the current user.
 */
export function useConversationList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'active'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convs = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ConversationData)
          .sort((a, b) => {
            const aTime = a.lastMessageAt?.seconds || 0;
            const bTime = b.lastMessageAt?.seconds || 0;
            return bTime - aTime;
          });
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        console.error('[useConversationList] error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate total unread
  const totalUnread = conversations.reduce((sum, c) => {
    return sum + (c.unreadCounts?.[user?.uid || ''] || 0);
  }, 0);

  return { conversations, loading, totalUnread };
}
