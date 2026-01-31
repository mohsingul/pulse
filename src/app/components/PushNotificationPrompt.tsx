// Push Notification Prompt Component
// Shows a prompt to enable push notifications after PWA installation
import React, { useState, useEffect } from 'react';
import { Bell, X, Smartphone, CheckCircle } from 'lucide-react';
import { Card } from './Card';

interface PushNotificationPromptProps {
  onEnable: () => Promise<boolean>;
  onDismiss: () => void;
  isPWA: boolean;
  isSupported: boolean;
  isIOS: boolean;
}

export function PushNotificationPrompt({
  onEnable,
  onDismiss,
  isPWA,
  isSupported,
  isIOS
}: PushNotificationPromptProps) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const success = await onEnable();
      if (success) {
        // Auto-dismiss on success
        setTimeout(() => {
          onDismiss();
        }, 2000);
      }
    } finally {
      setIsEnabling(false);
    }
  };

  // Show installation prompt for iOS users
  if (isIOS && !isPWA) {
    return (
      <Card className="relative bg-gradient-to-r from-[#FB3094]/10 via-[#A83FFF]/10 to-[#2571FF]/10 border-[#A83FFF]/30">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[image:var(--pulse-gradient)] flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Install Aimo Pulse</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To receive push notifications on iOS, first add Aimo Pulse to your home screen:
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 mb-3 pl-4">
              <li>1. Tap the Share button <span className="inline-block">⎙</span></li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" in the top right</li>
              <li>4. Open the app from your home screen</li>
            </ol>
            <p className="text-xs text-muted-foreground italic">
              Requires iOS 16.4 or later
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show unsupported message
  if (!isSupported) {
    return (
      <Card className="relative bg-muted/50">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Notifications Not Available</h3>
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported on this device or browser.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show enable prompt
  return (
    <Card className="relative bg-gradient-to-r from-[#FB3094]/10 via-[#A83FFF]/10 to-[#2571FF]/10 border-[#A83FFF]/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-accent rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[image:var(--pulse-gradient)] flex items-center justify-center animate-pulse">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">Stay Connected 💗</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified instantly when your partner shares a pulse, sends a message, or nudges you!
          </p>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full px-6 py-3 bg-[image:var(--pulse-gradient)] text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isEnabling ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
