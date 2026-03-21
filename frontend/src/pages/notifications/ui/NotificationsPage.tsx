import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, ShoppingCart, MessageCircle, FolderGit2, Users,
  Trophy, Zap, Settings, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectIsAuthenticated } from '../../../features/auth';
import { PageTransition, GlassCard, Button, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { cn, timeAgo } from '../../../shared/lib';
import { apiClient } from '../../../shared/api/client';

interface AppNotification {
  id: string;
  type: 'purchase' | 'sale' | 'chat' | 'project' | 'mentor' | 'achievement' | 'challenge' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const TYPE_ICONS: Record<AppNotification['type'], typeof Bell> = {
  purchase: ShoppingCart,
  sale: ShoppingCart,
  chat: MessageCircle,
  project: FolderGit2,
  mentor: Users,
  achievement: Trophy,
  challenge: Zap,
  system: Settings,
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  purchase: 'text-accent-cyan bg-accent-cyan/10',
  sale: 'text-accent-green bg-accent-green/10',
  chat: 'text-blue-400 bg-blue-400/10',
  project: 'text-purple-400 bg-purple-400/10',
  mentor: 'text-orange-400 bg-orange-400/10',
  achievement: 'text-yellow-400 bg-yellow-400/10',
  challenge: 'text-pink-400 bg-pink-400/10',
  system: 'text-white/40 bg-white/[0.06]',
};

const TYPE_LABELS: Record<AppNotification['type'], string> = {
  purchase: 'Покупка', sale: 'Продажа', chat: 'Чат',
  project: 'Проект', mentor: 'Ментор', achievement: 'Достижение',
  challenge: 'Челлендж', system: 'Система',
};

export default function NotificationsPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!isAuth) return;
    setLoading(true);
    apiClient.getNotifications()
      .then((data) => setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        createdAt: n.created_at,
        link: n.link,
      }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuth]);

  const handleMarkAll = async () => {
    await apiClient.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkOne = async (id: string) => {
    await apiClient.markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const visible = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuth) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 text-center">
          <Bell size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-4">Войдите, чтобы видеть уведомления</p>
          <Link to="/login" className="text-accent-cyan hover:underline text-sm">Войти</Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-3">
              <ArrowLeft size={14} /> Назад
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Уведомления
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-green/15 text-sm font-bold text-accent-green">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={handleMarkAll}>
              Прочитать все
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-sm font-medium transition-all',
                filter === f
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              {f === 'all' ? 'Все' : 'Непрочитанные'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent-green/20 text-[10px] text-accent-green">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30">
              {filter === 'unread' ? 'Все уведомления прочитаны' : 'Нет уведомлений'}
            </p>
          </div>
        ) : (
          <StaggerContainer className="space-y-2">
            {visible.map((notif) => {
              const Icon = TYPE_ICONS[notif.type];
              return (
                <motion.div key={notif.id} variants={staggerItemVariants}>
                  <Link
                    to={notif.link || '#'}
                    onClick={() => !notif.isRead && handleMarkOne(notif.id)}
                    className={cn(
                      'flex gap-3 p-4 rounded-xl border transition-all hover:border-white/10',
                      notif.isRead
                        ? 'border-white/[0.04] bg-white/[0.01]'
                        : 'border-white/[0.06] bg-white/[0.03]'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', TYPE_COLORS[notif.type])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-white/20 border border-white/[0.06] rounded px-1.5 py-0.5">
                            {TYPE_LABELS[notif.type]}
                          </span>
                        </div>
                        <span className="text-[11px] text-white/20 flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed mt-2">{notif.message}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
