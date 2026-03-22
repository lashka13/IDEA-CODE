import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Upload, ShoppingBag, Award, Settings, Brain, Target, Lightbulb, TrendingUp, AlertTriangle, Timer, BarChart3, Sparkles } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllUsers } from '../../../entities/user';
import { selectAllMaterials } from '../../../entities/material';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { selectPurchasedIds } from '../../../features/buy-material';
import { selectAllAchievements } from '../../../entities/achievement';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { PageTransition, GlassCard, Tabs, Badge, CodeCoinIcon, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { formatDate, cn } from '../../../shared/lib';

const SKILL_COLORS: Record<string, string> = {
  Frontend: '#61DAFB',
  Backend: '#00ADD8',
  DevOps: '#2496ED',
  'Data Science': '#FF6F00',
  Mobile: '#A855F7',
  Security: '#FF1744',
};

function SkillRadar({ skills }: { skills: Record<string, number> }) {
  const entries = Object.entries(skills);
  const cx = 120, cy = 120, r = 90;
  const angleStep = (2 * Math.PI) / entries.length;

  const points = entries.map(([, val], i) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });

  const labelPoints = entries.map(([name], i) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = r + 20;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle), name };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={entries.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const dist = scale * r;
            return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {entries.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        points={polygon}
        fill="url(#radar-gradient)"
        fillOpacity="0.15"
        stroke="url(#radar-gradient)"
        strokeWidth="2"
      />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={SKILL_COLORS[entries[i][0]] || '#39FF14'} />
      ))}
      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          className="text-[9px] fill-white/40">{p.name}</text>
      ))}
      <defs>
        <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39FF14" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GrowGradeMetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 7 ? 'bg-accent-green' : value >= 4 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 w-4 shrink-0">{icon}</span>
      <span className="text-[11px] text-white/50 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value * 10}%` }} />
      </div>
      <span className="text-[10px] text-white/40 w-5 text-right">{value}</span>
    </div>
  );
}

function GrowGradeProfileSection({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const navigate = useNavigate();
  const [data, setData] = useState<{
    total_analyses: number;
    avg_score: number;
    dominant_level: string;
    avg_metrics: Record<string, number>;
    all_patterns?: string[];
    ai_summary?: string | null;
    top_strengths?: string[];
    top_weaknesses?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = isOwnProfile
      ? apiClient.getThinkingSummary()
      : apiClient.getUserThinkingSummary(userId);
    fetch.then(setData).catch(() => null).finally(() => setLoading(false));
  }, [userId, isOwnProfile]);

  if (loading || !data || data.total_analyses === 0) return null;

  const scoreColor = data.avg_score >= 7 ? 'text-accent-green' : data.avg_score >= 4 ? 'text-yellow-400' : 'text-red-400';

  return (
    <GlassCard className="mb-6 !border-amber-500/10 !bg-amber-500/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain size={14} className="text-amber-400" />
          <span className="text-amber-400">GrowGrade</span>
          <span className="text-white/40 font-normal">— Когнитивный профиль</span>
        </h3>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/growgrade')}
            className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            Подробнее →
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score & Level */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
            data.avg_score >= 7 ? 'bg-accent-green/10' : data.avg_score >= 4 ? 'bg-yellow-400/10' : 'bg-red-400/10'
          )}>
            <span className={cn('text-2xl font-bold', scoreColor)}>{data.avg_score}</span>
            <span className="text-[8px] text-white/25">/10</span>
          </div>
          <div>
            <Badge variant={data.dominant_level === 'Senior' ? 'green' : data.dominant_level === 'Middle' ? 'cyan' : 'default'}>
              {data.dominant_level}
            </Badge>
            <p className="text-[10px] text-white/30 mt-1">{data.total_analyses} анализов</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-1.5">
          <GrowGradeMetricBar label="Декомпозиция" value={data.avg_metrics.problem_decomposition || 0} icon={<Target size={8} />} />
          <GrowGradeMetricBar label="Гипотезы" value={data.avg_metrics.hypothesis_testing || 0} icon={<Lightbulb size={8} />} />
          <GrowGradeMetricBar label="Абстракция" value={data.avg_metrics.abstraction_level || 0} icon={<TrendingUp size={8} />} />
          <GrowGradeMetricBar label="Дебаггинг" value={data.avg_metrics.debugging_approach || 0} icon={<AlertTriangle size={8} />} />
          <GrowGradeMetricBar label="Время" value={data.avg_metrics.time_management || 0} icon={<Timer size={8} />} />
        </div>

        {/* Patterns or AI Summary */}
        <div>
          {data.ai_summary ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-400/40 mb-1 flex items-center gap-1">
                <Sparkles size={8} /> AI-саммари
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed line-clamp-4">{data.ai_summary}</p>
            </div>
          ) : data.all_patterns && data.all_patterns.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-white/20 mb-2">Паттерны мышления</p>
              <div className="flex flex-wrap gap-1">
                {data.all_patterns.slice(0, 6).map((p, i) => (
                  <span key={i} className="text-[9px] text-amber-400/60 bg-amber-400/[0.06] px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const users = useAppSelector(selectAllUsers);
  const materials = useAppSelector(selectAllMaterials);
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const purchasedIds = useAppSelector(selectPurchasedIds);
  const achievements = useAppSelector(selectAllAchievements);
  const [activeTab, setActiveTab] = useState('uploads');

  const profileUser = id ? users.find((u) => u.id === id) : currentUser;

  if (!profileUser) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <h1 className="text-2xl font-bold">Пользователь не найден</h1>
          {!isAuth && <Link to="/login" className="text-accent-cyan text-sm mt-4 inline-block">Войти</Link>}
        </div>
      </PageTransition>
    );
  }

  const userMaterials = materials.filter((m) => m.authorId === profileUser.id);
  const purchasedMaterials = materials.filter((m) => purchasedIds.includes(m.id));
  const userAchievements = achievements.filter((a) => profileUser.achievementIds.includes(a.id));

  const RARITY_COLORS = {
    common: 'border-white/10 bg-white/[0.02]',
    rare: 'border-blue-500/20 bg-blue-500/5',
    epic: 'border-purple-500/20 bg-purple-500/5',
    legendary: 'border-yellow-500/20 bg-yellow-500/5 glow-green',
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Profile header */}
        <GlassCard className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={profileUser.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-2xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <Badge variant="cyan" size="md">{profileUser.levelTitle}</Badge>
              {!id && isAuth && (
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                >
                  <Settings size={12} /> Редактировать
                </button>
              )}
            </div>
            <p className="text-sm text-white/30 mb-3">@{profileUser.username}</p>
            <p className="text-sm text-white/50 mb-4">{profileUser.bio}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" /> {profileUser.rating}</span>
              <span className="flex items-center gap-1"><CodeCoinIcon size={14} /> <span className="text-accent-green font-semibold">{profileUser.codeCoins}</span></span>
              <span className="flex items-center gap-1 text-white/30"><Upload size={14} /> {profileUser.uploadsCount}</span>
              <span className="flex items-center gap-1 text-white/30"><ShoppingBag size={14} /> {profileUser.purchasesCount}</span>
              <span className="flex items-center gap-1 text-white/30"><Calendar size={14} /> {formatDate(profileUser.joinedAt)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Skills + Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <GlassCard>
            <h3 className="text-sm font-semibold mb-4">Карта навыков</h3>
            <SkillRadar skills={profileUser.skills} />
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {profileUser.techStack.map((tech) => (
                <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Award size={14} className="text-accent-green" /> Достижения ({userAchievements.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {userAchievements.map((ach) => (
                <div key={ach.id} className={cn('p-3 rounded-xl border text-center', RARITY_COLORS[ach.rarity])}>
                  <span className="text-2xl block mb-1">{ach.icon}</span>
                  <p className="text-xs font-medium">{ach.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{ach.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* GrowGrade Thinking Profile */}
        <GrowGradeProfileSection userId={profileUser.id} isOwnProfile={!id || profileUser.id === currentUser?.id} />

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'uploads', label: `Загрузки (${userMaterials.length})` },
            ...(profileUser.id === currentUser?.id ? [{ id: 'purchases', label: `Покупки (${purchasedMaterials.length})` }] : []),
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        {activeTab === 'uploads' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userMaterials.map((mat) => (
              <motion.div key={mat.id} variants={staggerItemVariants}>
                <MaterialCard material={mat} author={profileUser} />
              </motion.div>
            ))}
            {userMaterials.length === 0 && <p className="text-white/30 text-center py-12 col-span-full">Нет загруженных материалов</p>}
          </StaggerContainer>
        )}

        {activeTab === 'purchases' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedMaterials.map((mat) => (
              <motion.div key={mat.id} variants={staggerItemVariants}>
                <MaterialCard material={mat} author={users.find((u) => u.id === mat.authorId)} />
              </motion.div>
            ))}
            {purchasedMaterials.length === 0 && <p className="text-white/30 text-center py-12 col-span-full">Нет покупок</p>}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
