import { motion } from 'framer-motion';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllCommunities } from '../../../entities/community';
import { CommunityCard } from '../../../entities/community/ui/CommunityCard';
import { PageTransition, TextReveal, StaggerContainer, staggerItemVariants, GradientMesh } from '../../../shared/ui';

export default function CommunitiesPage() {
  const communities = useAppSelector(selectAllCommunities);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="relative text-center mb-12">
          <GradientMesh className="opacity-30" />
          <div className="relative z-10">
            <TextReveal as="h1" className="text-4xl sm:text-5xl font-bold mb-4">
              IT-Сообщества
            </TextReveal>
            <p className="text-white/40 max-w-md mx-auto">
              Присоединяйся к тематическим кластерам, делись знаниями и расти вместе
            </p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <motion.div key={community.id} variants={staggerItemVariants}>
              <CommunityCard community={community} />
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
