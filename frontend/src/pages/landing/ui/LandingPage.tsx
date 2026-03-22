import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import { selectPopularMaterials, selectAllMaterials } from '../../../entities/material';
import { selectTopAuthors, selectAllUsers } from '../../../entities/user';
import { PageTransition, GradientMesh, TextReveal, Button, GlassCard, AnimatedCounter, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';

export default function LandingPage() {
  const popularMaterials = useAppSelector(selectPopularMaterials);
  const topAuthors = useAppSelector(selectTopAuthors);
  const allUsers = useAppSelector(selectAllUsers);
  const allMaterials = useAppSelector(selectAllMaterials);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <GradientMesh />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 mb-8"
          >
            <Sparkles size={14} className="text-accent-green" />
            <span>Платформа для роста IT-специалистов</span>
          </motion.div>

          <TextReveal as="h1" className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6" delay={0.2}>
            Учись. Делись. Расти.
          </TextReveal>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Решай задачи, изучай кейсы менторов и прокачивай навыки вместе с сообществом
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/catalog">
              <Button size="lg" icon={<ArrowRight size={18} />}>
                Кейсы менторов
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="secondary" size="lg">
                Задачи
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex items-center justify-center gap-8 sm:gap-16 mt-16"
          >
            {[
              { value: allMaterials.length || 1247, label: 'Материалов', suffix: '+' },
              { value: allUsers.length || 342, label: 'Студентов' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs sm:text-sm text-white/30 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-white/30"
            />
          </div>
        </motion.div>
      </section>

      {/* Popular Today */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <TextReveal as="h2" className="text-2xl sm:text-3xl font-bold">
              Популярные кейсы
            </TextReveal>
            <p className="text-white/30 text-sm mt-2">Самые востребованные кейсы от менторов</p>
          </div>
          <Link to="/catalog">
            <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
              Все кейсы
            </Button>
          </Link>
        </div>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularMaterials.slice(0, 8).map((material) => (
            <motion.div key={material.id} variants={staggerItemVariants}>
              <MaterialCard material={material} author={allUsers.find(u => u.id === material.authorId)} />
            </motion.div>
          ))}
        </StaggerContainer>
      </section>

      {/* Top Mentors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp size={18} className="text-accent-green" />
          <TextReveal as="h2" className="text-2xl sm:text-3xl font-bold">
            Топ менторов
          </TextReveal>
        </div>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topAuthors.map((mentor, i) => (
            <motion.div key={mentor.id} variants={staggerItemVariants}>
              <Link to={`/profile/${mentor.id}`}>
                <GlassCard className="text-center group cursor-pointer" glow={i === 0 ? 'green' : 'none'}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold',
                    i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                    i === 1 ? 'bg-white/10 text-white/60' :
                    i === 2 ? 'bg-amber-900/30 text-amber-400' :
                    'bg-white/[0.04] text-white/30'
                  )}>
                    #{i + 1}
                  </div>
                  <img src={mentor.avatarUrl} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3 group-hover:scale-105 transition-transform" />
                  <p className="text-sm font-semibold truncate">{mentor.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">@{mentor.username}</p>
                  <p className="text-[10px] text-white/20 mt-2">{mentor.uploadsCount} кейсов</p>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </StaggerContainer>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <GlassCard padding="lg" className="relative overflow-hidden">
          <GradientMesh />
          <div className="relative z-10">
            <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold mb-4">
              Готов расти?
            </TextReveal>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              Присоединяйся к платформе, решай задачи с AI-анализом и прокачивай навыки
            </p>
            <Link to="/login">
              <Button size="lg" icon={<Sparkles size={18} />}>
                Начать сейчас
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>
    </PageTransition>
  );
}
