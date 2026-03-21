import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { loginAsync, selectIsAuthenticated, selectAuthLoading, selectAuthError, clearError } from '../../../features/auth';
import { testUsers } from '../../../shared/api/mocks';
import { PageTransition, GlassCard, GradientMesh, CodeCoinIcon, Badge } from '../../../shared/ui';
import { useEffect, useState } from 'react';

const IS_DEV = import.meta.env.DEV;
const DEFAULT_PASSWORD = IS_DEV ? 'password123' : '';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    if (isAuth) navigate('/');
  }, [isAuth, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleLogin = async (user: typeof testUsers[0]) => {
    setLoggingIn(user.id);
    dispatch(clearError());
    try {
      await dispatch(loginAsync({ username: user.username, password: DEFAULT_PASSWORD })).unwrap();
      navigate('/');
    } catch {
      // Error is in Redux state
    } finally {
      setLoggingIn(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative">
        <GradientMesh />
        <div className="relative z-10 w-full max-w-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-surface-900 font-bold text-xl">IT</span>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Выберите аккаунт</h1>
            <p className="text-white/40 text-sm">Войдите как один из пользователей</p>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testUsers.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <GlassCard
                  className={`cursor-pointer group text-center ${loggingIn === user.id ? 'opacity-70' : ''}`}
                  glow="green"
                  onClick={() => !loading && handleLogin(user)}
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"
                  />
                  <h3 className="font-semibold group-hover:text-accent-cyan transition-colors">{user.name}</h3>
                  <p className="text-xs text-white/30 mb-2">@{user.username}</p>
                  <Badge variant="cyan" size="sm">{user.levelTitle} • Lv.{user.level}</Badge>
                  <div className="flex items-center justify-center gap-3 mt-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400" /> {user.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <CodeCoinIcon size={10} /> {user.codeCoins}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {user.techStack.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">{tech}</span>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <span className="text-xs text-accent-green font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                      {loggingIn === user.id ? (
                        <span className="animate-pulse">Входим...</span>
                      ) : (
                        <><LogIn size={12} /> Войти</>
                      )}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
