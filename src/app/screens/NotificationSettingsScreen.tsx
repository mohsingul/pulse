import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Bell, MessageCircle, Heart, Sparkles, Moon, Volume2, AlertCircle, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

type PermissionState = 'default' | 'granted' | 'denied';

export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('default');
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [pulseNotifs, setPulseNotifs] = useState(true);
  const [dailyChallengeNotifs, setDailyChallengeNotifs] = useState(true);
  const [sharkModeNotifs, setSharkModeNotifs] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission as PermissionState);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);
    }
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Aimo Pulse', {
        body: 'Your partner sent you a message 💗',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test',
        vibrate: [200, 100, 200],
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[image:var(--pulse-gradient)] text-white px-6 py-4 safe-top">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-white/80">Stay connected with your partner</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Permission Status Card */}
        <PermissionStatusCard
          permissionState={permissionState}
          onRequestPermission={requestPermission}
        />

        {/* Notification Types */}
        {permissionState === 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Notification Types</h2>

            <SettingToggle
              icon={<MessageCircle className="w-5 h-5" />}
              title="Messages"
              description="When your partner sends you a message"
              enabled={messageNotifs}
              onToggle={setMessageNotifs}
              gradient="from-[#FB3094] to-[#A83FFF]"
            />

            <SettingToggle
              icon={<Heart className="w-5 h-5" />}
              title="Pulse Updates"
              description="Mood changes, doodles, and nudges"
              enabled={pulseNotifs}
              onToggle={setPulseNotifs}
              gradient="from-[#A83FFF] to-[#2571FF]"
            />

            <SettingToggle
              icon={<Sparkles className="w-5 h-5" />}
              title="Daily Challenges"
              description="Daily prompts and challenge reminders"
              enabled={dailyChallengeNotifs}
              onToggle={setDailyChallengeNotifs}
              gradient="from-[#2571FF] to-[#FB3094]"
            />

            <SettingToggle
              icon={<Bell className="w-5 h-5" />}
              title="Shark Mode Alerts"
              description="When your partner needs extra support"
              enabled={sharkModeNotifs}
              onToggle={setSharkModeNotifs}
              gradient="from-[#FB3094] to-[#2571FF]"
            />
          </motion.div>
        )}

        {/* Sound & Quiet Hours */}
        {permissionState === 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>

            <SettingToggle
              icon={<Volume2 className="w-5 h-5" />}
              title="Sound"
              description="Play sound with notifications"
              enabled={soundEnabled}
              onToggle={setSoundEnabled}
              gradient="from-[#A83FFF] to-[#FB3094]"
            />

            <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2571FF]/20 to-[#FB3094]/20 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-[#2571FF]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Quiet Hours</p>
                    <p className="text-sm text-muted-foreground">Mute notifications during sleep</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-[#2571FF] peer-checked:to-[#FB3094]"></div>
                </label>
              </div>

              {quietHoursEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border"
                >
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End</label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Notification Preview */}
        {permissionState === 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Preview</h2>

            <div className="space-y-3">
              <NotificationPreview
                title="Aimo Pulse"
                message="Your partner sent you a message 💗"
                time="now"
              />
              <NotificationPreview
                title="Aimo Pulse"
                message="Your partner updated their pulse 💜"
                time="2m ago"
              />
              <NotificationPreview
                title="Aimo Pulse"
                message="A little nudge from your partner 💗"
                time="5m ago"
              />
            </div>

            <Button
              onClick={testNotification}
              className="w-full mt-4 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white"
            >
              Send Test Notification
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PermissionStatusCard({
  permissionState,
  onRequestPermission
}: {
  permissionState: PermissionState;
  onRequestPermission: () => void;
}) {
  const statusConfig = {
    default: {
      icon: <Bell className="w-6 h-6" />,
      title: 'Enable Notifications',
      description: 'Stay connected with your partner through timely updates',
      color: 'from-[#FB3094] to-[#A83FFF]',
      action: 'Enable',
      IconComponent: AlertCircle,
    },
    granted: {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Notifications Enabled',
      description: 'You\'ll receive updates from your partner',
      color: 'from-green-500 to-emerald-500',
      action: null,
      IconComponent: CheckCircle2,
    },
    denied: {
      icon: <XCircle className="w-6 h-6" />,
      title: 'Notifications Blocked',
      description: 'Please enable notifications in your device settings',
      color: 'from-red-500 to-orange-500',
      action: 'Open Settings',
      IconComponent: XCircle,
    },
  };

  const config = statusConfig[permissionState];
  const { IconComponent } = config;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white flex-shrink-0`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{config.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{config.description}</p>

          {config.action && (
            <Button
              onClick={permissionState === 'denied' ? () => window.open('app-settings:') : onRequestPermission}
              className={`bg-gradient-to-r ${config.color} text-white`}
            >
              <Settings className="w-4 h-4 mr-2" />
              {config.action}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onToggle,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  gradient: string;
}) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient}/20 flex items-center justify-center text-[#A83FFF]`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:${gradient}`}></div>
        </label>
      </div>
    </Card>
  );
}

function NotificationPreview({
  title,
  message,
  time
}: {
  title: string;
  message: string;
  time: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FB3094] via-[#A83FFF] to-[#2571FF] flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{message}</p>
        </div>
      </div>
    </div>
  );
}
