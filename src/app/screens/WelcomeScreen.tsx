import React from 'react';
import { Button } from '@/app/components/Button';
import { GradientBlob } from '@/app/components/GradientBlob';
import { userAPI } from '@/utils/api';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <GradientBlob />
      
      <div className="text-center space-y-8 z-10 max-w-md">
        {/* App Icon/Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-[2rem] bg-[image:var(--pulse-gradient)] shadow-2xl shadow-[#FB3094]/30 flex items-center justify-center">
            <div className="text-5xl">💗</div>
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold bg-[image:var(--pulse-gradient)] bg-clip-text text-transparent">
            Aimo Pulse
          </h1>
          <p className="text-lg text-muted-foreground">
            A little window into your day.
          </p>
        </div>

        {/* Description */}
        <p className="text-base text-muted-foreground leading-relaxed">
          Share your mood, moments, and messages throughout the day with the one person who matters most.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-4 pt-4">
          <Button 
            variant="gradient" 
            size="lg" 
            onClick={onGetStarted}
            className="w-full"
          >
            Get Started
          </Button>
          
          <button
            onClick={onLogin}
            className="w-full text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            I already have a profile
          </button>
        </div>
      </div>
    </div>
  );
}