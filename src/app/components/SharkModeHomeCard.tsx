import React, { useState } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { Waves, Heart, Send } from 'lucide-react';

interface SharkModeHomeCardProps {
  sharkMode: any;
  userId: string;
  partnerName: string;
  onSendReassurance?: (reassurance: string) => Promise<void>;
}

export function SharkModeHomeCard({
  sharkMode,
  userId,
  partnerName,
  onSendReassurance,
}: SharkModeHomeCardProps) {
  const [reassuranceText, setReassuranceText] = useState('');
  const [sending, setSending] = useState(false);

  const isActivatedByMe = sharkMode.activatedBy === userId;
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(sharkMode.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  const handleSendReassurance = async () => {
    if (!reassuranceText.trim() || !onSendReassurance) return;
    setSending(true);
    try {
      await onSendReassurance(reassuranceText);
      setReassuranceText('');
    } catch (error) {
      console.error('Failed to send reassurance:', error);
    } finally {
      setSending(false);
    }
  };

  if (isActivatedByMe) {
    // View for the person who activated shark mode
    return (
      <div className="space-y-4">
        {/* Animated Wave Background Card */}
        <div className="relative">
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

          <Card className="relative border-purple-500/30 bg-background/80 backdrop-blur-sm">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <Waves className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <span>Shark Mode Active 🦈</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {partnerName} knows you might need a little extra care right now
                  </p>
                </div>
                {daysRemaining > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-purple-500">{daysRemaining}</div>
                    <div className="text-xs text-muted-foreground">
                      {daysRemaining === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                )}
              </div>

              {/* Your Note */}
              {sharkMode.note && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Your note:</p>
                  <div className="p-3 rounded-xl bg-accent/50">
                    <p className="text-sm">{sharkMode.note}</p>
                  </div>
                </div>
              )}

              {/* Reassurance Received */}
              {sharkMode.reassurance && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {partnerName}'s reassurance:
                  </p>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <div className="flex items-start space-x-3">
                      <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm flex-1">{sharkMode.reassurance}</p>
                    </div>
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
      </div>
    );
  }

  // View for the partner
  return (
    <div className="space-y-4">
      {/* Animated Wave Background Card */}
      <div className="relative">
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

        <Card className="relative border-purple-500/30 bg-background/80 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center flex-shrink-0">
                <Waves className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center space-x-2">
                  <span>Shark Mode 🦈</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {partnerName} might need extra care today
                </p>
              </div>
              {daysRemaining > 0 && (
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-purple-500">{daysRemaining}</div>
                  <div className="text-xs text-muted-foreground">
                    {daysRemaining === 1 ? 'day' : 'days'}
                  </div>
                </div>
              )}
            </div>

            {/* Partner's Note */}
            {sharkMode.note && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">{partnerName} says:</p>
                <div className="p-3 rounded-xl bg-accent/50">
                  <p className="text-sm">{sharkMode.note}</p>
                </div>
              </div>
            )}

            {/* Reassurance Section */}
            <div className="pt-3 border-t border-border/50 space-y-3">
              {sharkMode.reassurance ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Your reassurance:</p>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <div className="flex items-start space-x-3">
                      <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm flex-1">{sharkMode.reassurance}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Send a reassuring message:
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      value={reassuranceText}
                      onChange={(e) => setReassuranceText(e.target.value)}
                      placeholder="I'm here for you... 💜"
                      className="bg-accent/50 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReassurance();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReassurance}
                      disabled={!reassuranceText.trim() || sending}
                      className="px-4"
                    >
                      {sending ? '...' : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
    </div>
  );
}