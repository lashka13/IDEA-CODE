import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, BookOpen, Calendar, Check, FileText, Code, Video, Presentation, Play } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectIsAuthenticated, selectCurrentUser, updateCoins } from '../../../features/auth';
import { selectIsPurchased, addPurchase } from '../../../features/buy-material';
import { addTransaction } from '../../../entities/transaction';
import { PageTransition, Button, GlassCard, Badge, CodeCoinIcon, Tag } from '../../../shared/ui';
import { cn, formatDate } from '../../../shared/lib';
import { DIFFICULTY_LABELS, FORMAT_LABELS } from '../../../shared/config/constants';
import { mockComments } from '../../../shared/api/mocks/comments';
import { mockLessons } from '../../../shared/api/mocks/lessons';

const FORMAT_ICONS: Record<string, any> = { article: FileText, code: Code, video: Video, presentation: Presentation };

export default function MaterialDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isPurchased = useAppSelector(selectIsPurchased(id || ''));

  const material = materials.find((m) => m.id === id);
  const author = users.find((u) => u.id === material?.authorId);
  const comments = mockComments.filter((c) => c.materialId === id);
  if (!material) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <h1 className="text-2xl font-bold">Материал не найден</h1>
          <Link to="/catalog" className="text-accent-cyan text-sm mt-4 inline-block">Вернуться в каталог</Link>
        </div>
      </PageTransition>
    );
  }

  const Icon = FORMAT_ICONS[material.format] || FileText;
  const canBuy = isAuth && currentUser && currentUser.codeCoins >= material.price && !isPurchased;
  const hasLessons = mockLessons.some((l) => l.materialId === material.id);

  const handleBuy = () => {
    if (!canBuy || !currentUser) return;
    dispatch(addPurchase(material.id));
    dispatch(updateCoins(-material.price));
    dispatch(addTransaction({
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: 'purchase',
      amount: -material.price,
      description: `Покупка: ${material.title}`,
      materialId: material.id,
      createdAt: new Date().toISOString(),
    }));
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back */}
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={14} /> Каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview */}
          <div className="lg:col-span-2">
            <GlassCard padding="none" className="overflow-hidden">
              <div className="relative h-64 sm:h-96">
                <img src={material.coverUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Badge variant="default"><Icon size={10} className="mr-1" />{FORMAT_LABELS[material.format]}</Badge>
                  <Badge variant={material.difficulty === 'junior' ? 'green' : material.difficulty === 'middle' ? 'cyan' : 'orange'}>
                    {DIFFICULTY_LABELS[material.difficulty]}
                  </Badge>
                </div>
              </div>
            </GlassCard>

            {/* Table of contents */}
            <GlassCard className="mt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-accent-cyan" /> Содержание
              </h3>
              <ol className="space-y-2">
                {material.tableOfContents.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/50">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs text-white/30">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </GlassCard>

            {/* Comments */}
            <GlassCard className="mt-4">
              <h3 className="text-sm font-semibold mb-4">Отзывы ({comments.length})</h3>
              {comments.length === 0 && <p className="text-sm text-white/30">Пока нет отзывов</p>}
              <div className="space-y-4">
                {comments.map((comment) => {
                  const commentAuthor = users.find((u) => u.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02]">
                      <img src={commentAuthor?.avatarUrl} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{commentAuthor?.name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} className={cn(i < comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/10')} />
                            ))}
                          </div>
                          <span className="text-xs text-white/20 ml-auto">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-white/50">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Right: Info */}
          <div className="space-y-4">
            <GlassCard>
              <h1 className="text-xl font-bold mb-2">{material.title}</h1>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{material.description}</p>

              {/* Author */}
              {author && (
                <Link to={`/profile/${author.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors mb-4">
                  <img src={author.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="text-sm font-medium">{author.name}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-white/40">{author.rating}</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold">{material.rating}</p>
                  <p className="text-[10px] text-white/30">Рейтинг</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold">{material.purchaseCount}</p>
                  <p className="text-[10px] text-white/30">Покупок</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold">{material.ratingCount}</p>
                  <p className="text-[10px] text-white/30">Оценок</p>
                </div>
              </div>

              {/* Price + Buy */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent-green/5 to-accent-cyan/5 border border-accent-green/10">
                <div className="flex items-center gap-2">
                  <CodeCoinIcon size={20} />
                  <span className="text-2xl font-bold text-accent-green">{material.price}</span>
                  <span className="text-sm text-white/30">CC</span>
                </div>
                {isPurchased ? (
                  <Button variant="secondary" size="sm" icon={<Check size={14} />} disabled>
                    Куплено
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    icon={<ShoppingCart size={14} />}
                    onClick={handleBuy}
                    disabled={!canBuy}
                  >
                    Купить
                  </Button>
                )}
              </div>
              {isPurchased && hasLessons && (
                <Link to={`/catalog/${material.id}/learn`} className="block mt-3">
                  <Button variant="primary" size="lg" icon={<Play size={16} />} className="w-full">
                    Смотреть курс
                  </Button>
                </Link>
              )}
              {!isAuth && (
                <p className="text-xs text-white/20 text-center mt-2">
                  <Link to="/login" className="text-accent-cyan hover:underline">Войдите</Link> чтобы купить
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {material.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>

              {/* Tech */}
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-xs text-white/30 mb-2">Технологии</p>
                <div className="flex flex-wrap gap-1.5">
                  {material.technology.map((tech) => (
                    <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-xs text-white/20">
                <Calendar size={12} />
                {formatDate(material.createdAt)}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
