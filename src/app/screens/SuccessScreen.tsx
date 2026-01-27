import React, { useEffect } from 'react';
import { Button } from '@/app/components/Button';

interface SuccessScreenProps {
  partnerName: string;
  onContinue: () => void;
}

export function SuccessScreen({ partnerName, onContinue }: SuccessScreenProps) {
  useEffect(() => {
    // Optional confetti effect could go here
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Animation */}
        <div className="relative">
          <div className="text-8xl animate-bounce">💕</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-[#FB3094]/20 rounded-full animate-ping" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">You're Connected!</h1>
          <p className="text-lg text-muted-foreground">
            You and <span className="font-semibold text-foreground">{partnerName}</span> can now share your daily pulse.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-accent/50 rounded-3xl p-6 space-y-3 text-left">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">😊</div>
            <div>
              <h3 className="font-semibold">Share Your Mood</h3>
              <p className="text-sm text-muted-foreground">Update how you're feeling throughout the day</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💬</div>
            <div>
              <h3 className="font-semibold">Quick Messages</h3>
              <p className="text-sm text-muted-foreground">Send short updates or use quick templates</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🎨</div>
            <div>
              <h3 className="font-semibold">Doodle Together</h3>
              <p className="text-sm text-muted-foreground">Share little drawings to brighten each other's day</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}
