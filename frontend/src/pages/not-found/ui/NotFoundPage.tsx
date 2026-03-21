import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { PageTransition, Button, GradientMesh } from '../../../shared/ui';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center relative">
        <GradientMesh />
        <div className="relative z-10 text-center">
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="text-[120px] sm:text-[180px] font-bold text-gradient leading-none"
          >
            404
          </motion.h1>
          <p className="text-xl text-white/40 mb-8">Страница не найдена</p>
          <Link to="/">
            <Button icon={<Home size={16} />}>На главную</Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
