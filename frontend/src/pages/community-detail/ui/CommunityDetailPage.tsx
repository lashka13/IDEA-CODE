import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ArrowLeft, Heart, MessageCircle, Plus, LogIn, LogOut, Send } from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllCommunities } from '../../../entities/community';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { selectIsAuthenticated } from '../../../features/auth';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { PageTransition, Tabs, GlassCard, Button, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { timeAgo } from '../../../shared/lib';
import { apiClient } from '../../../shared/api/client';

interface Post {
  id: string; communityId: string; authorId: string;
  title: string; content: string; likesCount: number; commentsCount: number; createdAt: string;
}

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const communities = useAppSelector(selectAllCommunities);
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [activeTab, setActiveTab] = useState('discussions');

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // New post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const community = communities.find((c) => c.slug === slug);

  useEffect(() => {
    if (!slug) return;
    setPostsLoading(true);
    apiClient.getPosts(slug)
      .then((data) => setPosts(data.map((p: any) => ({
        id: p.id, communityId: p.community_id, authorId: p.author_id,
        title: p.title, content: p.content, likesCount: p.likes_count,
        commentsCount: p.comments_count, createdAt: p.created_at,
      }))))
      .catch(() => {})
      .finally(() => setPostsLoading(false));

    if (isAuth) {
      apiClient.getCommunity(slug)
        .then((data) => setIsMember(data.is_member))
        .catch(() => {});
    }
  }, [slug, isAuth]);

  const handleJoin = async () => {
    if (!slug) return;
    setMemberLoading(true);
    try {
      if (isMember) {
        await apiClient.leaveCommunity(slug);
        setIsMember(false);
      } else {
        await apiClient.joinCommunity(slug);
        setIsMember(true);
      }
    } catch {}
    setMemberLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!isAuth || !slug) return;
    try {
      const data = await apiClient.togglePostLike(slug, postId);
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likesCount: data.likes_count } : p));
      setLikedPosts((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(postId) : next.delete(postId);
        return next;
      });
    } catch {}
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !slug) return;
    setSubmittingPost(true);
    try {
      const data = await apiClient.createPost(slug, { title: postTitle, content: postContent });
      setPosts((prev) => [{
        id: data.id, communityId: data.community_id, authorId: data.author_id,
        title: data.title, content: data.content, likesCount: 0, commentsCount: 0, createdAt: data.created_at,
      }, ...prev]);
      setPostTitle('');
      setPostContent('');
      setShowPostForm(false);
    } catch {}
    setSubmittingPost(false);
  };

  if (!community) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <h1 className="text-2xl font-bold">Сообщество не найдено</h1>
          <Link to="/communities" className="text-accent-cyan text-sm mt-4 inline-block">Назад</Link>
        </div>
      </PageTransition>
    );
  }

  const communityMaterials = materials.filter((m) => m.communityId === community.id);
  const communityMembers = users.slice(0, Math.min(users.length, Math.floor(community.memberCount / 50)));

  return (
    <PageTransition>
      {/* Hero */}
      <div className="relative h-48 sm:h-64">
        <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <Link to="/communities" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-3">
            <ArrowLeft size={14} /> Сообщества
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{community.iconEmoji}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{community.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-white/40">
                  <span className="flex items-center gap-1"><Users size={14} /> {community.memberCount} участников</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {community.materialCount} материалов</span>
                </div>
              </div>
            </div>
            {isAuth && (
              <Button
                variant={isMember ? 'secondary' : 'primary'}
                size="sm"
                icon={isMember ? <LogOut size={14} /> : <LogIn size={14} />}
                onClick={handleJoin}
                disabled={memberLoading}
              >
                {memberLoading ? '...' : isMember ? 'Выйти' : 'Вступить'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <Tabs
          tabs={[
            { id: 'discussions', label: 'Обсуждения' },
            { id: 'materials', label: 'Материалы' },
            { id: 'members', label: 'Участники' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-8"
        />

        {activeTab === 'discussions' && (
          <div>
            {isMember && (
              <div className="mb-4">
                {showPostForm ? (
                  <form onSubmit={handleSubmitPost} className="mb-4">
                    <GlassCard className="space-y-3">
                      <input
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Заголовок поста"
                        className="w-full bg-transparent text-sm font-semibold placeholder:text-white/20 focus:outline-none"
                      />
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Что хотите обсудить?"
                        rows={3}
                        className="w-full bg-transparent text-sm text-white/60 placeholder:text-white/20 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowPostForm(false)}>Отмена</Button>
                        <Button size="sm" icon={<Send size={12} />} disabled={!postTitle.trim() || submittingPost}>
                          {submittingPost ? 'Отправка...' : 'Опубликовать'}
                        </Button>
                      </div>
                    </GlassCard>
                  </form>
                ) : (
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowPostForm(true)} className="mb-4">
                    Новый пост
                  </Button>
                )}
              </div>
            )}

            {postsLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.02] animate-pulse" />)}</div>
            ) : (
              <StaggerContainer className="space-y-4">
                {posts.map((post) => {
                  const postAuthor = users.find((u) => u.id === post.authorId);
                  return (
                    <motion.div key={post.id} variants={staggerItemVariants}>
                      <GlassCard className="group cursor-pointer">
                        <div className="flex gap-3">
                          <img
                            src={postAuthor?.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${post.authorId}`}
                            alt="" className="w-10 h-10 rounded-xl flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{postAuthor?.name || 'Участник'}</span>
                              <span className="text-xs text-white/20">{timeAgo(post.createdAt)}</span>
                            </div>
                            <h3 className="font-semibold mb-1 group-hover:text-accent-cyan transition-colors">{post.title}</h3>
                            <p className="text-sm text-white/40 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                              <button
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-1 hover:text-red-400 transition-colors ${likedPosts.has(post.id) ? 'text-red-400' : ''}`}
                              >
                                <Heart size={12} className={likedPosts.has(post.id) ? 'fill-red-400' : ''} /> {post.likesCount}
                              </button>
                              <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.commentsCount}</span>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
                {posts.length === 0 && <p className="text-center text-white/30 py-12">Пока нет обсуждений</p>}
              </StaggerContainer>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityMaterials.map((mat) => (
              <motion.div key={mat.id} variants={staggerItemVariants}>
                <MaterialCard material={mat} author={users.find((u) => u.id === mat.authorId)} />
              </motion.div>
            ))}
            {communityMaterials.length === 0 && (
              <p className="text-center text-white/30 py-12 col-span-full">Пока нет материалов</p>
            )}
          </StaggerContainer>
        )}

        {activeTab === 'members' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {communityMembers.map((user) => (
              <motion.div key={user.id} variants={staggerItemVariants}>
                <Link to={`/profile/${user.id}`}>
                  <GlassCard className="text-center group cursor-pointer">
                    <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-2xl mx-auto mb-2 group-hover:scale-105 transition-transform" />
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-white/30">@{user.username}</p>
                    <p className="text-xs text-white/20 mt-1">{user.levelTitle}</p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
