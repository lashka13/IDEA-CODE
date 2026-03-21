import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Heart,
  MessageCircle,
  Search,
  Send,
  SmilePlus,
  Users,
  ChevronLeft,
  Reply,
  TrendingUp,
  Clock,
  Flame,
  PanelRightOpen,
  PanelRightClose,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllCommunities } from '../../../entities/community';
import { selectAllUsers } from '../../../entities/user';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { PageTransition, } from '../../../shared/ui';
import { cn, timeAgo } from '../../../shared/lib';
import { mockPosts } from '../../../shared/api/mocks/posts';
import { mockChannels, mockMessages, type ChatChannel, type ChatMessage } from '../../../shared/api/mocks/chat';

type SortMode = 'hot' | 'new' | 'top';

function ChannelButton({ channel, active, onClick }: { channel: ChatChannel; active: boolean; onClick: () => void }) {
  const channelMessages = mockMessages.filter((m) => m.channelId === channel.id);
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all',
        active ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
      )}
    >
      <span className="text-sm">{channel.emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium block truncate">{channel.name}</span>
      </div>
      {channelMessages.length > 0 && (
        <span className="text-[10px] text-white/15">{channelMessages.length}</span>
      )}
    </button>
  );
}

function MessageBubble({ message, allMessages }: { message: ChatMessage; allMessages: ChatMessage[] }) {
  const users = useAppSelector(selectAllUsers);
  const author = users.find((u) => u.id === message.authorId);
  const replyMessage = message.replyTo ? allMessages.find((m) => m.id === message.replyTo) : null;
  const replyAuthor = replyMessage ? users.find((u) => u.id === replyMessage.authorId) : null;

  return (
    <div className="group flex gap-2.5 px-3 py-1.5 hover:bg-white/[0.02] transition-colors rounded-lg">
      <img src={author?.avatarUrl} alt="" className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white/90">{author?.name?.split(' ')[0]}</span>
          <span className="text-[9px] text-white/20">{timeAgo(message.createdAt)}</span>
        </div>
        {replyMessage && (
          <div className="flex items-center gap-1.5 mb-0.5 pl-2 border-l-2 border-accent-cyan/30 text-[10px] text-white/30">
            <Reply size={8} />
            <span className="font-medium text-white/40">{replyAuthor?.name?.split(' ')[0]}</span>
            <span className="truncate">{replyMessage.text.slice(0, 40)}...</span>
          </div>
        )}
        <p className="text-xs text-white/60 leading-relaxed break-words">{message.text}</p>
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {message.reactions.map((r, i) => (
              <button key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[10px] transition-colors">
                <span>{r.emoji}</span>
                <span className="text-white/40">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const communities = useAppSelector(selectAllCommunities);
  const allUsers = useAppSelector(selectAllUsers);
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuth = useAppSelector(selectIsAuthenticated);

  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>(mockChannels[0]);
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatExpanded, setChatExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generalChannels = mockChannels.filter((c) => c.type === 'general');
  const topicChannels = mockChannels.filter((c) => c.type === 'topic');
  const filteredChannels = searchQuery
    ? mockChannels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const channelMessages = localMessages
    .filter((m) => m.channelId === activeChannel.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Sort posts
  const sortedPosts = [...mockPosts].sort((a, b) => {
    if (sortMode === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortMode === 'top') return b.likesCount - a.likesCount;
    // hot = likes + comments weighted by recency
    const scoreA = a.likesCount + a.commentsCount * 2;
    const scoreB = b.likesCount + b.commentsCount * 2;
    return scoreB - scoreA;
  });

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      const container = el.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [channelMessages.length, activeChannel.id]);

  const handleSend = () => {
    if (!inputValue.trim() || !currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg-local-${Date.now()}`,
      channelId: activeChannel.id,
      authorId: currentUser.id,
      text: inputValue.trim(),
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);
    setInputValue('');
  };

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-4">
        <div className="flex gap-5" style={{ height: 'calc(100vh - 120px)' }}>

          {/* === LEFT: Articles feed === */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Сообщества</h1>
                <p className="text-xs text-white/35 mt-0.5">Статьи, обсуждения и обмен опытом</p>
              </div>
              {isAuth && (
                <Link
                  to="/add-material"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 hover:bg-accent-green/20 transition-all text-accent-green text-sm font-medium"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Написать статью</span>
                </Link>
              )}
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 mb-4 flex-shrink-0">
              {([
                { value: 'hot' as const, label: 'Горячее', icon: Flame },
                { value: 'new' as const, label: 'Новое', icon: Clock },
                { value: 'top' as const, label: 'Лучшее', icon: TrendingUp },
              ]).map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSortMode(s.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      sortMode === s.value
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                    )}
                  >
                    <Icon size={12} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Articles feed */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {sortedPosts.map((post) => {
                const author = allUsers.find((u) => u.id === post.authorId);
                const community = communities.find((c) => c.id === post.communityId);
                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all group"
                  >
                    {/* Meta line */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <img src={author?.avatarUrl} alt="" className="w-6 h-6 rounded-md" />
                      <span className="text-xs font-medium text-white/60">{author?.name}</span>
                      <span className="text-[10px] text-white/20">·</span>
                      {community && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/35">
                          {community.iconEmoji} {community.name}
                        </span>
                      )}
                      <span className="text-[10px] text-white/15 ml-auto">{timeAgo(post.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold mb-1.5 group-hover:text-accent-green transition-colors leading-snug">
                      {post.title}
                    </h3>

                    {/* Content preview */}
                    <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-3">
                      {post.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-white/25 hover:text-red-400 transition-colors text-xs">
                        <Heart size={14} />
                        <span>{post.likesCount}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-white/25 hover:text-accent-cyan transition-colors text-xs">
                        <MessageCircle size={14} />
                        <span>{post.commentsCount}</span>
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          {/* Chat toggle button (when collapsed) */}
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="hidden lg:flex flex-shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all self-start text-white/40 hover:text-white/60"
            >
              <PanelRightOpen size={14} />
              <span className="text-xs">Чат</span>
            </button>
          )}

          {/* === RIGHT: Chat sidebar === */}
          <AnimatePresence>
          {chatOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: chatExpanded ? 600 : 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-shrink-0 flex-col rounded-2xl border border-white/[0.06] overflow-hidden bg-surface-900/50"
          >
            {/* Chat channel header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04] bg-surface-900/60">
              <button
                onClick={() => setShowChannels(!showChannels)}
                className={cn(
                  'p-1 rounded-md hover:bg-white/[0.06] text-white/30 transition-all',
                  showChannels && 'rotate-0',
                  !showChannels && '-rotate-90'
                )}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm">{activeChannel.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{activeChannel.name}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/20">
                <Users size={10} />
                {activeChannel.memberCount}
              </div>
              <button
                onClick={() => setChatExpanded(!chatExpanded)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-all"
                title={chatExpanded ? 'Сузить' : 'Расширить'}
              >
                {chatExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-all"
                title="Скрыть чат"
              >
                <PanelRightClose size={12} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Channel list */}
              <AnimatePresence>
                {showChannels && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 140, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex-shrink-0 border-r border-white/[0.04] flex flex-col overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="relative mb-2">
                        <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск..."
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md pl-6 pr-2 py-1.5 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-accent-green/20"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-1.5 space-y-2 custom-scrollbar">
                      {filteredChannels ? (
                        <div className="space-y-0.5">
                          {filteredChannels.map((ch) => (
                            <ChannelButton key={ch.id} channel={ch} active={activeChannel.id === ch.id} onClick={() => { setActiveChannel(ch); setSearchQuery(''); }} />
                          ))}
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-white/15 px-2 mb-0.5">Общие</p>
                            <div className="space-y-0.5">
                              {generalChannels.map((ch) => (
                                <ChannelButton key={ch.id} channel={ch} active={activeChannel.id === ch.id} onClick={() => setActiveChannel(ch)} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-white/15 px-2 mb-0.5">Темы</p>
                            <div className="space-y-0.5">
                              {topicChannels.map((ch) => (
                                <ChannelButton key={ch.id} channel={ch} active={activeChannel.id === ch.id} onClick={() => setActiveChannel(ch)} />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
                  {channelMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <span className="text-2xl mb-2">{activeChannel.emoji}</span>
                      <p className="text-xs font-semibold mb-0.5">#{activeChannel.name}</p>
                      <p className="text-[10px] text-white/25">{activeChannel.description}</p>
                    </div>
                  ) : (
                    channelMessages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} allMessages={localMessages} />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isAuth && (
                  <div className="p-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 focus-within:border-accent-green/20 transition-colors">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`#${activeChannel.name}...`}
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none"
                      />
                      <button className="p-1 rounded text-white/20 hover:text-white/40 transition-colors">
                        <SmilePlus size={12} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                          'p-1 rounded transition-all',
                          inputValue.trim() ? 'text-accent-green hover:bg-accent-green/10' : 'text-white/10 cursor-not-allowed'
                        )}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          )}
          </AnimatePresence>

        </div>
      </div>
    </PageTransition>
  );
}
