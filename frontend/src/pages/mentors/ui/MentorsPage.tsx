import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Filter,
  Search,
  ArrowLeft,
  Users,
  UserPlus,
  Rocket,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { bookSession } from '../../../features/mentor-sessions';
import { PageTransition, GlassCard, Button, Badge, CodeCoinIcon, Modal } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { mockMentors, type Mentor } from '../../../shared/api/mocks/mentors';
import {
  mockProjects,
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_LABELS,
  type Project,
  type ProjectRole,
  type ProjectStatus,
} from '../../../shared/api/mocks/projects';

function MentorCard({ mentor, onClick }: { mentor: Mentor; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="text-left w-full"
    >
      <GlassCard className="h-full flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img src={mentor.avatarUrl} alt={mentor.name} className="w-16 h-16 rounded-2xl object-cover" />
            <span className={cn('absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-800', mentor.available ? 'bg-accent-green' : 'bg-white/20')} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{mentor.name}</h3>
            <p className="text-xs text-white/40">{mentor.title}</p>
            <p className="text-xs text-accent-cyan">{mentor.company}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold">{mentor.rating}</span>
            </div>
            <p className="text-[10px] text-white/30">{mentor.reviewCount} отзывов</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="text-sm font-bold">{mentor.experience}</p>
            <p className="text-[10px] text-white/30">Опыт</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="text-sm font-bold">{mentor.sessionsCompleted}</p>
            <p className="text-[10px] text-white/30">Сессий</p>
          </div>
        </div>

        <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1">{mentor.bio}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {mentor.techStack.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
          ))}
          {mentor.techStack.length > 4 && (
            <Badge variant="default" size="sm">+{mentor.techStack.length - 4}</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {mentor.specializations.map((spec) => (
            <span key={spec} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">
              {spec}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-auto">
          <div className="flex items-center gap-1.5">
            <CodeCoinIcon size={16} />
            <span className="text-lg font-bold text-accent-green">{mentor.pricePerHour}</span>
            <span className="text-xs text-white/30">CC/час</span>
          </div>
          <Badge variant={mentor.available ? 'green' : 'default'} size="sm">
            {mentor.available ? 'Доступен' : 'Недоступен'}
          </Badge>
        </div>
      </GlassCard>
    </motion.button>
  );
}

// ---- Mentor Detail View ----
function MentorDetail({ mentor, onBack }: { mentor: Mentor; onBack: () => void }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const mentorProjects = mockProjects.filter((p) => p.mentorId === mentor.id);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [joinProject, setJoinProject] = useState<Project | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
  const [joinConfirmed, setJoinConfirmed] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('Подготовка к собеседованию');
  const [sessionComment, setSessionComment] = useState('');

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Менторы
        </button>

        {/* Profile card */}
        <GlassCard className="mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative flex-shrink-0">
              <img src={mentor.avatarUrl} alt="" className="w-24 h-24 rounded-2xl object-cover" />
              <span className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface-800', mentor.available ? 'bg-accent-green' : 'bg-white/20')} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{mentor.name}</h1>
                <Badge variant={mentor.available ? 'green' : 'default'}>{mentor.available ? 'Доступен' : 'Недоступен'}</Badge>
              </div>
              <p className="text-sm text-white/40 mb-1">{mentor.title}</p>
              <p className="text-sm text-accent-cyan mb-3">{mentor.company}</p>
              <p className="text-sm text-white/50 leading-relaxed mb-4">{mentor.bio}</p>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> {mentor.rating} ({mentor.reviewCount})</span>
                <span className="flex items-center gap-1 text-white/40"><Clock size={14} /> {mentor.experience}</span>
                <span className="flex items-center gap-1 text-white/40"><MessageCircle size={14} /> {mentor.sessionsCompleted} сессий</span>
                <span className="flex items-center gap-1"><CodeCoinIcon size={14} /> <span className="text-accent-green font-semibold">{mentor.pricePerHour} CC/час</span></span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {mentor.techStack.map((tech) => (
                  <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mentor.specializations.map((spec) => (
                  <span key={spec} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">{spec}</span>
                ))}
              </div>
            </div>
            <div className="sm:self-start flex-shrink-0">
              <Button
                onClick={() => { setBookingModal(true); setBookingConfirmed(false); setSessionComment(''); }}
                disabled={!mentor.available}
              >
                <Calendar size={14} /> Записаться на консультацию
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Projects */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Rocket size={16} className="text-accent-green" />
          Проекты ментора ({mentorProjects.length})
        </h2>

        {mentorProjects.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-white/30 text-sm">У ментора пока нет активных проектов</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mentorProjects.map((project) => {
              const totalSlots = project.teamSlots.reduce((s, t) => s + t.total, 0);
              const filledSlots = project.teamSlots.reduce((s, t) => s + t.filled, 0);
              const openSlots = project.teamSlots.filter((s) => s.filled < s.total);
              const statusColor: Record<ProjectStatus, string> = {
                recruiting: 'green',
                'in-progress': 'cyan',
                review: 'orange',
                completed: 'purple',
              };

              return (
                <GlassCard key={project.id} className="flex flex-col">
                  {/* Cover */}
                  <div className="relative h-36 -mx-4 -mt-4 mb-4 rounded-t-2xl overflow-hidden">
                    <img src={project.coverUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge variant={statusColor[project.status] as 'green' | 'cyan' | 'orange' | 'purple'}>{STATUS_LABELS[project.status]}</Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold">{project.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-white/40 line-clamp-2 mb-3">{project.description}</p>

                  {/* Team slots */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-white/30 mb-1.5">
                      <span className="flex items-center gap-1"><Users size={10} /> Команда</span>
                      <span>{filledSlots}/{totalSlots}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.teamSlots.map((slot) => (
                        <span
                          key={slot.role}
                          className={cn('text-[10px] px-1.5 py-0.5 rounded', slot.filled < slot.total ? 'bg-white/[0.04] text-white/40' : 'bg-white/[0.02] text-white/20')}
                          style={slot.filled < slot.total ? { borderLeft: `2px solid ${ROLE_COLORS[slot.role]}` } : {}}
                        >
                          {ROLE_LABELS[slot.role]} {slot.filled}/{slot.total}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tech */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.techStack.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-auto">
                    <div className="flex items-center gap-1">
                      <CodeCoinIcon size={12} />
                      <span className="text-sm font-bold text-accent-green">{project.rewardCoins}</span>
                      <span className="text-[10px] text-white/25">CC</span>
                    </div>
                    {project.status === 'recruiting' && openSlots.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => { setJoinProject(project); setSelectedRole(null); setJoinConfirmed(false); }}
                      >
                        <UserPlus size={12} /> Подать заявку
                      </Button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        <Modal
          isOpen={bookingModal}
          onClose={() => setBookingModal(false)}
          title={bookingConfirmed ? 'Заявка отправлена!' : `Записаться к ${mentor.name}`}
        >
          {bookingConfirmed ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-accent-green mx-auto mb-4" />
              <p className="text-sm text-white/60 mb-2">
                Заявка отправлена! {mentor.name} получит уведомление в расписании.
              </p>
              <p className="text-xs text-white/30">После одобрения вы оба получите уведомление со ссылкой на звонок.</p>
              <div className="mt-6 p-3 rounded-xl bg-white/[0.03] text-xs text-white/40 space-y-1">
                <div className="flex justify-between">
                  <span>Ментор:</span><span className="text-white/60">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Тема:</span><span className="text-white/60">{sessionTopic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Стоимость:</span>
                  <span className="text-accent-green font-medium">{mentor.pricePerHour} CC/час</span>
                </div>
              </div>
            </div>
          ) : !isAuth ? (
            <div className="text-center py-4">
              <p className="text-sm text-white/40 mb-4">Войдите, чтобы записаться на менторскую сессию</p>
              <Link to="/login"><Button>Войти</Button></Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] mb-4">
                <img src={mentor.avatarUrl} alt="" className="w-12 h-12 rounded-xl" />
                <div>
                  <p className="text-sm font-medium">{mentor.name}</p>
                  <p className="text-xs text-white/40">{mentor.title} · {mentor.company}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Тема сессии</label>
                  <select
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full bg-surface-800 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none [color-scheme:dark]"
                  >
                    <option>Подготовка к собеседованию</option>
                    <option>Code Review</option>
                    <option>Помощь с проектом</option>
                    <option>Карьерная консультация</option>
                    <option>Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Предпочтительное время</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60">
                      <Calendar size={14} className="text-white/20" />
                      <span>Завтра</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60">
                      <Clock size={14} className="text-white/20" />
                      <span>18:00</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Комментарий (опционально)</label>
                  <textarea
                    value={sessionComment}
                    onChange={(e) => setSessionComment(e.target.value)}
                    placeholder="Расскажите коротко, с чем нужна помощь..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-accent-green/5 border border-accent-green/10 mb-4">
                <span className="text-sm text-white/60">Стоимость сессии (1 час)</span>
                <div className="flex items-center gap-1.5">
                  <CodeCoinIcon size={16} />
                  <span className="text-lg font-bold text-accent-green">{mentor.pricePerHour}</span>
                  <span className="text-xs text-white/30">CC</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (!currentUser) return;
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(18, 0, 0, 0);
                  dispatch(bookSession({
                    mentorId: mentor.id,
                    studentId: currentUser.id,
                    topic: sessionTopic,
                    comment: sessionComment,
                    scheduledAt: tomorrow.toISOString(),
                    durationMinutes: 60,
                    price: mentor.pricePerHour,
                  }));
                  setBookingConfirmed(true);
                }}
                icon={<Calendar size={14} />}
              >
                Отправить заявку
              </Button>
            </>
          )}
        </Modal>

        {/* Join Project Modal */}
        <Modal
          isOpen={!!joinProject}
          onClose={() => { setJoinProject(null); setJoinConfirmed(false); }}
          title={joinConfirmed ? 'Заявка отправлена!' : `Подать заявку — ${joinProject?.title || ''}`}
        >
          {joinConfirmed ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-accent-green mx-auto mb-4" />
              <p className="text-sm text-white/60">
                Ваша заявка отправлена тимлиду. После одобрения вы получите доступ к GitHub-репозиторию проекта.
              </p>
            </div>
          ) : !isAuth ? (
            <div className="text-center py-4">
              <p className="text-sm text-white/40 mb-4">Войдите, чтобы подать заявку</p>
              <Link to="/login"><Button>Войти</Button></Link>
            </div>
          ) : joinProject ? (() => {
            const openSlots = joinProject.teamSlots.filter((s) => s.filled < s.total);
            return (
              <div>
                <p className="text-sm text-white/40 mb-4">Выберите роль в команде:</p>
                <div className="space-y-2 mb-6">
                  {openSlots.map((slot) => (
                    <button
                      key={slot.role}
                      onClick={() => setSelectedRole(slot.role)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between',
                        selectedRole === slot.role
                          ? 'border-accent-green/30 bg-accent-green/5'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[slot.role] }} />
                        <span className="text-sm font-medium">{ROLE_LABELS[slot.role]}</span>
                      </div>
                      <span className="text-xs text-white/20">{slot.total - slot.filled} мест</span>
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Расскажите о своём опыте..."
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none resize-none mb-4"
                />
                <Button className="w-full" onClick={() => setJoinConfirmed(true)} disabled={!selectedRole}>
                  Отправить заявку
                </Button>
              </div>
            );
          })() : null}
        </Modal>
      </div>
    </PageTransition>
  );
}

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpec, setFilterSpec] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  const allSpecs = [...new Set(mockMentors.flatMap((m) => m.specializations))];

  const filteredMentors = mockMentors.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.techStack.some((t) => t.toLowerCase().includes(q)) &&
        !m.specializations.some((s) => s.toLowerCase().includes(q))
      )
        return false;
    }
    if (filterSpec && !m.specializations.includes(filterSpec)) return false;
    return true;
  });

  if (selectedMentor) {
    return <MentorDetail mentor={selectedMentor} onBack={() => setSelectedMentor(null)} />;
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Менторы</h1>
            <p className="text-sm text-white/40">
              Опытные разработчики ведут проекты, помогают с подготовкой к собеседованиям и карьерой
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, технологии или специализации..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-green/20 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={14} className="text-white/20 flex-shrink-0" />
            <button
              onClick={() => setFilterSpec(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all',
                !filterSpec ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
              )}
            >
              Все
            </button>
            {allSpecs.map((spec) => (
              <button
                key={spec}
                onClick={() => setFilterSpec(filterSpec === spec ? null : spec)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all',
                  filterSpec === spec ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Mentor grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} onClick={() => setSelectedMentor(mentor)} />
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30">Менторы не найдены</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
