import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllCommunities } from '../../../entities/community';
import { selectAllMaterials } from '../../../entities/material';
import { selectAllUsers } from '../../../entities/user';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { PageTransition, Tabs, GlassCard, StaggerContainer, staggerItemVariants } from '../../../shared/ui';
import { timeAgo } from '../../../shared/lib';
import { mockPosts } from '../../../shared/api/mocks/posts';

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const communities = useAppSelector(selectAllCommunities);
  const materials = useAppSelector(selectAllMaterials);
  const users = useAppSelector(selectAllUsers);
  const [activeTab, setActiveTab] = useState('discussions');

  const community = communities.find((c) => c.slug === slug);
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
  const communityPosts = mockPosts.filter((p) => p.communityId === community.id);
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
          <StaggerContainer className="space-y-4">
            {communityPosts.map((post) => {
              const postAuthor = users.find((u) => u.id === post.authorId);
              return (
                <motion.div key={post.id} variants={staggerItemVariants}>
                  <GlassCard className="group cursor-pointer">
                    <div className="flex gap-3">
                      <img src={postAuthor?.avatarUrl} alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{postAuthor?.name}</span>
                          <span className="text-xs text-white/20">{timeAgo(post.createdAt)}</span>
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-accent-cyan transition-colors">{post.title}</h3>
                        <p className="text-sm text-white/40 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                          <span className="flex items-center gap-1"><Heart size={12} /> {post.likesCount}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
            {communityPosts.length === 0 && (
              <p className="text-center text-white/30 py-12">Пока нет обсуждений</p>
            )}
          </StaggerContainer>
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
