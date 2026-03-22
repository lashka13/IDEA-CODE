import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, BookOpen, Calendar, Check, FileText, Code, Video, Presentation, Play, Send } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectIsAuthenticated, selectCurrentUser } from '../../../features/auth';
import { selectIsPurchased, purchaseMaterialAsync } from '../../../features/buy-material';
import { PageTransition, Button, GlassCard, Badge, Tag } from '../../../shared/ui';
import { cn, formatDate } from '../../../shared/lib';
import { DIFFICULTY_LABELS, FORMAT_LABELS } from '../../../shared/config/constants';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/api/client';
import type { Comment } from '../../../shared/types';

const FORMAT_ICONS: Record<string, any> = { article: FileText, code: Code, video: Video, presentation: Presentation };

export default function MaterialDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isPurchased = useAppSelector(selectIsPurchased(id || ''));

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [hasLessons, setHasLessons] = useState(false);

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);

  const material = materials.find((m) => m.id === id);
  const author = users.find((u) => u.id === material?.authorId);

  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    apiClient.getComments(id)
      .then((data) => setComments(data.map((c: any) => ({
        id: c.id,
        materialId: c.material_id,
        authorId: c.author_id,
        text: c.text,
        rating: c.rating,
        createdAt: c.created_at,
      }))))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));

    apiClient.getLessons(id)
      .then((lessons) => setHasLessons(lessons.length > 0))
      .catch(() => {});
  }, [id]);

  if (!material) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <h1 className="text-2xl font-bold">Материал не найден</h1>
          <Link to="/catalog" className="text-accent-cyan text-sm mt-4 inline-block">Вернуться к кейсам</Link>
        </div>
      </PageTransition>
    );
  }

  const Icon = FORMAT_ICONS[material.format] || FileText;
  const canBuy = isAuth && currentUser && !isPurchased && material.authorId !== currentUser.id;

  const handleBuy = async () => {
    if (!canBuy) return;
    setPurchasing(true);
    setPurchaseError('');
    try {
      await dispatch(purchaseMaterialAsync(material.id)).unwrap();
    } catch (e: any) {
      setPurchaseError(e.message || 'Ошибка при покупке');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSubmittingComment(true);
    try {
      const data = await apiClient.createComment(id, { text: commentText, rating: commentRating });
      setComments((prev) => [{ id: data.id, materialId: data.material_id, authorId: data.author_id, text: data.text, rating: data.rating, createdAt: data.created_at }, ...prev]);
      setCommentText('');
    } catch {
      // silently ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={14} /> Кейсы
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
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

              {/* Add comment form */}
              {isAuth && isPurchased && (
                <form onSubmit={handleSubmitComment} className="mb-6 p-4 rounded-xl bg-white/[0.02] space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Оценка:</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star} type="button" onClick={() => setCommentRating(star)}>
                          <Star size={16} className={cn(star <= commentRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Напишите отзыв..."
                    rows={3}
                    className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" icon={<Send size={12} />} disabled={!commentText.trim() || submittingComment}>
                      {submittingComment ? 'Отправка...' : 'Отправить'}
                    </Button>
                  </div>
                </form>
              )}

              {commentsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />)}
                </div>
              ) : (
                <>
                  {comments.length === 0 && <p className="text-sm text-white/30">Пока нет отзывов</p>}
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const commentAuthor = users.find((u) => u.id === comment.authorId);
                      return (
                        <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02]">
                          <img src={commentAuthor?.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${comment.authorId}`} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{commentAuthor?.name || 'Пользователь'}</span>
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
                </>
              )}
            </GlassCard>
          </div>

          {/* Right: Info */}
          <div className="space-y-4">
            <GlassCard>
              <h1 className="text-xl font-bold mb-2">{material.title}</h1>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{material.description}</p>

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

              <div className="p-4 rounded-xl bg-gradient-to-r from-accent-green/5 to-accent-cyan/5 border border-accent-green/10">
                {isPurchased ? (
                  <Button variant="secondary" className="w-full" icon={<Check size={14} />} disabled>Доступ получен</Button>
                ) : (
                  <Button className="w-full" icon={<ShoppingCart size={14} />} onClick={handleBuy} disabled={!canBuy || purchasing}>
                    {purchasing ? 'Получение доступа...' : 'Получить доступ'}
                  </Button>
                )}
              </div>

              {purchaseError && <p className="text-xs text-red-400 mt-2 text-center">{purchaseError}</p>}

              {!isAuth && (
                <p className="text-xs text-white/20 text-center mt-2">
                  <Link to="/login" className="text-accent-cyan hover:underline">Войдите</Link> чтобы получить доступ
                </p>
              )}

              {isPurchased && hasLessons && (
                <Link to={`/catalog/${material.id}/learn`} className="block mt-3">
                  <Button variant="primary" size="lg" icon={<Play size={16} />} className="w-full">
                    Открыть кейс
                  </Button>
                </Link>
              )}

              <div className="flex flex-wrap gap-1.5 mt-4">
                {material.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-xs text-white/30 mb-2">Технологии</p>
                <div className="flex flex-wrap gap-1.5">
                  {material.technology.map((tech) => <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-xs text-white/20">
                <Calendar size={12} /> {formatDate(material.createdAt)}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
