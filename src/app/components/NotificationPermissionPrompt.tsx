import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from './Button';

interface NotificationPermissionPromptProps {
  onEnable: () => void;
  permissionStatus: NotificationPermission;
}

export function NotificationPermissionPrompt({ onEnable, permissionStatus }: NotificationPermissionPromptProps) {
  const isDenied = permissionStatus === 'denied';

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full space-y-6 p-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-[#FB3094]/20 via-[#A83FFF]/20 to-[#2571FF]/20 rounded-full">
            <Bell className="w-8 h-8 text-[#A83FFF]" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-center">
          <h3 className="text-2xl font-bold">Enable Notifications</h3>
          <p className="text-muted-foreground leading-relaxed">
            {isDenied
              ? 'Notifications are currently blocked. Please allow notifications in your browser or device settings to continue using Aimo Pulse as intended.'
              : 'Enable notifications now to receive instant updates from your partner, daily challenge reminders, and mood alerts.'}
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

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="gradient"
            className="w-full"
            onClick={onEnable}
          >
            {isDenied ? 'Retry / Open Settings' : 'Enable Now'}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          This step is required to continue.
        </p>
      </div>
    </div>
  );
}
