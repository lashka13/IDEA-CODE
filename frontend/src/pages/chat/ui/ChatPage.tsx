import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Search, SmilePlus, Reply, ChevronLeft } from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { selectAllUsers } from '../../../entities/user';
import { PageTransition, GlassCard } from '../../../shared/ui';
import { cn, timeAgo } from '../../../shared/lib';
import { mockChannels, mockMessages, type ChatChannel, type ChatMessage } from '../../../shared/api/mocks/chat';
import { Link } from 'react-router-dom';

function MessageBubble({
  message,
  allMessages,
}: {
  message: ChatMessage;
  allMessages: ChatMessage[];
}) {
  const users = useAppSelector(selectAllUsers);
  const author = users.find((u) => u.id === message.authorId);
  const replyMessage = message.replyTo ? allMessages.find((m) => m.id === message.replyTo) : null;
  const replyAuthor = replyMessage ? users.find((u) => u.id === replyMessage.authorId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors rounded-lg"
    >
      <img src={author?.avatarUrl} alt="" className="w-9 h-9 rounded-lg flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white/90">{author?.name}</span>
          <span className="text-[10px] text-white/20">{timeAgo(message.createdAt)}</span>
        </div>

        {replyMessage && (
          <div className="flex items-center gap-2 mb-1 pl-3 border-l-2 border-accent-cyan/30 text-xs text-white/30">
            <Reply size={10} />
            <span className="font-medium text-white/40">{replyAuthor?.name}</span>
            <span className="truncate">{replyMessage.text.slice(0, 60)}...</span>
          </div>
        )}

        <p className="text-sm text-white/70 leading-relaxed break-words">{message.text}</p>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-white/40">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [activeChannel, setActiveChannel] = useState<ChatChannel>(mockChannels[0]);
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelMessages = localMessages
    .filter((m) => m.channelId === activeChannel.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const generalChannels = mockChannels.filter((c) => c.type === 'general');
  const topicChannels = mockChannels.filter((c) => c.type === 'topic');

  const filteredChannels = searchQuery
    ? mockChannels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  useEffect(() => {
    // Only scroll within the messages container, not the whole page
    const el = messagesEndRef.current;
    if (el) {
      const container = el.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
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

  if (!isAuth) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 pt-24 pb-16 text-center">
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Войдите, чтобы участвовать в чатах</h2>
            <p className="text-sm text-white/40 mb-6">Общение доступно авторизованным пользователям</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent-green to-accent-cyan text-surface-900">
              Войти
            </Link>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-4">
        <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-white/[0.06]">
          {/* Sidebar */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 bg-surface-900/50 border-r border-white/[0.04] flex flex-col overflow-hidden"
              >
                <div className="p-3">
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск каналов..."
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-accent-green/20"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
                  {filteredChannels ? (
                    <div className="space-y-0.5">
                      {filteredChannels.map((ch) => (
                        <ChannelButton key={ch.id} channel={ch} active={activeChannel.id === ch.id} onClick={() => { setActiveChannel(ch); setSearchQuery(''); }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white/20 px-2 mb-1">Общие</p>
                        <div className="space-y-0.5">
                          {generalChannels.map((ch) => (
                            <ChannelButton key={ch.id} channel={ch} active={activeChannel.id === ch.id} onClick={() => setActiveChannel(ch)} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white/20 px-2 mb-1">По темам</p>
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

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0 bg-surface-900/30">
            {/* Channel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] bg-surface-900/50">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-white/30 lg:hidden"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-lg">{activeChannel.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{activeChannel.name}</h3>
                <p className="text-[10px] text-white/30 truncate">{activeChannel.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/20">
                <Users size={12} />
                {activeChannel.memberCount}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
              {channelMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-4xl mb-3">{activeChannel.emoji}</span>
                  <h3 className="text-lg font-semibold mb-1">Добро пожаловать в #{activeChannel.name}</h3>
                  <p className="text-sm text-white/30">{activeChannel.description}</p>
                  <p className="text-xs text-white/15 mt-2">Будьте первым, кто напишет сообщение!</p>
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} allMessages={localMessages} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 focus-within:border-accent-green/20 transition-colors">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Написать в #${activeChannel.name}...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                />
                <button className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                  <SmilePlus size={16} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    inputValue.trim()
                      ? 'text-accent-green hover:bg-accent-green/10'
                      : 'text-white/10 cursor-not-allowed'
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

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
