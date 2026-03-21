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
} from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectIsAuthenticated } from '../../../features/auth';
import { PageTransition, GlassCard, Button, Badge, CodeCoinIcon, Modal } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { mockMentors, type Mentor } from '../../../shared/api/mocks/mentors';
import { Link } from 'react-router-dom';

function MentorCard({ mentor, onBook }: { mentor: Mentor; onBook: (m: Mentor) => void }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img
              src={mentor.avatarUrl}
              alt={mentor.name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <span
              className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-800',
                mentor.available ? 'bg-accent-green' : 'bg-white/20'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{mentor.name}</h3>
            <p className="text-xs text-white/40">{mentor.title}</p>
            <p className="text-xs text-accent-cyan">{mentor.company}</p>
          </div>
        </div>

        {/* Stats */}
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

        {/* Bio */}
        <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1">{mentor.bio}</p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1 mb-4">
          {mentor.techStack.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
          ))}
          {mentor.techStack.length > 4 && (
            <Badge variant="default" size="sm">+{mentor.techStack.length - 4}</Badge>
          )}
        </div>

        {/* Specializations */}
        <div className="flex flex-wrap gap-1 mb-4">
          {mentor.specializations.map((spec) => (
            <span key={spec} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">
              {spec}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-auto">
          <div className="flex items-center gap-1.5">
            <CodeCoinIcon size={16} />
            <span className="text-lg font-bold text-accent-green">{mentor.pricePerHour}</span>
            <span className="text-xs text-white/30">CC/час</span>
          </div>
          <Button
            size="sm"
            variant={mentor.available ? 'primary' : 'secondary'}
            disabled={!mentor.available}
            onClick={() => onBook(mentor)}
          >
            {mentor.available ? 'Записаться' : 'Недоступен'}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function MentorsPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpec, setFilterSpec] = useState<string | null>(null);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

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

  const handleBook = (mentor: Mentor) => {
    if (!isAuth) return;
    setBookingMentor(mentor);
    setBookingConfirmed(false);
  };

  const confirmBooking = () => {
    setBookingConfirmed(true);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Менторы</h1>
            <p className="text-sm text-white/40">
              Опытные разработчики помогут с подготовкой к собеседованиям, ревью кода и карьерой
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
            <MentorCard key={mentor.id} mentor={mentor} onBook={handleBook} />
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30">Менторы не найдены</p>
          </div>
        )}

        {/* Booking Modal */}
        <Modal
          isOpen={!!bookingMentor}
          onClose={() => setBookingMentor(null)}
          title={bookingConfirmed ? 'Заявка отправлена!' : `Записаться к ${bookingMentor?.name}`}
        >
          {bookingConfirmed ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-accent-green mx-auto mb-4" />
              <p className="text-sm text-white/60 mb-2">
                Ваша заявка на менторскую сессию отправлена. {bookingMentor?.name} получит уведомление.
              </p>
              <p className="text-xs text-white/30">Ожидайте подтверждение в течение 24 часов.</p>
              <div className="mt-6 p-3 rounded-xl bg-white/[0.03] text-xs text-white/40 space-y-1">
                <div className="flex justify-between">
                  <span>Ментор:</span><span className="text-white/60">{bookingMentor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Стоимость:</span>
                  <span className="text-accent-green font-medium">{bookingMentor?.pricePerHour} CC/час</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {!isAuth ? (
                <div className="text-center py-4">
                  <p className="text-sm text-white/40 mb-4">Войдите, чтобы записаться на менторскую сессию</p>
                  <Link to="/login">
                    <Button>Войти</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] mb-4">
                    <img src={bookingMentor?.avatarUrl} alt="" className="w-12 h-12 rounded-xl" />
                    <div>
                      <p className="text-sm font-medium">{bookingMentor?.name}</p>
                      <p className="text-xs text-white/40">{bookingMentor?.title} · {bookingMentor?.company}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Тема сессии</label>
                      <select className="w-full bg-surface-800 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none [color-scheme:dark]">
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
                      <span className="text-lg font-bold text-accent-green">{bookingMentor?.pricePerHour}</span>
                      <span className="text-xs text-white/30">CC</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={confirmBooking} icon={<MessageCircle size={14} />}>
                    Отправить заявку
                  </Button>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
