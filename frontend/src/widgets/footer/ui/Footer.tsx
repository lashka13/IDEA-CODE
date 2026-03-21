import { Link } from 'react-router-dom';
import { Github, MessageCircle, Heart } from 'lucide-react';
import { APP_NAME } from '../../../shared/config/constants';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center">
                <span className="text-surface-900 font-bold text-sm">IT</span>
              </div>
              <span className="text-lg font-bold text-white">{APP_NAME}</span>
            </div>
            <p className="text-sm text-white/40 max-w-md leading-relaxed">
              Платформа обмена знаниями для IT-студентов. Делись конспектами, зарабатывай CodeCoins,
              прокачивай навыки вместе с сообществом.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 mb-3">Платформа</h4>
            <div className="space-y-2">
              <Link to="/catalog" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Каталог</Link>
              <Link to="/communities" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Сообщества</Link>
              <Link to="/wallet" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Кошелёк</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white/60 mb-3">Сообщество</h4>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
                <Github size={14} /> GitHub
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
                <MessageCircle size={14} /> Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            &copy; 2026 {APP_NAME}. МИСИС &times; Т-Банк
          </p>
          <p className="flex items-center gap-1 text-xs text-white/20">
            Сделано с <Heart size={10} className="text-red-400" /> студентами для студентов
          </p>
        </div>
      </div>
    </footer>
  );
}
