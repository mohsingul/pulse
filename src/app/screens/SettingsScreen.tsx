import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Sun, Moon, Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';
import { storage } from '@/utils/storage';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface SettingsScreenProps {
  onBack: () => void;
  userId: string;
  onSaveSubscription?: (subscriptionData: any) => Promise<void>;
  onDeleteSubscription?: () => Promise<void>;
}

export function SettingsScreen({ onBack, userId, onSaveSubscription, onDeleteSubscription }: SettingsScreenProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState({
    morning: { enabled: true, time: '09:00' },
    midday: { enabled: true, time: '13:00' },
    evening: { enabled: true, time: '19:00' },
  });
  
  const pushNotifications = usePushNotifications(userId);

  useEffect(() => {
    setTheme(storage.getTheme());
    setNotifications(storage.getNotifications());
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    storage.setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleNotificationToggle = (period: 'morning' | 'midday' | 'evening') => {
    const updated = {
      ...notifications,
      [period]: {
        ...notifications[period],
        enabled: !notifications[period].enabled,
      },
    };
    setNotifications(updated);
    storage.setNotifications(updated);
  };

  const handleTimeChange = (period: 'morning' | 'midday' | 'evening', time: string) => {
    const updated = {
      ...notifications,
      [period]: {
        ...notifications[period],
        time,
      },
    };
    setNotifications(updated);
    storage.setNotifications(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold ml-4">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
        {/* Theme */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Appearance</h3>
          <Card>
            <div className="space-y-4">
              <label className="text-sm font-medium">Theme</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-[#A83FFF] bg-[#A83FFF]/5'
                      : 'border-border hover:border-border/50'
                  }`}
                >
                  <Sun className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Light</div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-[#A83FFF] bg-[#A83FFF]/5'
                      : 'border-border hover:border-border/50'
                  }`}
                >
                  <Moon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Dark</div>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Reminder Notifications</h3>
          <p className="text-sm text-muted-foreground">
            We'll gently remind you to update your Pulse
          </p>

          {/* Morning */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Morning</h4>
                <p className="text-sm text-muted-foreground">Start your day</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('morning')}
                className={`w-12 h-7 rounded-full transition-all ${
                  notifications.morning.enabled
                    ? 'bg-[image:var(--pulse-gradient)]'
                    : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.morning.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {notifications.morning.enabled && (
              <input
                type="time"
                value={notifications.morning.time}
                onChange={(e) => handleTimeChange('morning', e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-accent border-2 border-transparent focus:border-[#A83FFF] focus:outline-none"
              />
            )}
          </Card>

          {/* Midday */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Midday</h4>
                <p className="text-sm text-muted-foreground">Check in</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('midday')}
                className={`w-12 h-7 rounded-full transition-all ${
                  notifications.midday.enabled
                    ? 'bg-[image:var(--pulse-gradient)]'
                    : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.midday.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {notifications.midday.enabled && (
              <input
                type="time"
                value={notifications.midday.time}
                onChange={(e) => handleTimeChange('midday', e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-accent border-2 border-transparent focus:border-[#A83FFF] focus:outline-none"
              />
            )}
          </Card>

          {/* Evening */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Evening</h4>
                <p className="text-sm text-muted-foreground">End your day</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('evening')}
                className={`w-12 h-7 rounded-full transition-all ${
                  notifications.evening.enabled
                    ? 'bg-[image:var(--pulse-gradient)]'
                    : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.evening.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {notifications.evening.enabled && (
              <input
                type="time"
                value={notifications.evening.time}
                onChange={(e) => handleTimeChange('evening', e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-accent border-2 border-transparent focus:border-[#A83FFF] focus:outline-none"
              />
            )}
          </Card>
        </div>

        {/* Push Notifications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Get notified on your device
          </p>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
              </div>
              <button
                onClick={pushNotifications.isSubscribed ? pushNotifications.unsubscribe : pushNotifications.subscribe}
                className={`w-12 h-7 rounded-full transition-all ${
                  pushNotifications.isSubscribed
                    ? 'bg-[image:var(--pulse-gradient)]'
                    : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotifications.isSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {!pushNotifications.isSupported && (
              <div className="text-sm text-red-500">
                <AlertCircle className="w-4 h-4 inline-block mr-1" />
                Push notifications are not supported on this device.
              </div>
            )}
          </Card>
        </div>

        {/* About */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">About</h3>
          <Card>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Pulse</strong> - A couples mood board app</p>
              <p>Version 1.0.0</p>
              <p className="pt-2 border-t border-border">
                A little window into your day. Share your mood, moments, and messages with the one person who matters most.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}