import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { selectTransactionsByUser } from '../../../entities/transaction';
import { PageTransition, GlassCard, CodeCoinIcon, AnimatedCounter, Badge, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { formatDate, cn } from '../../../shared/lib';

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Покупка',
  sale: 'Продажа',
  royalty: 'Роялти',
  reward: 'Награда',
  'challenge-prize': 'Челлендж',
};

export default function WalletPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const transactions = useAppSelector(selectTransactionsByUser(user?.id || ''));

  if (!isAuth || !user) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <Wallet size={48} className="text-white/10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Кошелёк</h1>
          <p className="text-white/30 mb-4">Войдите чтобы увидеть баланс</p>
          <Link to="/login" className="text-accent-cyan hover:underline">Войти</Link>
        </div>
      </PageTransition>
    );
  }

  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const spent = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Кошелёк</h1>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <GlassCard className="text-center" glow="green">
            <CodeCoinIcon size={28} className="mx-auto mb-2" />
            <p className="text-3xl font-bold text-accent-green">
              <AnimatedCounter value={user.codeCoins} />
            </p>
            <p className="text-xs text-white/30 mt-1">Баланс</p>
          </GlassCard>
          <GlassCard className="text-center">
            <ArrowDownLeft size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-400">+<AnimatedCounter value={income} /></p>
            <p className="text-xs text-white/30 mt-1">Заработано</p>
          </GlassCard>
          <GlassCard className="text-center">
            <ArrowUpRight size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-400">-<AnimatedCounter value={spent} /></p>
            <p className="text-xs text-white/30 mt-1">Потрачено</p>
          </GlassCard>
        </div>

        {/* Transactions */}
        <h2 className="text-lg font-semibold mb-4">История транзакций</h2>
        <StaggerContainer className="space-y-2">
          {transactions.map((tx) => (
            <motion.div key={tx.id} variants={staggerItemVariants}>
              <GlassCard padding="sm" className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                )}>
                  {tx.amount > 0 ? <ArrowDownLeft size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-white/20">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-sm font-bold', tx.amount > 0 ? 'text-green-400' : 'text-red-400')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <Badge variant={tx.amount > 0 ? 'green' : 'red'} size="sm">{TYPE_LABELS[tx.type]}</Badge>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-white/30 py-12">Нет транзакций</p>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
