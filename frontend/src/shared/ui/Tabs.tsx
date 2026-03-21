import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const [active, setActive] = useState(activeTab || tabs[0]?.id);
  const currentTab = activeTab ?? active;

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className={cn('flex gap-1 p-1 bg-surface-800 rounded-xl', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
            currentTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'
          )}
        >
          {currentTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-surface-600 rounded-lg"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
