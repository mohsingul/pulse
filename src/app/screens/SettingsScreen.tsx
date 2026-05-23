import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Sun, Moon, Bell, BellOff, Smartphone, AlertCircle, ChevronRight } from 'lucide-react';
import { storage } from '@/utils/storage';
import { type FirebaseNotificationControls } from '@/hooks/useFirebaseNotifications';
import { dispatchReminderPreferenceUpdate } from '@/hooks/useReminderNotifications';
import { CalendarSettingsPanel } from '@/app/components/CalendarSettingsPanel';

interface SettingsScreenProps {
  onBack: () => void;
  userId: string;
  userName: string;
  pushNotifications: FirebaseNotificationControls;
  onNotificationSettings?: () => void;
  coupleId?: string;
  user1Id?: string;
  user2Id?: string;
  partnerName?: string;
}

export function SettingsScreen({
  onBack,
  userId,
  userName,
  pushNotifications,
  onNotificationSettings,
  coupleId,
  user1Id,
  user2Id,
  partnerName,
}: SettingsScreenProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState({
    morning: { enabled: true, time: '09:00' },
    midday: { enabled: true, time: '13:00' },
    evening: { enabled: true, time: '19:00' },
  });

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
    dispatchReminderPreferenceUpdate();
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
    dispatchReminderPreferenceUpdate();
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-border safe-top flex-shrink-0">
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

        {/* Push Notifications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Push Notifications</h3>
          <Card>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-5 h-5 text-[#A83FFF]" />
                    <h4 className="font-medium">Real-time Updates</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your partner updates their pulse
                  </p>
                </div>
                {pushNotifications.permission === 'granted' ? (
                  <Bell className="w-5 h-5 text-green-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {pushNotifications.permission === 'default' && (
                <Button
                  onClick={pushNotifications.enableNotifications}
                  disabled={pushNotifications.loading}
                  className="w-full bg-[image:var(--pulse-gradient)] text-white hover:opacity-90"
                >
                  {pushNotifications.loading ? 'Enabling...' : 'Enable Push Notifications'}
                </Button>
              )}

              {pushNotifications.permission === 'denied' && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                        Notifications Blocked
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-500">
                        Please enable notifications in your browser settings to receive updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {pushNotifications.permission === 'granted' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-green-500" />
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                        Push notifications enabled
                      </p>
                    </div>
                    {pushNotifications.fcmToken ? (
                      <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                        Your device is subscribed to push notifications.
                      </p>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                        Notifications are granted but not yet subscribed. Click enable again if needed.
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={pushNotifications.disableNotifications}
                    disabled={pushNotifications.loading}
                    className="w-full bg-muted text-foreground hover:bg-border"
                  >
                    {pushNotifications.loading ? 'Disabling...' : 'Disable Push Notifications'}
                  </Button>
                </div>
              )}

              {onNotificationSettings && (
                <button
                  onClick={onNotificationSettings}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">Advanced Notification Settings</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </Card>
        </div>

        {coupleId && user1Id && user2Id && partnerName && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Shared calendar</h3>
            <p className="text-sm text-muted-foreground">
              Partner colors and shift patterns. You and your partner receive a daily push reminder for events in the next 5 days.
            </p>
            <CalendarSettingsPanel
              coupleId={coupleId}
              userId={userId}
              user1Id={user1Id}
              user2Id={user2Id}
              userName={userName}
              partnerName={partnerName}
            />
          </div>
        )}

        {/* Reminder Notifications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Reminder Notifications</h3>
          <p className="text-sm text-muted-foreground">
            We'll gently remind you to update your Pulse. Reminders are sent as push notifications at your chosen times, even when the app is closed.
          </p>
          {pushNotifications.permission !== 'granted' && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
              Enable push notifications above to receive morning, midday, and evening Pulse reminders on your phone.
            </div>
          )}

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