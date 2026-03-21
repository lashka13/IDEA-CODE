import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Calendar,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  Shield,
  Rocket,
  Filter,
} from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllUsers } from '../../../entities/user';
import { selectIsAuthenticated } from '../../../features/auth';
import { PageTransition, GlassCard, Button, Badge, CodeCoinIcon, Modal } from '../../../shared/ui';
import { cn, formatDate } from '../../../shared/lib';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_LABELS,
  type Project,
  type ProjectMember,
  type ProjectTeamSlot,
  type ProjectRole,
  type ProjectStatus,
} from '../../../shared/api/mocks/projects';
import { type Mentor } from '../../../shared/api/mocks/mentors';
import { apiClient } from '../../../shared/api/client';

function ProjectCard({ project, mentors, onClick }: { project: Project; mentors: Mentor[]; onClick: () => void }) {
  const mentor = mentors.find((m) => m.id === project.mentorId);
  const totalSlots = project.teamSlots.reduce((s, t) => s + t.total, 0);
  const filledSlots = project.teamSlots.reduce((s, t) => s + t.filled, 0);

  const statusColor: Record<ProjectStatus, string> = {
    recruiting: 'green',
    'in-progress': 'cyan',
    review: 'orange',
    completed: 'purple',
  };

  return (
    <motion.button
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="text-left w-full"
    >
      <GlassCard padding="none" className="overflow-hidden h-full flex flex-col">
        <div className="relative h-40">
          <img src={project.coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge variant={statusColor[project.status] as 'green' | 'cyan' | 'orange' | 'purple'}>
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-base font-bold line-clamp-1">{project.title}</h3>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-white/40 line-clamp-2 mb-4">{project.description}</p>

          {/* Team slots */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-white/30 mb-2">
              <span className="flex items-center gap-1"><Users size={10} /> Команда</span>
              <span>{filledSlots}/{totalSlots}</span>
            </div>
            <div className="flex gap-1">
              {project.teamSlots.map((slot) => (
                <div
                  key={slot.role}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.06]"
                  title={`${ROLE_LABELS[slot.role]}: ${slot.filled}/${slot.total}`}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(slot.filled / slot.total) * 100}%`,
                      backgroundColor: ROLE_COLORS[slot.role],
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {project.teamSlots.map((slot) => (
                <span
                  key={slot.role}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    slot.filled < slot.total ? 'bg-white/[0.04] text-white/40' : 'bg-white/[0.02] text-white/20'
                  )}
                  style={slot.filled < slot.total ? { borderLeft: `2px solid ${ROLE_COLORS[slot.role]}` } : {}}
                >
                  {ROLE_LABELS[slot.role]} {slot.filled}/{slot.total}
                </span>
              ))}
            </div>
          </div>

          {/* Tech & Mentor */}
          <div className="flex flex-wrap gap-1 mb-3">
            {project.techStack.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mentor && (
                <div className="flex items-center gap-1.5">
                  <img src={mentor.avatarUrl} alt="" className="w-5 h-5 rounded-md" />
                  <span className="text-[10px] text-white/30">Ментор: {mentor.name.split(' ')[0]}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <CodeCoinIcon size={12} />
              <span className="text-sm font-bold text-accent-green">{project.rewardCoins}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

function ProjectDetail({ project, mentors, onBack }: { project: Project; mentors: Mentor[]; onBack: () => void }) {
  const users = useAppSelector(selectAllUsers);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const mentor = mentors.find((m) => m.id === project.mentorId);
  const [joinModal, setJoinModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
  const [joinConfirmed, setJoinConfirmed] = useState(false);

  const totalSlots = project.teamSlots.reduce((s, t) => s + t.total, 0);
  const filledSlots = project.teamSlots.reduce((s, t) => s + t.filled, 0);
  const openSlots = project.teamSlots.filter((s) => s.filled < s.total);
  const teamLead = project.members.find((m) => m.isTeamLead);
  const teamLeadUser = teamLead ? users.find((u) => u.id === teamLead.userId) : null;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Проекты
        </button>

        {/* Hero */}
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
          <img src={project.coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-surface-900/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <Badge variant={project.status === 'recruiting' ? 'green' : project.status === 'in-progress' ? 'cyan' : 'orange'} size="md">
                {STATUS_LABELS[project.status]}
              </Badge>
              <h1 className="text-2xl font-bold mt-2">{project.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <CodeCoinIcon size={20} />
              <span className="text-xl font-bold text-accent-green">{project.rewardCoins} CC</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Описание</h3>
              <p className="text-sm text-white/50 leading-relaxed">{project.description}</p>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Задачи проекта</h3>
              <div className="space-y-2">
                {project.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <span className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-white/30">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/60">{task}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Team */}
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Команда ({filledSlots}/{totalSlots})</h3>
              <div className="space-y-2">
                {project.members.map((member) => {
                  const user = users.find((u) => u.id === member.userId);
                  if (!user) return null;
                  return (
                    <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {user.name}
                          {member.isTeamLead && (
                            <Badge variant="green" size="sm"><Shield size={8} className="mr-0.5" />Team Lead</Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-white/30">@{user.username}</p>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${ROLE_COLORS[member.role]}20`, color: ROLE_COLORS[member.role] }}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                  );
                })}

                {/* Open slots */}
                {openSlots.map((slot) =>
                  Array.from({ length: slot.total - slot.filled }).map((_, i) => (
                    <div key={`${slot.role}-${i}`} className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-white/[0.06]">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                        <UserPlus size={14} className="text-white/15" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/30">Открытая позиция</p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${ROLE_COLORS[slot.role]}20`, color: ROLE_COLORS[slot.role] }}
                        >
                          {ROLE_LABELS[slot.role]}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* GitHub */}
            {project.githubUrl && (
              <GlassCard>
                <div className="flex items-center gap-3">
                  <GitBranch size={16} className="text-white/40" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">GitHub Repository</p>
                    <p className="text-xs text-accent-cyan">{project.githubUrl}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={12} /> Открыть
                  </Button>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Join */}
            {project.status === 'recruiting' && openSlots.length > 0 && (
              <GlassCard glow="green">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Rocket size={14} className="text-accent-green" /> Присоединиться
                </h3>
                <p className="text-xs text-white/40 mb-4">
                  Открыто {openSlots.reduce((s, sl) => s + (sl.total - sl.filled), 0)} позиций в команде
                </p>
                <Button className="w-full" onClick={() => setJoinModal(true)}>
                  <UserPlus size={14} /> Подать заявку
                </Button>
              </GlassCard>
            )}

            {/* Mentor */}
            {mentor && (
              <GlassCard>
                <h3 className="text-sm font-semibold mb-3">Ментор проекта</h3>
                <div className="flex items-center gap-3">
                  <img src={mentor.avatarUrl} alt="" className="w-12 h-12 rounded-xl" />
                  <div>
                    <p className="text-sm font-medium">{mentor.name}</p>
                    <p className="text-xs text-white/40">{mentor.title}</p>
                    <p className="text-xs text-accent-cyan">{mentor.company}</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Info */}
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Информация</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/30 flex items-center gap-1"><Calendar size={10} /> Дедлайн</span>
                  <span className="text-white/60">{formatDate(project.deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Сложность</span>
                  <Badge variant={project.difficulty === 'beginner' ? 'green' : project.difficulty === 'intermediate' ? 'cyan' : 'orange'} size="sm">
                    {project.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Награда</span>
                  <span className="text-accent-green font-medium flex items-center gap-1">
                    <CodeCoinIcon size={12} /> {project.rewardCoins} CC
                  </span>
                </div>
                {teamLeadUser && (
                  <div className="flex justify-between">
                    <span className="text-white/30">Team Lead</span>
                    <span className="text-white/60">{teamLeadUser.name}</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Tech */}
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Стек</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((tech) => (
                  <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold mb-3">Теги</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-white/40">{tag}</span>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Join Modal */}
        <Modal
          isOpen={joinModal}
          onClose={() => { setJoinModal(false); setJoinConfirmed(false); }}
          title={joinConfirmed ? 'Заявка отправлена!' : 'Подать заявку'}
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
            </div>
          ) : (
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
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ROLE_COLORS[slot.role] }}
                      />
                      <span className="text-sm font-medium">{ROLE_LABELS[slot.role]}</span>
                    </div>
                    <span className="text-xs text-white/20">
                      {slot.total - slot.filled} мест
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Расскажите о своём опыте и почему хотите участвовать..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none resize-none mb-4"
              />
              <Button
                className="w-full"
                onClick={() => setJoinConfirmed(true)}
                disabled={!selectedRole}
              >
                Отправить заявку
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const mapMentor = (m: any): Mentor => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatar_url,
      title: m.title,
      company: m.company,
      experience: m.experience,
      bio: m.bio,
      techStack: m.tech_stack,
      rating: m.rating,
      reviewCount: m.review_count,
      sessionsCompleted: m.sessions_completed,
      pricePerHour: m.price_per_hour,
      available: m.available,
      specializations: m.specializations,
      languages: m.languages,
    });

    const mapProject = (p: any): Project => {
      const members: ProjectMember[] = (p.members ?? []).map((m: any) => ({
        userId: m.userId ?? m.user_id,
        role: m.role,
        isTeamLead: m.isTeamLead ?? m.is_team_lead ?? false,
      }));
      const rawSlots = p.team_slots ?? p.teamSlots ?? [];
      const teamSlots: ProjectTeamSlot[] = rawSlots.map((s: any) => ({
        role: s.role,
        label: s.label,
        total: s.total,
        filled: members.filter((m: ProjectMember) => m.role === s.role).length,
      }));
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        coverUrl: p.cover_url ?? p.coverUrl ?? '',
        difficulty: p.difficulty,
        status: p.status,
        mentorId: p.mentor_id ?? p.mentorId,
        techStack: p.tech_stack ?? p.techStack ?? [],
        teamSlots,
        members,
        githubUrl: p.github_url ?? p.githubUrl,
        deadline: p.deadline,
        rewardCoins: p.reward_coins ?? p.rewardCoins ?? 0,
        tags: p.tags ?? [],
        createdAt: p.created_at ?? p.createdAt ?? '',
        tasks: p.tasks ?? [],
      };
    };

    Promise.all([
      apiClient.getProjects().catch(() => null),
      apiClient.getMentors().catch(() => null),
    ]).then(([projectsData, mentorsData]) => {
      if (cancelled) return;
      if (projectsData) {
        setProjects(projectsData.map(mapProject));
      }
      if (mentorsData) {
        setMentors(mentorsData.map(mapMentor));
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} mentors={mentors} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold mb-2">Проекты</h1>
        <p className="text-sm text-white/40 mb-8">
          Присоединяйся к командным проектам, получай опыт и CodeCoins
        </p>

        {/* Status filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          <Filter size={14} className="text-white/20 flex-shrink-0" />
          {(['all', 'recruiting', 'in-progress', 'review', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs whitespace-nowrap transition-all',
                statusFilter === s ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
              )}
            >
              {s === 'all' ? 'Все' : STATUS_LABELS[s]}
              <span className="ml-1.5 text-white/15">
                {s === 'all' ? projects.length : projects.filter((p) => p.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* Project grid */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-white/30">Загрузка проектов...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} mentors={mentors} onClick={() => setSelectedProject(project)} />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16 text-white/30">Нет проектов с выбранным статусом</div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
