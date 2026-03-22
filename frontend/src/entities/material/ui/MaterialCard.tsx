import { Link } from 'react-router-dom';
import { Star, FileText, Code, Video, Presentation } from 'lucide-react';
import { type Material, type User } from '../../../shared/types';
import { GlassCard, Badge } from '../../../shared/ui';
import { useTilt } from '../../../shared/lib/useTilt';
import { LANGUAGE_COLORS, DIFFICULTY_LABELS, FORMAT_LABELS } from '../../../shared/config/constants';

const FORMAT_ICONS: Record<string, any> = {
  article: FileText,
  code: Code,
  video: Video,
  presentation: Presentation,
};

interface MaterialCardProps {
  material: Material;
  author?: User;
}

export function MaterialCard({ material, author }: MaterialCardProps) {
  const tiltRef = useTilt(8);
  const Icon = FORMAT_ICONS[material.format] || FileText;

  return (
    <Link to={`/catalog/${material.id}`}>
      <div ref={tiltRef}>
        <GlassCard
          padding="none"
          className="group cursor-pointer overflow-hidden h-full"
          glow="cyan"
        >
          {/* Cover */}
          <div className="relative h-40 overflow-hidden">
            <img
              src={material.coverUrl}
              alt={material.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent" />

            {/* Format badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="default" size="sm">
                <Icon size={10} className="mr-1" />
                {FORMAT_LABELS[material.format]}
              </Badge>
            </div>

            {/* Language dot */}
            <div
              className="absolute top-3 right-3 w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: LANGUAGE_COLORS[material.language] || '#666' }}
              title={material.language}
            />
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-accent-cyan transition-colors duration-300">
              {material.title}
            </h3>

            {author && (
              <p className="text-xs text-white/30 mt-1.5">
                @{author.username}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {material.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/30">
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium">{material.rating}</span>
                <span className="text-xs text-white/20">({material.ratingCount})</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="mt-2">
              <Badge
                variant={material.difficulty === 'junior' ? 'green' : material.difficulty === 'middle' ? 'cyan' : 'orange'}
                size="sm"
              >
                {DIFFICULTY_LABELS[material.difficulty]}
              </Badge>
            </div>
          </div>
        </GlassCard>
      </div>
    </Link>
  );
}
