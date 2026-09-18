'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Send, Paperclip, Smile, Zap, Bot, Pin, Archive,
  CheckCheck, Check, Clock, AlertCircle, Lock, Sparkles, X, ChevronDown, Wifi, WifiOff, ArrowLeft,
} from 'lucide-react';
import {
  useConversations, useMessages, useSendMessage, useAISuggestReply,
  useQuickReplies, useMarkConversationRead, useAddInternalNote,
  useUpdateConversation, type Conversation, type Message,
} from '@/queries/inbox.queries';
import { useWhatsappStatus } from '@/queries/settings.queries';
import { useInboxStore } from '@/stores/inbox.store';
import { joinConversation, leaveConversation, emitTypingStart, emitTypingStop } from '@/lib/socket-client';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { formatDate, formatRelative, formatPhoneDisplay, truncate } from '@/lib/format';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';

// ─── Message status icon ────────────────────────────────────────────────────────
function MessageStatusIcon({ status }: { status: string }) {
  if (status === 'READ') return (
    <span className="flex items-center gap-0.5" title="Read">
      <CheckCheck className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
    </span>
  );
  if (status === 'DELIVERED') return (
    <span className="flex items-center gap-0.5" title="Delivered">
      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
  if (status === 'SENT') return (
    <span className="flex items-center gap-0.5" title="Sent">
      <Check className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
  if (status === 'FAILED') return (
    <span className="flex items-center gap-0.5" title="Failed">
      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
    </span>
  );
  if (status === 'SCHEDULED') return (
    <span className="flex items-center gap-0.5" title="Scheduled">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
  return (
    <span className="flex items-center gap-0.5" title="Sending">
      <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
    </span>
  );
}

// ─── Day separator ──────────────────────────────────────────────────────────────
function DaySeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted px-3 py-1 rounded-full">
        <span className="text-xs font-medium text-muted-foreground">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

// ─── Single message bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg, onRetry }: { msg: Message; onRetry?: (msg: Message) => void }) {
  const isOutbound = msg.direction === 'OUTBOUND';
  const isFailed = msg.status === 'FAILED';

  if (msg.isInternal) {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 max-w-md shadow-sm">
          <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Internal note</p>
            <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap break-words">{msg.body}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2.5 mb-4', isOutbound ? 'flex-row-reverse' : 'flex-row')}>
      {!isOutbound && (
        <Avatar firstName="C" size="xs" className="flex-shrink-0 mt-1 bg-muted" />
      )}
      <div className={cn('max-w-[85%] sm:max-w-[75%] group', isOutbound ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
        {msg.replyTo && (
          <div className={cn('text-xs px-3 py-1.5 rounded-lg border-l-2 bg-muted/50', isOutbound ? 'border-primary/50' : 'border-muted-foreground/30')}>
            <span className="text-muted-foreground line-clamp-1">{msg.replyTo.body ?? `[${msg.replyTo.type}]`}</span>
          </div>
        )}
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-colors',
          isOutbound
            ? isFailed 
              ? 'bg-destructive/10 border border-destructive/30 text-foreground rounded-tr-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm hover:border-border/80',
        )}>
          {msg.type === 'TEXT' && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>}
          {msg.type === 'IMAGE' && (
            <div>
              <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground mb-1">
                [Image]
              </div>
              {msg.mediaCaption && <p className="text-xs mt-2 opacity-90">{msg.mediaCaption}</p>}
            </div>
          )}
          {(msg.type === 'DOCUMENT' || msg.type === 'AUDIO' || msg.type === 'VIDEO') && (
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4 flex-shrink-0 opacity-70" />
              <span className="font-medium">{msg.mediaFileName ?? msg.type.toLowerCase()}</span>
            </div>
          )}
          {!['TEXT','IMAGE','DOCUMENT','AUDIO','VIDEO'].includes(msg.type) && (
            <p className="text-xs italic opacity-70">[{msg.type.toLowerCase()} message]</p>
          )}
        </div>
        <div className={cn('flex items-center gap-2 px-1', isOutbound ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground">{formatRelative(msg.createdAt)}</span>
          {isOutbound && <MessageStatusIcon status={msg.status} />}
          {isFailed && isOutbound && onRetry && (
            <button
              onClick={() => onRetry(msg)}
              className="text-[10px] text-destructive hover:text-destructive/80 hover:underline font-medium transition-colors"
              aria-label="Retry sending message"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation list item ─────────────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick }: { conv: Conversation; isActive: boolean; onClick: () => void }) {
  const { unreadByConversation } = useInboxStore();
  const unread = unreadByConversation[conv.id] ?? conv.unreadCount;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all border-b border-border/50 last:border-0',
        'hover:bg-muted/70 active:bg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30',
        isActive && 'bg-primary/8 border-l-2 border-l-primary hover:bg-primary/10',
      )}
      aria-label={`Conversation with ${conv.contact.firstName} ${conv.contact.lastName ?? ''}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="relative flex-shrink-0">
        <Avatar 
          firstName={conv.contact.firstName} 
          lastName={conv.contact.lastName} 
          src={conv.contact.avatarUrl} 
          size="sm" 
        />
        {conv.status === 'OPEN' && (
          <span 
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-background" 
            aria-label="Conversation open"
            title="Open conversation"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-sm font-semibold truncate transition-colors',
            unread > 0 ? 'text-foreground' : 'text-foreground/90'
          )}>
            {conv.contact.firstName} {conv.contact.lastName ?? ''}
          </span>
          {conv.lastMessageAt && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
              {formatDate(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-xs truncate flex-1 transition-colors',
            unread > 0 
              ? 'text-foreground/80 font-medium' 
              : 'text-muted-foreground'
          )}>
            {conv.lastMessageText ? truncate(conv.lastMessageText, 45) : formatPhoneDisplay(conv.contact.phone)}
          </p>
          {unread > 0 && (
            <span 
              className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground flex-shrink-0 shadow-sm"
              aria-label={`${unread} unread messages`}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        {conv.labels.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {conv.labels.slice(0, 2).map(({ label }) => (
              <span 
                key={label.id} 
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80" 
                style={{ 
                  backgroundColor: `${label.color}20`, 
                  color: label.color 
                }}
              >
                {label.name}
              </span>
            ))}
            {conv.labels.length > 2 && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                +{conv.labels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── AI Suggestions panel ───────────────────────────────────────────────────────
function AISuggestionsPanel({ suggestions, onUse, onDismiss }: {
  suggestions: string[]; onUse: (s: string) => void; onDismiss: () => void;
}) {
  return (
    <div className="border-t border-border bg-primary/5 p-3 sm:p-4 animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">AI Suggestions</span>
        </div>
        <button 
          onClick={onDismiss} 
          className="text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-background/50 p-1"
          aria-label="Dismiss AI suggestions"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onUse(s)}
            className={cn(
              'w-full text-left text-sm bg-background border border-border rounded-lg px-3 py-2.5 transition-all text-foreground',
              'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function InboxPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const conversationParam = searchParams.get('conversation');
  
  const [activeId, setActiveId] = useState<string | null>(conversationParam);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [composerText, setComposerText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [typingTimer, setTypingTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { typingUsers, clearUnread } = useInboxStore();

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversationParam !== activeId) {
      setActiveId(conversationParam);
      setShowMobileChat(true); // Show chat on mobile when conversation selected
    }
  }, [conversationParam]);

  // Queries
  const { data: whatsappStatus } = useWhatsappStatus();
  const { data: convData, isLoading: convsLoading } = useConversations({
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
    limit: 50,
  });
  const conversations = convData?.data ?? [];
  const activeConv = conversations.find(c => c.id === activeId);

  const { data: messagesData, isLoading: msgsLoading } = useMessages(activeId ?? '', !!activeId);
  const allMessages = messagesData?.pages.flatMap(p => [...p.data].reverse()) ?? [];

  const sendMessage = useSendMessage(activeId ?? '');
  const addNote = useAddInternalNote(activeId ?? '');
  const markRead = useMarkConversationRead(activeId ?? '');
  const suggestReply = useAISuggestReply(activeId ?? '');
  const updateConv = useUpdateConversation(activeId ?? '');
  const { data: quickReplies } = useQuickReplies();

  const isTyping = activeId ? typingUsers.some(t => t.conversationId === activeId) : false;
  const statusTabs = ['OPEN', 'PENDING', 'RESOLVED', 'ARCHIVED'];

  // Group messages by day for day separators
  const messagesWithSeparators = allMessages.reduce<Array<{ type: 'message' | 'separator'; data: Message | string; key: string }>>((acc, msg, index) => {
    const currentDate = new Date(msg.createdAt).toDateString();
    const prevDate = index > 0 ? new Date(allMessages[index - 1].createdAt).toDateString() : null;
    
    if (currentDate !== prevDate) {
      acc.push({ type: 'separator', data: msg.createdAt, key: `sep-${currentDate}` });
    }
    acc.push({ type: 'message', data: msg, key: msg.id });
    return acc;
  }, []);

  // Auto-scroll to bottom only if user is already near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesWithSeparators.length]);

  // Join/leave conversation rooms
  useEffect(() => {
    if (activeId) {
      joinConversation(activeId);
      markRead.mutate();
      clearUnread(activeId);
    }
    return () => { if (activeId) leaveConversation(activeId); };
  }, [activeId]);

  const handleTyping = useCallback(() => {
    if (!activeId) return;
    emitTypingStart(activeId);
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(() => { if (activeId) emitTypingStop(activeId); }, 2000);
    setTypingTimer(t);
  }, [activeId, typingTimer]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
        if (activeId) emitTypingStop(activeId);
      }
    };
  }, [typingTimer, activeId]);

  async function handleSend() {
    if (!composerText.trim() || !activeId) return;
    const text = composerText;
    setComposerText('');
    setAiSuggestions(null);

    if (isNoteMode) {
      await addNote.mutateAsync(text);
    } else {
      await sendMessage.mutateAsync({ type: 'TEXT', body: text });
    }
    emitTypingStop(activeId);
  }

  async function handleRetryMessage(msg: Message) {
    if (!activeId || !msg.body) return;
    await sendMessage.mutateAsync({ 
      type: msg.type as 'TEXT', 
      body: msg.body 
    });
  }

  async function handleAISuggest() {
    if (!activeId) return;
    const res = await suggestReply.mutateAsync();
    setAiSuggestions(res.data.suggestions);
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left: Conversation list ── */}
      <div className={cn(
        'w-full md:w-80 flex-shrink-0 border-r border-border flex flex-col bg-background overflow-hidden',
        'md:block', // Always visible on desktop
        showMobileChat && 'hidden' // Hidden on mobile when chat is active
      )}>
        {/* WhatsApp Connection Status Banner */}
        {whatsappStatus && !whatsappStatus.connected && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-3 sm:px-4 py-3">
            <div className="flex items-start gap-2.5">
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  WhatsApp Not Connected
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Configure WhatsApp in settings to start receiving messages.
                </p>
                <Link href="/settings/whatsapp">
                  <button className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100 hover:underline focus-visible:outline-none focus-visible:underline">
                    Go to Settings →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
        {whatsappStatus && whatsappStatus.connected && (
          <div className="bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800 px-3 sm:px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-900 dark:text-green-200">
                  WhatsApp Connected
                </p>
                {whatsappStatus.phoneNumberId && (
                  <p className="text-xs text-green-700 dark:text-green-300 truncate mt-0.5">
                    ID: {whatsappStatus.phoneNumberId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="p-3 sm:p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              className={cn(
                'w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm transition-all',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                'hover:border-input/80'
              )}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide bg-background">
          {statusTabs.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'flex-1 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-all border-b-2',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50',
                statusFilter === s 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              aria-label={`Filter by ${s.toLowerCase()} conversations`}
              aria-current={statusFilter === s ? 'true' : undefined}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {convsLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <EmptyState 
                icon={<Search className="h-6 w-6" />} 
                title="No conversations" 
                description={
                  search 
                    ? `No conversations match "${search}"`
                    : statusFilter === 'OPEN' 
                      ? 'Connect WhatsApp to start receiving messages.' 
                      : `No ${statusFilter.toLowerCase()} conversations.`
                }
                className="py-8"
              />
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeId}
                onClick={() => {
                  setActiveId(conv.id);
                  setShowMobileChat(true); // Show chat on mobile
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat window ── */}
      {!activeId ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Search className="h-7 w-7" />}
            title="Select a conversation"
            description="Choose a conversation from the left to start chatting."
          />
        </div>
      ) : (
        <div className={cn(
          'flex-1 flex flex-col overflow-hidden',
          'w-full', // Full width on mobile
          !showMobileChat && 'hidden md:flex' // Hidden on mobile when list is showing
        )}>
          {/* Chat header */}
          {activeConv && (
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-border bg-background flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile back button */}
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                
                <Avatar
                  firstName={activeConv.contact.firstName}
                  lastName={activeConv.contact.lastName}
                  src={activeConv.contact.avatarUrl}
                  size="sm"
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {activeConv.contact.firstName} {activeConv.contact.lastName ?? ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{formatPhoneDisplay(activeConv.contact.phone)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={activeConv.status === 'OPEN' ? 'success' : 'muted'} className="hidden sm:inline-flex">
                  {activeConv.status.toLowerCase()}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateConv.mutate({ status: activeConv.status === 'OPEN' ? 'RESOLVED' : 'OPEN' })}
                  className="hidden sm:flex"
                >
                  {activeConv.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-0.5 scrollbar-hide">
            {msgsLoading ? (
              <div className="space-y-6 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn('flex gap-3 animate-pulse', i % 2 === 0 ? '' : 'flex-row-reverse')}>
                    {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                    <Skeleton className={cn('h-16 rounded-2xl', i % 3 === 0 ? 'w-52' : 'w-64')} />
                  </div>
                ))}
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Start the conversation by sending a message below.</p>
                </div>
              </div>
            ) : (
              messagesWithSeparators.map(item => 
                item.type === 'separator' 
                  ? <DaySeparator key={item.key} date={item.data as string} />
                  : <MessageBubble key={item.key} msg={item.data as Message} onRetry={handleRetryMessage} />
              )
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 items-center py-2">
                <Avatar firstName="C" size="xs" className="bg-muted flex-shrink-0" />
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0,1,2].map(i => (
                      <div 
                        key={i} 
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" 
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AI suggestions */}
          {aiSuggestions && (
            <AISuggestionsPanel
              suggestions={aiSuggestions}
              onUse={s => { setComposerText(s); setAiSuggestions(null); }}
              onDismiss={() => setAiSuggestions(null)}
            />
          )}

          {/* Composer */}
          <div className={cn(
            'border-t border-border bg-background p-3 sm:p-4 flex-shrink-0 transition-colors',
            isNoteMode && 'bg-amber-50/50 dark:bg-amber-950/20 border-t-amber-200 dark:border-t-amber-800'
          )}>
            {isNoteMode && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Internal note — not sent to customer</span>
                <button 
                  onClick={() => setIsNoteMode(false)} 
                  className="ml-auto text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={composerText}
                  onChange={e => { setComposerText(e.target.value); handleTyping(); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                  placeholder={isNoteMode ? 'Add an internal note…' : 'Type a message…'}
                  rows={1}
                  aria-label={isNoteMode ? 'Internal note text' : 'Message text'}
                  className={cn(
                    'w-full resize-none rounded-xl border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'transition-all duration-200 max-h-32 leading-relaxed',
                    isNoteMode 
                      ? 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700 focus:border-amber-400 focus:ring-amber-400/20' 
                      : 'border-input bg-background hover:border-input/80',
                  )}
                  style={{ minHeight: '44px' }}
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground pointer-events-none">
                  {composerText.length > 0 && `${composerText.length} chars`}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleAISuggest}
                  disabled={suggestReply.isPending || !activeId}
                  title="AI suggest reply"
                  aria-label="Get AI reply suggestions"
                  className={cn(
                    'h-10 w-10 flex items-center justify-center rounded-lg transition-all touch-manipulation',
                    'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  {suggestReply.isPending ? (
                    <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Bot className="h-4.5 w-4.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsNoteMode(!isNoteMode)}
                  title={isNoteMode ? 'Switch to customer message' : 'Switch to internal note'}
                  aria-label={isNoteMode ? 'Switch to customer message' : 'Switch to internal note'}
                  aria-pressed={isNoteMode}
                  className={cn(
                    'h-10 w-10 flex items-center justify-center rounded-lg transition-all touch-manipulation',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    isNoteMode 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/70' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Lock className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => void handleSend()}
                  disabled={!composerText.trim() || sendMessage.isPending || addNote.isPending}
                  title="Send message (Enter)"
                  aria-label="Send message"
                  className={cn(
                    'h-10 w-10 flex items-center justify-center rounded-lg transition-all touch-manipulation',
                    'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100',
                    'shadow-sm hover:shadow'
                  )}
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Quick replies hint */}
            {composerText.startsWith('/') && quickReplies && (
              <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-3 py-2 border-b border-border bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">Quick Replies</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {quickReplies
                    .filter(qr => qr.shortcut?.includes(composerText) || qr.title.toLowerCase().includes(composerText.slice(1).toLowerCase()))
                    .slice(0, 5)
                    .map(qr => (
                      <button
                        key={qr.id}
                        onClick={() => {
                          setComposerText(qr.content);
                          // Focus back on composer
                          const textarea = document.querySelector('textarea');
                          textarea?.focus();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 focus-visible:outline-none focus-visible:bg-muted"
                      >
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{qr.title}</p>
                          {qr.shortcut && (
                            <p className="text-xs text-muted-foreground">{qr.shortcut}</p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
