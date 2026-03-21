import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Video,
  Presentation,
  HelpCircle,
  Calendar,
  Clock,
  Users,
  Play,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageTransition, Button, Modal, Badge, GlassCard } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { mockScheduleEvents, type ScheduleEvent, type EventType } from '../../../shared/api/mocks/schedule';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectPurchasedIds } from '../../../features/buy-material/model/purchaseSlice';
import { selectCurrentUser } from '../../../features/auth';
import { selectAllSessions, updateSessionStatus } from '../../../features/mentor-sessions';
import { selectAllUsers } from '../../../entities/user';
import { mockMentors } from '../../../shared/api/mocks/mentors';

const EVENT_TYPE_META: Record<EventType, { icon: typeof Radio; label: string; bgColor: string; textColor: string; borderColor: string }> = {
  stream: { icon: Radio, label: 'Стрим', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-l-red-500' },
  webinar: { icon: Video, label: 'Вебинар', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-l-blue-500' },
  workshop: { icon: Presentation, label: 'Воркшоп', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-l-purple-500' },
  'q-and-a': { icon: HelpCircle, label: 'Q&A', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-l-yellow-500' },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 - 21:00
const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function getWeekDays(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
}

// ---- Calendar Event Block ----
function CalendarEvent({ event, onClick }: { event: ScheduleEvent; onClick: () => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const Icon = meta.icon;
  const eventDate = new Date(event.startsAt);
  const hour = eventDate.getHours();
  const minute = eventDate.getMinutes();

  // Calculate position and height
  const topOffset = (hour - 8) * 64 + (minute / 60) * 64;
  const height = Math.max((event.durationMinutes / 60) * 64, 28);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      style={{ top: `${topOffset}px`, height: `${height}px` }}
      className={cn(
        'absolute left-1 right-1 rounded-lg border-l-[3px] px-2 py-1 text-left overflow-hidden transition-all hover:z-10 hover:shadow-lg hover:brightness-125 group',
        meta.bgColor,
        meta.borderColor,
      )}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {event.isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        <Icon size={9} className={cn(meta.textColor, 'flex-shrink-0')} />
        <span className={cn('text-[9px] font-bold truncate', meta.textColor)}>
          {eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {height > 35 && (
        <p className="text-[10px] font-medium text-white/80 leading-tight line-clamp-2">{event.title}</p>
      )}
      {height > 55 && (
        <p className="text-[9px] text-white/30 truncate mt-0.5">{event.hostName}</p>
      )}
    </motion.button>
  );
}

// ---- Event Detail Modal Content ----
function EventDetail({ event, }: { event: ScheduleEvent; onClose: () => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const Icon = meta.icon;
  const eventDate = new Date(event.startsAt);
  const purchasedIds = useAppSelector(selectPurchasedIds);
  const isPurchased = purchasedIds.includes(event.materialId);
  const isPast = eventDate < new Date();

  return (
    <div>
      {/* Cover */}
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl">
        <img src={event.coverUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 to-transparent" />
        {event.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/90">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase">Live</span>
          </div>
        )}
        <div className={cn('absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg', meta.bgColor, meta.textColor)}>
          <Icon size={10} />
          <span className="text-[10px] font-bold">{meta.label}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">{event.title}</h3>
      <p className="text-sm text-white/40 leading-relaxed mb-4">{event.description}</p>

      {/* Host */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] mb-4">
        <img src={event.hostAvatarUrl} alt="" className="w-10 h-10 rounded-xl" />
        <div>
          <p className="text-sm font-medium">{event.hostName}</p>
          <p className="text-xs text-white/30">Ведущий</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <Calendar size={14} className="text-white/25 mx-auto mb-1" />
          <p className="text-xs font-medium">{eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <Clock size={14} className="text-white/25 mx-auto mb-1" />
          <p className="text-xs font-medium">{eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <Users size={14} className="text-white/25 mx-auto mb-1" />
          <p className="text-xs font-medium">{event.participantsCount}</p>
        </div>
      </div>

      {/* Duration + slots */}
      <div className="flex items-center justify-between text-xs text-white/35 mb-4">
        <span>Длительность: {formatDuration(event.durationMinutes)}</span>
        {event.maxParticipants && (
          <span>Мест: {event.maxParticipants - event.participantsCount} из {event.maxParticipants}</span>
        )}
      </div>

      {/* Course link */}
      <Link
        to={`/catalog/${event.materialId.replace('mat-', '')}`}
        className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors mb-4 text-sm text-accent-cyan"
      >
        <BookOpen size={14} />
        <span className="flex-1">{event.materialTitle}</span>
        <ExternalLink size={12} />
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {event.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] text-white/35">{tag}</span>
        ))}
      </div>

      {/* CTA */}
      {event.isLive ? (
        <Button className="w-full" icon={<Radio size={14} />}>Присоединиться к трансляции</Button>
      ) : event.recordingAvailable && isPast ? (
        <Button className="w-full" variant="secondary" icon={<Play size={14} />}>Смотреть запись</Button>
      ) : isPast ? (
        <Button className="w-full" variant="ghost" disabled>Событие завершено</Button>
      ) : isPurchased ? (
        <Button className="w-full" icon={<Calendar size={14} />}>Записаться</Button>
      ) : (
        <div className="text-center">
          <p className="text-xs text-white/25 mb-3">Доступно после покупки курса</p>
          <Link to={`/catalog/${event.materialId.replace('mat-', '')}`}>
            <Button className="w-full" variant="secondary">Перейти к курсу</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ---- Mentor Sessions Panel ----
function MentorSessionsPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const allSessions = useAppSelector(selectAllSessions);
  const allUsers = useAppSelector(selectAllUsers);

  if (!currentUser) return null;

  // Sessions where I'm mentor (need to approve)
  const isMentor = !!currentUser.mentorId;
  const pendingSessions = isMentor
    ? allSessions.filter((s) => s.mentorId === currentUser.mentorId && s.status === 'pending')
    : [];
  const approvedSessionsAsMentor = isMentor
    ? allSessions.filter((s) => s.mentorId === currentUser.mentorId && s.status === 'approved')
    : [];

  // Sessions where I'm student
  const mySessions = allSessions.filter((s) => s.studentId === currentUser.id);
  const myApproved = mySessions.filter((s) => s.status === 'approved');
  const myPending = mySessions.filter((s) => s.status === 'pending');

  const allApproved = [...approvedSessionsAsMentor, ...myApproved];
  const hasSessions = pendingSessions.length > 0 || allApproved.length > 0 || myPending.length > 0;

  if (!hasSessions) return null;

  return (
    <div className="flex-shrink-0 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck size={14} className="text-accent-cyan" />
        <span className="text-xs font-semibold text-white/50">Менторские сессии</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Pending sessions (for mentor to approve) */}
        {pendingSessions.map((session) => {
          const student = allUsers.find((u) => u.id === session.studentId);
          return (
            <GlassCard key={session.id} className="flex-shrink-0 w-[280px] !p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="orange" size="sm">Ожидает одобрения</Badge>
                <span className="text-[10px] text-white/20">
                  {new Date(session.scheduledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {student && <img src={student.avatarUrl} alt="" className="w-6 h-6 rounded-md" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{student?.name}</p>
                  <p className="text-[10px] text-white/30">{session.topic}</p>
                </div>
              </div>
              {session.comment && (
                <p className="text-[10px] text-white/25 mb-2 line-clamp-2">{session.comment}</p>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => dispatch(updateSessionStatus({ sessionId: session.id, status: 'approved' }))}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-medium hover:bg-accent-green/20 transition-colors"
                >
                  <CheckCircle2 size={10} /> Одобрить
                </button>
                <button
                  onClick={() => dispatch(updateSessionStatus({ sessionId: session.id, status: 'rejected' }))}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={10} /> Отклонить
                </button>
              </div>
            </GlassCard>
          );
        })}

        {/* Approved sessions — can join call */}
        {allApproved.map((session) => {
          const otherUserId = session.studentId === currentUser.id ? session.mentorId : session.studentId;
          const mentor = mockMentors.find((m) => m.id === session.mentorId);
          const student = allUsers.find((u) => u.id === session.studentId);
          const otherName = session.studentId === currentUser.id ? mentor?.name : student?.name;
          return (
            <GlassCard key={session.id} className="flex-shrink-0 w-[280px] !p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="green" size="sm">Подтверждено</Badge>
                <span className="text-[10px] text-white/20">
                  {new Date(session.scheduledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} {new Date(session.scheduledAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-medium mb-1">{session.topic}</p>
              <p className="text-[10px] text-white/30 mb-2">с {otherName}</p>
              <button
                onClick={() => navigate(`/session/${session.roomId}`)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition-colors"
              >
                <Video size={12} /> Перейти в звонок
              </button>
            </GlassCard>
          );
        })}

        {/* My pending sessions (as student) */}
        {myPending.map((session) => {
          const mentor = mockMentors.find((m) => m.id === session.mentorId);
          return (
            <GlassCard key={session.id} className="flex-shrink-0 w-[280px] !p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default" size="sm">Ожидает ответа</Badge>
                <span className="text-[10px] text-white/20">
                  {new Date(session.scheduledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-xs font-medium mb-1">{session.topic}</p>
              <p className="text-[10px] text-white/30">Ментор: {mentor?.name}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ---- Main Calendar Page ----
export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date('2025-01-15'));
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const navigateWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'week' ? 7 * dir : dir));
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date('2025-01-15'));

  const monthYear = (() => {
    const months = new Set(weekDays.map((d) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`));
    return [...months].join(' — ');
  })();

  // Events for the visible range
  const visibleDays = view === 'week' ? weekDays : [currentDate];

  const getEventsForDay = (day: Date) =>
    mockScheduleEvents.filter((ev) => isSameDay(new Date(ev.startsAt), day));

  const liveCount = mockScheduleEvents.filter((ev) => ev.isLive).length;

  return (
    <PageTransition>
      <div className="h-[calc(100vh-80px)] flex flex-col px-4 sm:px-6 pt-24 pb-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold mb-0.5">Расписание</h1>
            <p className="text-xs text-white/40">Стримы, вебинары и воркшопы от авторов курсов</p>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400">{liveCount} Live</span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Сегодня
          </button>

          <h2 className="text-sm font-semibold flex-1">{monthYear}</h2>

          {/* View toggle */}
          <div className="flex p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs transition-all',
                view === 'week' ? 'bg-white/[0.08] text-white' : 'text-white/30'
              )}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('day')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs transition-all',
                view === 'day' ? 'bg-white/[0.08] text-white' : 'text-white/30'
              )}
            >
              День
            </button>
          </div>

          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 ml-2">
            {(Object.entries(EVENT_TYPE_META) as [EventType, typeof EVENT_TYPE_META[EventType]][]).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <div key={type} className="flex items-center gap-1 text-[10px] text-white/30">
                  <Icon size={9} className={meta.textColor} />
                  {meta.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.01] flex-1 flex flex-col min-h-0">
          {/* Day headers */}
          <div className={cn(
            'grid border-b border-white/[0.06]',
            view === 'week' ? 'grid-cols-[60px_repeat(7,1fr)]' : 'grid-cols-[60px_1fr]'
          )}>
            <div className="p-2 border-r border-white/[0.04]" /> {/* Time gutter */}
            {visibleDays.map((day) => {
              const dayOfWeek = (day.getDay() + 6) % 7; // Monday=0
              const today = isToday(day);
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-3 text-center border-r border-white/[0.04] last:border-r-0',
                    today && 'bg-accent-green/[0.03]'
                  )}
                >
                  <p className={cn('text-[10px] font-bold uppercase', today ? 'text-accent-green' : 'text-white/25')}>
                    {DAY_NAMES_SHORT[dayOfWeek]}
                  </p>
                  <p className={cn(
                    'text-lg font-bold',
                    today ? 'text-accent-green' : 'text-white/70'
                  )}>
                    {day.getDate()}
                  </p>
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span key={ev.id} className={cn('w-1.5 h-1.5 rounded-full', EVENT_TYPE_META[ev.type].textColor.replace('text-', 'bg-'))} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className={cn(
              'grid relative',
              view === 'week' ? 'grid-cols-[60px_repeat(7,1fr)]' : 'grid-cols-[60px_1fr]'
            )}>
              {/* Time labels column */}
              <div className="border-r border-white/[0.04]">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-16 flex items-start justify-end pr-2 pt-0">
                    <span className="text-[10px] text-white/20 -mt-2">{String(hour).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {visibleDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'relative border-r border-white/[0.04] last:border-r-0',
                      today && 'bg-accent-green/[0.02]'
                    )}
                  >
                    {/* Hour lines */}
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-16 border-b border-white/[0.03]" />
                    ))}

                    {/* Events */}
                    {dayEvents.map((ev) => (
                      <CalendarEvent key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                    ))}

                    {/* Current time indicator */}
                    {today && (() => {
                      const now = new Date();
                      const nowHour = now.getHours();
                      const nowMinute = now.getMinutes();
                      if (nowHour < 8 || nowHour > 21) return null;
                      const top = (nowHour - 8) * 64 + (nowMinute / 60) * 64;
                      return (
                        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${top}px` }}>
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                            <div className="flex-1 h-[2px] bg-red-500" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Event detail modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title=""
      >
        {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </Modal>
    </PageTransition>
  );
}
