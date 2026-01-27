import React from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { Plus, Hash } from 'lucide-react';

interface ConnectScreenProps {
  onCreateCouple: () => void;
  onJoinCouple: () => void;
}

export function ConnectScreen({ onCreateCouple, onJoinCouple }: ConnectScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Connect with Your Partner</h1>
          <p className="text-muted-foreground">
            Connect with one person only. Private by default.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
            <button
              onClick={onCreateCouple}
              className="w-full p-6 text-left space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-[image:var(--pulse-gradient)] rounded-2xl">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Create a Couple</h3>
                <p className="text-muted-foreground text-sm">
                  Generate a 6-digit code to share with your partner
                </p>
              </div>
            </button>
          </Card>

          <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
            <button
              onClick={onJoinCouple}
              className="w-full p-6 text-left space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-secondary rounded-2xl">
                  <Hash className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div className="text-2xl group-hover:scale-110 transition-transform">
                  🔗
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Join with Code</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your partner's 6-digit code to connect
                </p>
              </div>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
