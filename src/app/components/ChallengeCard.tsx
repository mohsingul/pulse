import React, { useState } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Target, Check, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';

interface ChallengeCardProps {
  challenge: any;
  userId: string;
  user1Id: string;
  user2Id: string;
  partnerName: string;
  onComplete: (response?: string) => Promise<void>;
  onViewHistory: () => void;
}

export function ChallengeCard({
  challenge,
  userId,
  user1Id,
  user2Id,
  partnerName,
  onComplete,
  onViewHistory,
}: ChallengeCardProps) {
  const [completing, setCompleting] = useState(false);
  const [response, setResponse] = useState('');
  const [showInput, setShowInput] = useState(false);

  const isUser1 = userId === user1Id;
  const userCompleted = isUser1 ? challenge.user1Completed : challenge.user2Completed;
  const partnerCompleted = isUser1 ? challenge.user2Completed : challenge.user1Completed;
  const userResponse = isUser1 ? challenge.user1Response : challenge.user2Response;
  const partnerResponse = isUser1 ? challenge.user2Response : challenge.user1Response;
  const bothCompleted = challenge.bothCompleted;

  const handleComplete = async () => {
    if (userCompleted) return;
    
    // Show input first if not shown yet
    if (!showInput && !response.trim()) {
      setShowInput(true);
      return;
    }
    
    setCompleting(true);
    try {
      await onComplete(response.trim() || undefined);
      setResponse('');
      setShowInput(false);
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    } finally {
      setCompleting(false);
    }
  };

  const getDaysLeft = () => {
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const daysLeft = getDaysLeft();

  return (
    <div className="space-y-2">
      {/* Animated Challenge Card */}
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-purple-500/10" />
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"
              style={{
                animation: 'shimmer 3s ease-in-out infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>

        <Card className="relative border-orange-500/30 bg-background/80 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-400/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold">This Week's Challenge 🎯</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xl font-bold text-orange-500">{challenge.points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </div>

            {/* Challenge Details */}
            <div className="pt-3 border-t border-border/50 space-y-3">
              <div>
                <h4 className="font-semibold text-lg mb-1">{challenge.title}</h4>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4 text-sm">
                  <div className={`flex items-center space-x-1 ${userCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {userCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-current rounded-full" />
                    )}
                    <span>You</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${partnerCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {partnerCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-current rounded-full" />
                    )}
                    <span>{partnerName}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Last day!'}
                </div>
              </div>
            </div>

            {/* Show responses if both completed */}
            {bothCompleted && (userResponse || partnerResponse) && (
              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>What you both shared:</span>
                </div>
                {userResponse && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm font-medium mb-1">You:</p>
                    <p className="text-sm text-muted-foreground">{userResponse}</p>
                  </div>
                )}
                {partnerResponse && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm font-medium mb-1">{partnerName}:</p>
                    <p className="text-sm text-muted-foreground">{partnerResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Completion Status / Action Button */}
            <div className="pt-3 border-t border-border/50">
              {bothCompleted ? (
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      Challenge Completed!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      +{challenge.points} points earned together
                    </p>
                  </div>
                </div>
              ) : userCompleted ? (
                <div className="text-center space-y-2">
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">You completed this!</span>
                    </div>
                  </div>
                  {userResponse && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium mb-1">Your response:</p>
                      <p className="text-sm text-muted-foreground">{userResponse}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Waiting for {partnerName} to complete it too 💪
                  </p>
                </div>
              ) : partnerCompleted ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2">
                    <p className="text-sm text-center">
                      <span className="font-medium">{partnerName}</span> completed the challenge! 🎊
                    </p>
                  </div>
                  {showInput ? (
                    <div className="space-y-2">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Share your thoughts or what you did... (optional)"
                        className="w-full px-4 py-3 bg-accent rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FB3094] min-h-[100px]"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="gradient"
                          onClick={handleComplete}
                          disabled={completing}
                          className="flex-1"
                        >
                          {completing ? '...' : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Complete Challenge
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowInput(false)}
                          className="px-4"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={handleComplete}
                      disabled={completing}
                      className="w-full"
                    >
                      {completing ? '...' : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {showInput ? (
                    <div className="space-y-2">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Share your thoughts or what you did... (optional)"
                        className="w-full px-4 py-3 bg-accent rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FB3094] min-h-[100px]"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="gradient"
                          onClick={handleComplete}
                          disabled={completing}
                          className="flex-1"
                        >
                          {completing ? '...' : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Complete Challenge
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowInput(false)}
                          className="px-4"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={handleComplete}
                      disabled={completing}
                      className="w-full"
                    >
                      {completing ? '...' : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <style>{`
          @keyframes shimmer {
            0%, 100% {
              transform: translateX(-50%);
            }
            50% {
              transform: translateX(50%);
            }
          }
        `}</style>
      </div>

      {/* View History Button */}
      <button
        onClick={onViewHistory}
        className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center space-x-2"
      >
        <TrendingUp className="w-4 h-4" />
        <span>View Challenge History & Stats</span>
      </button>
    </div>
  );
}
