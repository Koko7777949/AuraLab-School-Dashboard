'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  FileText,
  UserCheck,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const FAB_ACTIONS = [
  { id: 'add-student', label: 'إضافة طالب', icon: UserPlus, section: 'students' as const },
  { id: 'create-exam', label: 'إنشاء امتحان', icon: FileText, section: 'exams' as const },
  { id: 'take-attendance', label: 'تسجيل حضور', icon: UserCheck, section: 'attendance' as const },
  { id: 'send-message', label: 'إرسال رسالة', icon: MessageSquare, section: 'messages' as const },
];

export default function FabActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveSection } = useAppStore();

  const handleAction = (section: Parameters<typeof setActiveSection>[0]) => {
    setActiveSection(section);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end gap-2" dir="rtl">
      {/* Radial menu items */}
      <AnimatePresence>
        {isOpen && FAB_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          // Calculate position for radial layout (spread upward in RTL)
          const angle = -90 + (index - (FAB_ACTIONS.length - 1) / 2) * 28;
          const rad = (angle * Math.PI) / 180;
          const distance = 70;
          const x = Math.cos(rad) * distance;
          const y = Math.sin(rad) * distance;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
              animate={{ opacity: 1, x, y, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
                delay: index * 0.05,
              }}
              onClick={() => handleAction(action.section)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5
                bg-[#1A1A24] border border-[#D4A574]/20
                text-sm font-medium text-slate-200
                shadow-lg shadow-black/30
                transition-all duration-200
                hover:bg-[#D4A574]/15 hover:border-[#D4A574]/40 hover:text-[#D4A574]
                active:scale-95"
              style={{ direction: 'rtl' }}
            >
              <Icon className="h-4 w-4 text-[#D4A574]" />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-14 w-14 rounded-full
          shadow-xl shadow-black/30
          transition-colors duration-200"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #B07D4F, #D4A574)'
            : 'linear-gradient(135deg, #D4A574, #E8C9A8)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(212,165,116,0.3)'
            : '0 4px 20px rgba(212,165,116,0.4)',
        }}
        aria-label={isOpen ? 'إغلاق القائمة' : 'إجراءات سريعة'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-[#121218]" />
          ) : (
            <Plus className="h-6 w-6 text-[#121218]" />
          )}
        </motion.div>
      </motion.button>

      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
