import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Users, TrendingUp, BookOpen, MessageSquare, UserCheck, Calendar, Zap, Target, Code2, Cpu, GitBranch, Shield, BarChart3, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectIsAuthenticated } from '../../../features/auth';
import { selectPopularMaterials } from '../../../entities/material';
import { selectActiveCommunities } from '../../../entities/community';
import { selectTopAuthors } from '../../../entities/user';
import { selectAllUsers } from '../../../entities/user';
import { PageTransition, GradientMesh, TextReveal, Button, GlassCard, AnimatedCounter, StaggerContainer, staggerItemVariants, CodeCoinIcon } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { CommunityCard } from '../../../entities/community/ui/CommunityCard';

const ADVANTAGES = [
  { icon: BookOpen, title: 'Курсы и конспекты', description: 'Тысячи материалов от студентов и менторов — от основ до продвинутых тем', color: 'text-accent-green', bg: 'bg-accent-green/10', glow: '#39FF14' },
  { icon: MessageSquare, title: 'Живые сообщества', description: 'Статьи, обсуждения и чат по темам — как Хабр, только для студентов', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', glow: '#00F0FF' },
  { icon: UserCheck, title: 'Менторство и проекты', description: 'Опытные менторы ведут реальные проекты и набирают команды', color: 'text-purple-400', bg: 'bg-purple-400/10', glow: '#A855F7' },
  { icon: Calendar, title: 'Стримы и вебинары', description: 'Расписание живых событий — воркшопы, Q&A, прямые эфиры', color: 'text-blue-400', bg: 'bg-blue-400/10', glow: '#60A5FA' },
  { icon: Target, title: 'Роадмапы развития', description: 'Персональные треки обучения с отслеживанием прогресса', color: 'text-orange-400', bg: 'bg-orange-400/10', glow: '#FB923C' },
  { icon: Zap, title: 'CodeCoins экономика', description: 'Зарабатывай монеты за контент, трать на курсы и материалы', color: 'text-yellow-400', bg: 'bg-yellow-400/10', glow: '#FACC15' },
];

const TECH_ICONS = [Code2, Cpu, GitBranch, Shield, BarChart3, Layers];

// Floating tech nodes for background decoration
function FloatingNodes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {TECH_ICONS.map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeInOut',
          }}
        >
          <Icon size={16} className="text-white/15" />
        </motion.div>
      ))}
    </div>
  );
}

// Animated connection lines between nodes
function ConnectionGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39FF14" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.line
          key={i}
          x1={`${10 + i * 12}%`}
          y1={`${20 + (i % 3) * 30}%`}
          x2={`${22 + i * 12}%`}
          y2={`${35 + ((i + 1) % 3) * 25}%`}
          stroke="url(#lineGrad)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, repeatType: 'reverse' }}
        />
      ))}
    </svg>
  );
}

// Stats card with animated glow
function StatCard({ value, label, suffix, icon: Icon, color }: { value: number; label: string; suffix?: string; icon: typeof Users; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm group overflow-hidden"
    >
      <div className={cn('absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500', color.replace('text-', 'bg-'))} />
      <Icon size={18} className={cn(color, 'mb-2')} />
      <div className="text-2xl sm:text-3xl font-bold text-white">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <p className="text-xs text-white/30 mt-1">{label}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const popularMaterials = useAppSelector(selectPopularMaterials);
  const activeCommunities = useAppSelector(selectActiveCommunities);
  const topAuthors = useAppSelector(selectTopAuthors);
  const allUsers = useAppSelector(selectAllUsers);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <PageTransition>
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <GradientMesh />
        <FloatingNodes />
        <ConnectionGrid />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 mb-8"
          >
            <Sparkles size={14} className="text-accent-green" />
            <span>Платформа обмена знаниями для IT-студентов</span>
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
            Обменивайся конспектами, зарабатывай <span className="text-accent-green font-medium">CodeCoins</span>,
            присоединяйся к IT-сообществам и прокачивай навыки вместе
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuth ? (
              <>
                <Link to="/catalog">
                  <Button size="lg" icon={<ArrowRight size={18} />}>Перейти к обучению</Button>
                </Link>
                <Link to="/communities">
                  <Button variant="secondary" size="lg">Сообщества</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" icon={<ArrowRight size={18} />}>Начать бесплатно</Button>
                </Link>
                <Link to="/catalog">
                  <Button variant="secondary" size="lg">Посмотреть каталог</Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
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

      {/* Stats section with animated cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={1247} label="Материалов" suffix="+" icon={BookOpen} color="text-accent-green" />
          <StatCard value={342} label="Студентов" icon={Users} color="text-accent-cyan" />
          <StatCard value={48} label="Менторов" icon={UserCheck} color="text-purple-400" />
          <StatCard value={15} label="Проектов" icon={GitBranch} color="text-orange-400" />
        </div>
      </section>

      {isAuth ? (
        <>
          {/* Popular Today */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <TextReveal as="h2" className="text-2xl sm:text-3xl font-bold">Популярное сегодня</TextReveal>
                <p className="text-white/30 text-sm mt-2">Самые востребованные материалы</p>
              </div>
              <Link to="/catalog">
                <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>Все материалы</Button>
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

          {/* Active Communities */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-accent-cyan" />
                  <TextReveal as="h2" className="text-2xl sm:text-3xl font-bold">Активные сообщества</TextReveal>
                </div>
                <p className="text-white/30 text-sm">Присоединяйся к IT-кластерам по интересам</p>
              </div>
              <Link to="/communities">
                <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>Все сообщества</Button>
              </Link>
            </div>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCommunities.map((community) => (
                <motion.div key={community.id} variants={staggerItemVariants}>
                  <CommunityCard community={community} />
                </motion.div>
              ))}
            </StaggerContainer>
          </section>

          {/* Top Authors */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp size={18} className="text-accent-green" />
              <TextReveal as="h2" className="text-2xl sm:text-3xl font-bold">Топ авторов недели</TextReveal>
            </div>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topAuthors.map((author, i) => (
                <motion.div key={author.id} variants={staggerItemVariants}>
                  <Link to={`/profile/${author.id}`}>
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
                      <img src={author.avatarUrl} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3 group-hover:scale-105 transition-transform" />
                      <p className="text-sm font-semibold truncate">{author.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">@{author.username}</p>
                      <div className="flex items-center justify-center gap-1 mt-2 text-accent-green text-xs font-medium">
                        <CodeCoinIcon size={12} />
                        <AnimatedCounter value={author.codeCoins} />
                      </div>
                      <p className="text-[10px] text-white/20 mt-1">{author.uploadsCount} материалов</p>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </StaggerContainer>
          </section>
        </>
      ) : (
        <>
          {/* Advantages with glow effect */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
            <div className="text-center mb-16">
              <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold mb-4">Всё для твоего роста в IT</TextReveal>
              <p className="text-white/35 max-w-xl mx-auto">Платформа, которая объединяет обучение, менторство и сообщество в одном месте</p>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ADVANTAGES.map((adv) => {
                const Icon = adv.icon;
                return (
                  <motion.div key={adv.title} variants={staggerItemVariants}>
                    <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <GlassCard className="group h-full relative overflow-hidden">
                        {/* Glow effect on hover */}
                        <div
                          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700"
                          style={{ backgroundColor: adv.glow }}
                        />
                        <div className="relative z-10">
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300', adv.bg)}>
                            <Icon size={22} className={adv.color} />
                          </div>
                          <h3 className="text-lg font-bold mb-2 group-hover:text-accent-green transition-colors">{adv.title}</h3>
                          <p className="text-sm text-white/35 leading-relaxed">{adv.description}</p>
                        </div>
                      </GlassCard>
                    </motion.div>
                  </motion.div>
                );
              })}
            </StaggerContainer>
          </section>

          {/* How it works — interactive steps */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
            <div className="text-center mb-16">
              <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold mb-4">Как это работает</TextReveal>
            </div>
            <div className="relative">
              {/* Connection line */}
              <div className="hidden sm:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-accent-green via-accent-cyan to-purple-400 opacity-20" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { step: '01', title: 'Регистрируйся', desc: 'Создай аккаунт за пару кликов и получи стартовые CodeCoins', icon: Sparkles, color: 'text-accent-green' },
                  { step: '02', title: 'Учись и делись', desc: 'Проходи курсы, загружай конспекты, зарабатывай монеты', icon: BookOpen, color: 'text-accent-cyan' },
                  { step: '03', title: 'Расти вместе', desc: 'Присоединяйся к сообществам, находи ментора, работай над проектами', icon: TrendingUp, color: 'text-purple-400' },
                ].map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="text-center relative"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4"
                      >
                        <StepIcon size={24} className={item.color} />
                      </motion.div>
                      <span className="text-4xl font-black text-gradient">{item.step}</span>
                      <h3 className="text-lg font-bold mt-3 mb-2">{item.title}</h3>
                      <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <GlassCard padding="lg" className="relative overflow-hidden">
                <GradientMesh />
                <div className="relative z-10">
                  <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold mb-4">Готов начать?</TextReveal>
                  <p className="text-white/40 mb-8 max-w-md mx-auto">Присоединяйся к платформе, получай знания и делись опытом с сообществом</p>
                  <Link to="/login">
                    <Button size="lg" icon={<Sparkles size={18} />}>Зарегистрироваться</Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          </section>
        </>
      )}
    </PageTransition>
  );
}
