import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { ArrowLeft, Target, Trophy, TrendingUp, Award, Calendar } from 'lucide-react';
import { challengesAPI } from '@/utils/api';
import { format } from 'date-fns';

interface ChallengeArchiveScreenProps {
  userId: string;
  coupleId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

export function ChallengeArchiveScreen({
  userId,
  coupleId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onBack,
}: ChallengeArchiveScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [coupleId]);

  const fetchHistory = async () => {
    try {
      const response = await challengesAPI.getHistory(coupleId);
      setHistory(response.history || []);
      setStats(response.stats || { totalCompleted: 0, totalPoints: 0, currentStreak: 0 });
    } catch (error) {
      console.error('Error fetching challenge history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch {
      return timestamp;
    }
  };

  const isUser1 = userId === user1Id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">Challenge Archive</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="text-2xl font-bold">{stats.totalCompleted}</div>
                  <div className="text-xs text-muted-foreground mt-1">Completed</div>
                </Card>

                <Card className="p-4 text-center bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
                  <Award className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                  <div className="text-2xl font-bold">{stats.totalPoints}</div>
                  <div className="text-xs text-muted-foreground mt-1">Points</div>
                </Card>

                <Card className="p-4 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <div className="text-2xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground mt-1">Streak</div>
                </Card>
              </div>
            )}

            {/* History List */}
            {history.length === 0 ? (
              <Card className="py-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">No Challenges Yet</h3>
                <p className="text-muted-foreground">
                  Complete your first weekly challenge together!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground px-1">
                  Completed Challenges
                </h3>
                {history.map((entry: any, index: number) => {
                  const userCompleted = isUser1 ? entry.user1Completed : entry.user2Completed;
                  const partnerCompleted = isUser1 ? entry.user2Completed : entry.user1Completed;
                  const userCompletedAt = isUser1 ? entry.user1CompletedAt : entry.user2CompletedAt;
                  const partnerCompletedAt = isUser1 ? entry.user2CompletedAt : entry.user1CompletedAt;
                  
                  return (
                    <Card key={entry.weekKey || index} className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-400/20 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{entry.title}</h4>
                            <p className="text-xs text-muted-foreground">{entry.category}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30">
                            +{entry.points} pts
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>

                      {/* Completion Info */}
                      <div className="pt-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                            </span>
                          </div>
                        </div>
                        
                        {entry.bothCompleted && (
                          <div className="space-y-2">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="text-xl">🎉</div>
                                  <div>
                                    <p className="font-medium text-green-600 dark:text-green-400">
                                      Both Completed!
                                    </p>
                                    {userCompletedAt && partnerCompletedAt && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        You: {formatDate(userCompletedAt)} • {partnerName}: {formatDate(partnerCompletedAt)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Show responses if available */}
                            {(userCompleted && entry.user1Response && isUser1) || (userCompleted && entry.user2Response && !isUser1) ? (
                              <div className="space-y-2">
                                {((isUser1 && entry.user1Response) || (!isUser1 && entry.user2Response)) && (
                                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-xs font-medium mb-1 text-muted-foreground">Your response:</p>
                                    <p className="text-sm">{isUser1 ? entry.user1Response : entry.user2Response}</p>
                                  </div>
                                )}
                                {((isUser1 && entry.user2Response) || (!isUser1 && entry.user1Response)) && (
                                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <p className="text-xs font-medium mb-1 text-muted-foreground">{partnerName}'s response:</p>
                                    <p className="text-sm">{isUser1 ? entry.user2Response : entry.user1Response}</p>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}