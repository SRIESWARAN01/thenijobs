'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, useConversationList } from '@/hooks/useChat';
import { MessageSquare, Send, Search, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatTime(timestamp: any): string {
  if (!timestamp) return '';
  const ms =
    typeof timestamp?.toMillis === 'function'
      ? timestamp.toMillis()
      : typeof timestamp?.seconds === 'number'
        ? timestamp.seconds * 1000
        : new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return '';
  const date = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMsgTime(timestamp: any): string {
  if (!timestamp) return '';
  const ms =
    typeof timestamp?.toMillis === 'function'
      ? timestamp.toMillis()
      : typeof timestamp?.seconds === 'number'
        ? timestamp.seconds * 1000
        : new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string): string {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator Dots                                             */
/* ------------------------------------------------------------------ */

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-cyan-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

export default function SeekerMessagesPage() {
  const { user } = useAuth();
  const { conversations, loading: convsLoading, totalUnread } = useConversationList();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active conversation data
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId],
  );

  // Derive the other user's info from the active conversation
  const otherUserId = useMemo(() => {
    if (!activeConv || !user?.uid) return '';
    return activeConv.participants.find((p) => p !== user.uid) || '';
  }, [activeConv, user?.uid]);

  const otherUserName = useMemo(() => {
    if (!activeConv || !otherUserId) return 'User';
    return activeConv.participantNames?.[otherUserId] || 'User';
  }, [activeConv, otherUserId]);

  const otherUserRole = useMemo(() => {
    if (!activeConv || !otherUserId) return 'Employer';
    const role = activeConv.participantRoles?.[otherUserId] || 'employer';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }, [activeConv, otherUserId]);

  // Chat hook
  const {
    messages,
    loading: msgsLoading,
    sending,
    otherUserTyping,
    send,
    setTyping,
  } = useChat(activeConvId);

  // Filter conversations by search
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const otherId = c.participants.find((p) => p !== user?.uid) || '';
      const name = (c.participantNames?.[otherId] || '').toLowerCase();
      const job = (c.jobTitle || '').toLowerCase();
      const last = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || job.includes(q) || last.includes(q);
    });
  }, [conversations, search, user?.uid]);

  // Auto-scroll on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // Send handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    try {
      await send(text);
    } catch {
      setInputText(text); // restore on error
    }
  };

  // Typing handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTyping(true);
  };

  // Select conversation
  const selectConversation = (convId: string) => {
    setActiveConvId(convId);
    setMobileShowChat(true);
  };

  /* -------------------------------------------------------------- */
  /*  Conversation List Item                                        */
  /* -------------------------------------------------------------- */

  const renderConversationItem = (conv: (typeof conversations)[0]) => {
    const otherId = conv.participants.find((p) => p !== user?.uid) || '';
    const name = conv.participantNames?.[otherId] || 'User';
    const role = conv.participantRoles?.[otherId] || 'employer';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const unread = conv.unreadCounts?.[user?.uid || ''] || 0;
    const isActive = activeConvId === conv.id;

    return (
      <motion.div
        key={conv.id}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => selectConversation(conv.id)}
        className={`group p-4 cursor-pointer hover:bg-white/[0.03] transition-all flex items-center gap-3 ${
          isActive
            ? 'bg-white/[0.04] border-l-2 border-cyan-500'
            : 'border-l-2 border-transparent'
        }`}
      >
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 ring-1 ring-white/[0.06]">
          <span className="text-xs font-bold text-white/80">
            {getInitials(name)}
          </span>
          {/* Online dot – decorative */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0a1a]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              {formatTime(conv.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-medium text-cyan-400/70 bg-cyan-500/[0.08] rounded px-1.5 py-[1px]">
              {roleLabel}
            </span>
            {conv.jobTitle && (
              <span className="text-[10px] text-violet-400/60 truncate">
                • {conv.jobTitle}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-1">
            {conv.lastMessage || 'No messages yet'}
          </p>
        </div>

        {/* Unread Badge */}
        {unread > 0 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.div>
    );
  };

  /* -------------------------------------------------------------- */
  /*  Render                                                         */
  /* -------------------------------------------------------------- */

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col font-outfit text-white">
      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 text-sm font-medium text-cyan-400">
                ({totalUnread} unread)
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Chat with employers and recruiters
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
        {/* ───────── Left Panel – Conversation List ───────── */}
        <div
          className={`${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 border-r border-white/[0.06] flex-col bg-[#08081a]/50`}
        >
          {/* Search */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02] no-scrollbar">
            {convsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2
                  className="animate-spin text-cyan-400"
                  size={22}
                />
                <span className="text-xs text-gray-500">Loading conversations…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-8">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                  <MessageSquare
                    size={24}
                    className="text-gray-600"
                  />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  No conversations yet
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Your chats with employers will appear here once a conversation begins.
                </p>
              </div>
            ) : (
              <AnimatePresence>{filtered.map(renderConversationItem)}</AnimatePresence>
            )}
          </div>
        </div>

        {/* ───────── Right Panel – Chat Thread ───────── */}
        <div
          className={`${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-[#070718]/30`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#08081a]/50">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <ArrowLeft size={18} className="text-gray-400" />
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center ring-1 ring-white/[0.06]">
                    <span className="text-xs font-bold text-white/80">
                      {getInitials(otherUserName)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {otherUserName}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-cyan-400 font-medium">
                        {otherUserRole}
                      </span>
                      {activeConv.jobTitle && (
                        <span className="text-[10px] text-gray-500">
                          • {activeConv.jobTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2
                      className="animate-spin text-cyan-400"
                      size={24}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <MessageSquare
                      size={28}
                      className="opacity-30 mb-2"
                    />
                    <p className="text-xs">
                      No messages yet. Send a message to start the conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === user?.uid;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                            isSelf
                              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-tr-none'
                              : 'bg-white/[0.06] text-gray-200 border border-white/[0.04] rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.text}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isSelf ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                isSelf ? 'text-white/50' : 'text-gray-500'
                              }`}
                            >
                              {formatMsgTime(msg.createdAt)}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] text-white/50 ml-0.5">
                                {msg.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {otherUserTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/[0.06] border border-white/[0.04] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          {otherUserRole} is typing
                          <TypingDots />
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-white/[0.06] bg-[#08081a]/50"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Empty State — No chat selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center ring-1 ring-white/[0.06]">
                  <MessageSquare size={28} className="text-gray-500" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Select a conversation
                </h3>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Choose a conversation from the list to start chatting with an employer or recruiter.
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
