import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface NotificationOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => Promise<void>;
}

export function NotificationOnboarding({
  isOpen,
  onClose,
  onEnable
}: NotificationOnboardingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowPosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await onEnable();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md">
              {/* Animated glow */}
              <motion.div
                animate={{
                  x: `${glowPosition.x}%`,
                  y: `${glowPosition.y}%`,
                }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                className="absolute inset-0 opacity-30 blur-3xl"
                style={{
                  background: 'radial-gradient(circle, #FB3094 0%, #A83FFF 50%, #2571FF 100%)',
                }}
              />

              {/* Glass card */}
              <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Content */}
                <div className="p-8 pt-12">
                  {/* Icon with animated pulse */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#FB3094] via-[#A83FFF] to-[#2571FF] flex items-center justify-center mb-6 relative"
                  >
                    {/* Pulsing rings */}
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FB3094] via-[#A83FFF] to-[#2571FF]"
                    />
                    <Bell className="w-10 h-10 text-white relative z-10" />
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] bg-clip-text text-transparent">
                    Stay connected even when you're apart
                  </h2>

                  {/* Description */}
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    Enable notifications so you never miss a message, pulse update, or emotional check-in from your partner.
                  </p>

                  {/* Feature highlights */}
                  <div className="space-y-4 mb-8">
                    <FeatureItem
                      icon={<MessageCircle className="w-5 h-5" />}
                      text="Instant messages and emotional updates"
                      delay={0.1}
                    />
                    <FeatureItem
                      icon={<Heart className="w-5 h-5" />}
                      text="Gentle nudges when you're missed"
                      delay={0.2}
                    />
                    <FeatureItem
                      icon={<Sparkles className="w-5 h-5" />}
                      text="Daily challenges and reminders"
                      delay={0.3}
                    />
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleEnable}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          ⏳
                        </motion.div>
                      ) : (
                        'Enable Notifications'
                      )}
                    </Button>

                    <button
                      onClick={onClose}
                      className="w-full text-gray-600 dark:text-gray-400 font-medium py-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>

                  {/* Privacy note */}
                  <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
                    🔒 Your notifications are private and secure. You can change this anytime in settings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FeatureItem({
  icon,
  text,
  delay
}: {
  icon: React.ReactNode;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#FB3094]/20 via-[#A83FFF]/20 to-[#2571FF]/20 flex items-center justify-center text-[#A83FFF]">
        {icon}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
        {text}
      </p>
    </motion.div>
  );
}
