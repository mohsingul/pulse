import React, { useState } from 'react';
import { ArrowLeft, Bell, Smartphone, ToggleLeft } from 'lucide-react';
import { IOSNotificationMockup, IOSNotificationShowcase } from '@/app/components/IOSNotificationMockup';
import { NotificationOnboarding } from '@/app/components/NotificationOnboarding';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { motion } from 'motion/react';

interface NotificationShowcaseScreenProps {
  onBack: () => void;
}

export function NotificationShowcaseScreen({ onBack }: NotificationShowcaseScreenProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<'lock-screen' | 'banner' | 'notification-center'>('lock-screen');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[image:var(--pulse-gradient)] text-white px-6 py-4 safe-top shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Notification System</h1>
            <p className="text-sm text-white/80">iOS-style premium notifications</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Overview Card */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FB3094] via-[#A83FFF] to-[#2571FF] flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2">Premium iOS Notifications</h2>
              <p className="text-muted-foreground text-sm">
                A complete notification system designed to feel like a native iOS app, with emotional awareness and relationship-focused UX.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FB3094]/10 to-[#A83FFF]/10 border border-[#FB3094]/20">
              <p className="font-semibold text-sm mb-1">🔔 Push Notifications</p>
              <p className="text-xs text-muted-foreground">Lock screen, banner, notification center</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#A83FFF]/10 to-[#2571FF]/10 border border-[#A83FFF]/20">
              <p className="font-semibold text-sm mb-1">⚙️ Settings & Preferences</p>
              <p className="text-xs text-muted-foreground">Quiet hours, sound, notification types</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#2571FF]/10 to-[#FB3094]/10 border border-[#2571FF]/20">
              <p className="font-semibold text-sm mb-1">💗 Emotionally Aware</p>
              <p className="text-xs text-muted-foreground">Discreet, calm, thoughtful design</p>
            </div>
          </div>
        </Card>

        {/* Interactive Demo Selector */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Notification Styles</h3>
          <div className="flex space-x-2 mb-6">
            <DemoButton
              active={selectedDemo === 'lock-screen'}
              onClick={() => setSelectedDemo('lock-screen')}
              label="Lock Screen"
              icon="🔒"
            />
            <DemoButton
              active={selectedDemo === 'banner'}
              onClick={() => setSelectedDemo('banner')}
              label="Banner"
              icon="📱"
            />
            <DemoButton
              active={selectedDemo === 'notification-center'}
              onClick={() => setSelectedDemo('notification-center')}
              label="Notification Center"
              icon="📋"
            />
          </div>

          <motion.div
            key={selectedDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IOSNotificationMockup
              type={selectedDemo}
              title="Aimo Pulse"
              message={getExampleMessage(selectedDemo)}
              time="now"
            />
          </motion.div>
        </div>

        {/* Onboarding Modal Demo */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Onboarding Experience</h3>
          <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground mb-1">Beautiful Onboarding Modal</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Emotionally warm, glassmorphism design with animated gradients
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white"
            >
              Preview Onboarding Modal
            </Button>
          </Card>
        </div>

        {/* Features List */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Complete Feature Set</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard
              title="Permission Management"
              description="Smart permission requests with beautiful UI"
              icon="🔐"
            />
            <FeatureCard
              title="Notification Settings"
              description="Granular controls for each notification type"
              icon="⚙️"
            />
            <FeatureCard
              title="Quiet Hours"
              description="Automatic silencing during sleep hours"
              icon="🌙"
            />
            <FeatureCard
              title="Sound Controls"
              description="Toggle notification sounds on/off"
              icon="🔊"
            />
            <FeatureCard
              title="Notification Center"
              description="Inbox with swipe gestures and filters"
              icon="📬"
            />
            <FeatureCard
              title="Custom Vibrations"
              description="Different haptic patterns per type"
              icon="📳"
            />
            <FeatureCard
              title="Service Worker"
              description="Background notifications even when app is closed"
              icon="⚡"
            />
            <FeatureCard
              title="iOS Optimized"
              description="Respects safe areas, Dynamic Island, dark mode"
              icon="📱"
            />
          </div>
        </div>

        {/* Design Principles */}
        <Card className="p-6 bg-gradient-to-br from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 border border-[#A83FFF]/20">
          <h3 className="text-lg font-bold text-foreground mb-3">Design Principles</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✨ <strong className="text-foreground">Discreet & Calm:</strong> Notifications strengthen connection without demanding attention</p>
            <p>💗 <strong className="text-foreground">Emotionally Aware:</strong> Copy focuses on relationship closeness, not engagement metrics</p>
            <p>🎨 <strong className="text-foreground">Premium Feel:</strong> Glassmorphism, gradients, and smooth animations</p>
            <p>🔒 <strong className="text-foreground">Privacy First:</strong> No notification content stored in database</p>
            <p>📱 <strong className="text-foreground">Native Experience:</strong> Indistinguishable from iOS system notifications</p>
          </div>
        </Card>

        {/* Technical Info */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border">
          <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-[#A83FFF]" />
            Technical Stack
          </h3>
          <div className="space-y-2 text-sm">
            <TechItem label="Service Worker" value="Background notifications (sw.js)" />
            <TechItem label="Push API" value="Web Push with VAPID keys" />
            <TechItem label="Animations" value="Motion (Framer Motion)" />
            <TechItem label="Storage" value="localStorage for preferences" />
            <TechItem label="Backend" value="Supabase Edge Functions" />
            <TechItem label="Icons" value="lucide-react" />
          </div>
        </Card>

        {/* Documentation Link */}
        <Card className="p-6 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              📚
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Complete Documentation</h3>
              <p className="text-white/90 text-sm mb-4">
                Full setup guide, backend integration, customization options, and troubleshooting available in <code className="bg-white/20 px-2 py-1 rounded">NOTIFICATION_SYSTEM_GUIDE.md</code>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Setup Guide</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Backend Integration</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Testing</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Deployment</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Onboarding Modal */}
      <NotificationOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onEnable={async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setShowOnboarding(false);
          alert('Notifications would be enabled! (Demo mode)');
        }}
      />
    </div>
  );
}

function DemoButton({
  active,
  onClick,
  label,
  icon
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white shadow-lg'
          : 'bg-card border border-border text-muted-foreground hover:border-[#A83FFF]/50'
      }`}
    >
      <div className="text-lg mb-1">{icon}</div>
      {label}
    </button>
  );
}

function FeatureCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Card className="p-4 bg-card/30 backdrop-blur-sm border border-border hover:border-[#A83FFF]/30 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function TechItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground text-xs">{value}</span>
    </div>
  );
}

function getExampleMessage(type: string): string {
  switch (type) {
    case 'lock-screen':
      return 'Your partner sent you a message 💗';
    case 'banner':
      return 'Your partner updated their pulse 💜';
    case 'notification-center':
      return 'A little nudge from your partner 💗';
    default:
      return 'New update from your partner';
  }
}
