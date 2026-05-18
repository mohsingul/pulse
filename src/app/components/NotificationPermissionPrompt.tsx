import React from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './Button';

interface NotificationPermissionPromptProps {
  onEnable: () => void;
  onDismiss: () => void;
}

export function NotificationPermissionPrompt({ onEnable, onDismiss }: NotificationPermissionPromptProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full space-y-6 p-6">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-[#FB3094]/20 via-[#A83FFF]/20 to-[#2571FF]/20 rounded-full">
            <Bell className="w-8 h-8 text-[#A83FFF]" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-center">
          <h3 className="text-2xl font-bold">Stay Connected</h3>
          <p className="text-muted-foreground leading-relaxed">
            Enable notifications to receive instant updates from your partner, reminders for daily challenges, and important milestones.
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-[#A83FFF] font-bold">✓</span>
            <span className="text-muted-foreground">Partner updates and messages</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-[#A83FFF] font-bold">✓</span>
            <span className="text-muted-foreground">Daily challenge reminders</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-[#A83FFF] font-bold">✓</span>
            <span className="text-muted-foreground">Mood and milestone alerts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-3 rounded-full border-2 border-border text-foreground font-medium hover:bg-accent transition-colors"
          >
            Maybe Later
          </button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={onEnable}
          >
            Enable Now
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          You can change this anytime in Settings
        </p>
      </div>
    </div>
  );
}
