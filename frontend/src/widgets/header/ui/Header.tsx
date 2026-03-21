import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogIn, LogOut, Menu, X, Bell, ShoppingCart, MessageCircle, FolderGit2, Users, Trophy, Zap, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../../../features/auth';
import { CodeCoinIcon, Button } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { APP_NAME } from '../../../shared/config/constants';
import { HeaderSearch } from './HeaderSearch';
import { mockNotifications, type AppNotification } from '../../../shared/api/mocks/notifications';
import { timeAgo } from '../../../shared/lib';
import Wallet from '../../../pages/wallet';

const NOTIF_ICONS: Record<AppNotification['type'], typeof Bell> = {
  purchase: ShoppingCart,
  sale: ShoppingCart,
  chat: MessageCircle,
  project: FolderGit2,
  mentor: Users,
  achievement: Trophy,
  challenge: Zap,
  system: Settings,
};

const NOTIF_COLORS: Record<AppNotification['type'], string> = {
  purchase: 'text-accent-cyan bg-accent-cyan/10',
  sale: 'text-accent-green bg-accent-green/10',
  chat: 'text-blue-400 bg-blue-400/10',
  project: 'text-purple-400 bg-purple-400/10',
  mentor: 'text-orange-400 bg-orange-400/10',
  achievement: 'text-yellow-400 bg-yellow-400/10',
  challenge: 'text-pink-400 bg-pink-400/10',
  system: 'text-white/40 bg-white/[0.06]',
};

function NotificationDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-2xl border border-white/[0.06] bg-surface-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-accent-green/15 text-[10px] font-bold text-accent-green">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-accent-cyan hover:text-accent-cyan/80 transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            {notifications.map((notif) => {
              const Icon = NOTIF_ICONS[notif.type];
              return (
                <Link
                  key={notif.id}
                  to={notif.link || '#'}
                  onClick={onClose}
                  className={cn(
                    'flex gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0',
                    !notif.read && 'bg-white/[0.02]'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', NOTIF_COLORS[notif.type])}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold truncate">{notif.title}</p>
                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-white/20 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/catalog', label: 'Обучение' },
    { path: '/communities', label: 'Сообщества' },
    { path: '/mentors', label: 'Менторы' },
    { path: '/schedule', label: 'Расписание' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-surface-900/80 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center">
              <span className="text-surface-900 font-bold text-sm">IT</span>
            </div>
            <span className="text-lg font-bold hidden sm:block">
              <span className="text-white group-hover:text-gradient transition-all duration-300">{APP_NAME}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname.startsWith(item.path)
                    ? 'text-white bg-white/[0.06]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              <Search size={18} />
            </button>

            {isAuth && user ? (
              <div className="flex items-center gap-1.5">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-accent-green flex items-center justify-center ring-2 ring-surface-900">
                        <span className="text-[8px] font-bold text-surface-900">{unreadCount}</span>
                      </span>
                    )}
                  </button>
                  <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
                </div>

                {/* Profile block */}
                <div className="hidden sm:flex items-center ml-1 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                  <Link
                    to="/profile"
                    className="flex items-center pl-2 pr-2 py-1.5 hover:bg-white/[0.05] transition-all duration-200 group"
                  >
                    <div className="relative">
                      <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg ring-1 ring-white/10 group-hover:ring-accent-green/30 transition-all" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-green ring-[1.5px] ring-surface-900" />
                    </div>
                  </Link>
                  <div className="w-px h-5 bg-white/[0.08]" />
                  <Link
                    to="/wallet"
                    className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-white/[0.05] transition-all duration-200"
                  >
                    <CodeCoinIcon size={12} />
                    <span className="text-xs font-bold text-accent-green">{user.codeCoins}</span>
                  </Link>
                  <div className="w-px h-5 bg-white/[0.08]" />
                  <button
                    onClick={() => { dispatch(logout()); navigate('/login'); }}
                    className="px-2.5 py-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <LogOut size={14} />
                  </button>
                </div>

                {/* Mobile: compact profile */}
                <Link
                  to="/profile"
                  className="sm:hidden p-1.5 rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg" />
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<LogIn size={14} />}
                onClick={() => navigate('/login')}
              >
                <span className="hidden sm:inline">Войти</span>
              </Button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-900/95 backdrop-blur-xl border-t border-white/[0.06]"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    location.pathname.startsWith(item.path)
                      ? 'text-white bg-white/[0.06]'
                      : 'text-white/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAuth && (
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50"
                >
                  <Wallet /> Кошелёк
                  <span className="ml-auto text-accent-green">{user?.codeCoins} CC</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <HeaderSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
}
