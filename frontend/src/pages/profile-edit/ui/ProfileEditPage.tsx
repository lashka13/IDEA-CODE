import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, X, Plus, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectCurrentUser, selectIsAuthenticated, updateProfileAsync } from '../../../features/auth';
import { PageTransition, GlassCard, Button, Input } from '../../../shared/ui';
import { cn } from '../../../shared/lib';

const SUGGESTED_TECH = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin',
  'Node.js', 'FastAPI', 'Django', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis',
  'GraphQL', 'Flutter', 'Swift', 'TensorFlow', 'PyTorch',
];

const SKILL_CATEGORIES = ['Frontend', 'Backend', 'DevOps', 'Data Science', 'Mobile', 'Security'];

const AVATAR_SEEDS = ['Felix', 'Mia', 'Zoe', 'Max', 'Leo', 'Luna', 'Nova', 'Orion', 'Kai', 'Sky', 'Ace', 'Blaze'];

export default function ProfileEditPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarSeed, setAvatarSeed] = useState(currentUser?.username || 'default');
  const [techStack, setTechStack] = useState<string[]>(currentUser?.techStack || []);
  const [techInput, setTechInput] = useState('');
  const [skills, setSkills] = useState<Record<string, number>>(
    currentUser?.skills || { Frontend: 50, Backend: 50, DevOps: 30, 'Data Science': 20, Mobile: 20, Security: 20 }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!isAuth || !currentUser) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 pt-24 text-center">
          <p className="text-white/40 mb-4">Войдите для редактирования профиля</p>
          <Link to="/login" className="text-accent-cyan hover:underline text-sm">Войти</Link>
        </div>
      </PageTransition>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}`;

  const addTech = (tag: string) => {
    if (tag && !techStack.includes(tag) && techStack.length < 10) {
      setTechStack([...techStack, tag]);
      setTechInput('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Имя обязательно'); return; }
    setSaving(true);
    setError('');
    try {
      await dispatch(updateProfileAsync({
        name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        tech_stack: techStack,
        skills,
      })).unwrap();
      setSaved(true);
      setTimeout(() => navigate('/profile'), 1200);
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={14} /> Профиль
        </Link>
        <h1 className="text-3xl font-bold mb-8">Редактировать профиль</h1>

        <div className="space-y-5">
          {/* Avatar */}
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <User size={14} className="text-accent-cyan" /> Аватар
            </h2>
            <div className="flex items-center gap-6">
              <motion.img
                key={avatarSeed}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={avatarUrl}
                alt=""
                className="w-24 h-24 rounded-2xl border border-white/[0.08]"
              />
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-3">Выберите стиль аватара:</p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      onClick={() => setAvatarSeed(seed)}
                      className={cn(
                        'w-10 h-10 rounded-xl overflow-hidden border-2 transition-all',
                        avatarSeed === seed ? 'border-accent-green scale-110' : 'border-transparent hover:border-white/20'
                      )}
                    >
                      <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`} alt={seed} />
                    </button>
                  ))}
                  <button
                    onClick={() => setAvatarSeed(String(Math.random()))}
                    className="w-10 h-10 rounded-xl border border-white/[0.08] hover:border-white/20 flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Basic info */}
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Имя *</label>
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">О себе</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе, своём опыте и интересах..."
                  rows={3}
                  maxLength={300}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-green/30 resize-none transition-colors"
                />
                <p className="text-[10px] text-white/20 mt-1 text-right">{bio.length}/300</p>
              </div>
            </div>
          </GlassCard>

          {/* Tech stack */}
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4">Стек технологий</h2>
            <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
              {techStack.map((tech) => (
                <span key={tech} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] text-xs text-white/70 border border-white/[0.08]">
                  {tech}
                  <button onClick={() => setTechStack(techStack.filter((t) => t !== tech))} className="text-white/30 hover:text-red-400 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {techStack.length < 10 && (
                <input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTech(techInput.trim())}
                  placeholder="+ Добавить"
                  className="bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none min-w-[80px]"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TECH.filter((t) => !techStack.includes(t)).slice(0, 12).map((tech) => (
                <button
                  key={tech}
                  onClick={() => addTech(tech)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-white/30 hover:border-accent-cyan/30 hover:text-accent-cyan/60 transition-all"
                >
                  <Plus size={9} /> {tech}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Skills */}
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4">Уровень навыков</h2>
            <div className="space-y-4">
              {SKILL_CATEGORIES.map((skill) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/60">{skill}</span>
                    <span className="text-xs font-bold text-accent-green">{skills[skill] ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={skills[skill] ?? 0}
                    onChange={(e) => setSkills({ ...skills, [skill]: Number(e.target.value) })}
                    className="w-full h-1.5 appearance-none rounded-full bg-white/[0.06] cursor-pointer accent-accent-green"
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Error */}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/profile" className="flex-1">
              <Button variant="secondary" className="w-full">Отмена</Button>
            </Link>
            <Button
              className="flex-1"
              icon={saved ? undefined : <Save size={14} />}
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saved ? '✓ Сохранено' : saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
