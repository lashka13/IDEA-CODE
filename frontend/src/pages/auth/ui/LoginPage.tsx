import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  loginAsync,
  registerAsync,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from '../../../features/auth';
import { PageTransition, GradientMesh, Button } from '../../../shared/ui';
import { useEffect, useState } from 'react';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuth) navigate('/');
  }, [isAuth, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearError());
    setLocalError('');
  }, [tab, dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!username.trim() || !password.trim()) {
      setLocalError('Заполните все поля');
      return;
    }
    try {
      await dispatch(loginAsync({ username: username.trim(), password })).unwrap();
      navigate('/');
    } catch {
      // error is in Redux state
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setLocalError('Заполните все обязательные поля');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setLocalError('Пароли не совпадают');
      return;
    }
    try {
      await dispatch(
        registerAsync({
          name: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      ).unwrap();
      navigate('/');
    } catch {
      // error is in Redux state
    }
  };

  const displayError = localError || error;

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 ' +
    'focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 transition-all text-sm';

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative">
        <GradientMesh />
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-surface-900 font-bold text-xl">IT</span>
            </motion.div>
            <h1 className="text-2xl font-bold">IT-RE:SOURCE</h1>
            <p className="text-white/40 text-sm mt-1">Образовательная платформа для IT-специалистов</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-white/[0.04] rounded-xl p-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'login'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <LogIn size={15} /> Вход
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'register'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <UserPlus size={15} /> Регистрация
            </button>
          </div>

          {/* Card */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/[0.06] bg-surface-900/80 backdrop-blur-xl p-6"
          >
            {/* Error */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {displayError}
              </motion.div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Имя пользователя</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className={inputClass}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      className={inputClass}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-pulse">Входим...</span>
                  ) : (
                    <>Войти <ArrowRight size={15} /></>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Имя</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Иван Иванов"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Имя пользователя</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="username"
                    className={inputClass}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className={inputClass}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Подтвердите пароль</label>
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Повторите пароль"
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-pulse">Регистрация...</span>
                  ) : (
                    <>Создать аккаунт <UserPlus size={15} /></>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Footer hint */}
          <p className="text-center text-white/20 text-xs mt-4">
            {tab === 'login' ? (
              <>Нет аккаунта?{' '}
                <button onClick={() => setTab('register')} className="text-accent-green hover:underline">
                  Зарегистрируйтесь
                </button>
              </>
            ) : (
              <>Уже есть аккаунт?{' '}
                <button onClick={() => setTab('login')} className="text-accent-green hover:underline">
                  Войдите
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
