import { Link } from 'react-router-dom';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { type Community } from '../../../shared/types';
import { GlassCard } from '../../../shared/ui';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link to={`/communities/${community.slug}`}>
      <GlassCard padding="none" className="group cursor-pointer overflow-hidden h-full" glow="cyan">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={community.coverUrl}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="text-2xl">{community.iconEmoji}</span>
            <h3 className="text-lg font-bold">{community.name}</h3>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-white/40 line-clamp-2 mb-3">{community.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${community.color}30`, color: community.color }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <Users size={12} /> {community.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} /> {community.materialCount}
            </span>
            <span className="flex items-center gap-1 ml-auto" style={{ color: community.color }}>
              <TrendingUp size={12} /> {community.activityScore}%
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
