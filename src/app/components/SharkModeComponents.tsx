import React from 'react';
import { Card } from '@/app/components/Card';
import { Waves, Heart, Coffee, Sparkles, Flower2, MessageCircle } from 'lucide-react';

interface SharkModeIndicatorProps {
  daysRemaining: number;
  partnerName: string;
}

export function SharkModeIndicator({ daysRemaining, partnerName }: SharkModeIndicatorProps) {
  return (
    <div className="relative mb-4">
      {/* Animated Wave Background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10" />
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
            style={{
              animation: 'wave 3s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <Card className="relative border-purple-500/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center">
              <Waves className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">Shark Mode 🦈</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {partnerName} might need extra care today
              </p>
            </div>
          </div>
          
          {daysRemaining > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-500">{daysRemaining}</div>
              <div className="text-xs text-muted-foreground">
                {daysRemaining === 1 ? 'day' : 'days'}
              </div>
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(-50%);
          }
          50% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}

interface SharkModeSupportCardProps {
  partnerName: string;
}

export function SharkModeSupportCard({ partnerName }: SharkModeSupportCardProps) {
  const suggestions = [
    {
      icon: Heart,
      title: 'Be patient',
      description: 'Extra understanding goes a long way',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      icon: Coffee,
      title: 'Offer comfort',
      description: 'Small gestures make a big difference',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Sparkles,
      title: 'Give space if needed',
      description: 'Sometimes quiet support is best',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: MessageCircle,
      title: 'Check in gently',
      description: 'A simple "thinking of you" helps',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <Card className="border-purple-500/20">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Flower2 className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Support Ideas for {partnerName}</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Here are some gentle ways to show extra care:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <div
                key={index}
                className={`p-3 rounded-xl ${suggestion.bgColor} border border-current/20 transition-all hover:scale-105`}
                style={{ borderColor: suggestion.color.replace('text-', '') }}
              >
                <Icon className={`w-5 h-5 ${suggestion.color} mb-2`} />
                <div className="font-medium text-sm">{suggestion.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {suggestion.description}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center italic">
            These are just suggestions—you know your partner best 💜
          </p>
        </div>
      </div>
    </Card>
  );
}
