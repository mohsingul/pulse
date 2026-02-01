import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { ArrowLeft, Waves, Heart, Calendar } from 'lucide-react';
import { sharkModeAPI } from '@/utils/api';
import { formatDistanceToNow, format } from 'date-fns';

interface SharkModeArchiveScreenProps {
  userId: string;
  coupleId: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

export function SharkModeArchiveScreen({
  userId,
  coupleId,
  userName,
  partnerName,
  onBack,
}: SharkModeArchiveScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [coupleId]);

  const fetchHistory = async () => {
    try {
      const response = await sharkModeAPI.getHistory(coupleId);
      setHistory(response.history || []);
    } catch (error) {
      console.error('Error fetching Shark Mode history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (entry: any) => {
    if (entry.status === 'deactivated') return 'Ended early';
    if (entry.status === 'expired') return 'Completed';
    if (entry.status === 'active') return 'Active';
    return entry.status;
  };

  const getStatusColor = (entry: any) => {
    if (entry.status === 'active') return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
    if (entry.status === 'deactivated') return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch {
      return timestamp;
    }
  };

  const formatDuration = (entry: any) => {
    const start = new Date(entry.activatedAt);
    const end = entry.deactivatedAt 
      ? new Date(entry.deactivatedAt)
      : entry.status === 'expired'
      ? new Date(entry.endsAt)
      : new Date();
    
    const durationMs = end.getTime() - start.getTime();
    const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    return `${days} day${days === 1 ? '' : 's'}`;
  };

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
        <h2 className="text-xl font-semibold">Shark Mode History</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : history.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="text-6xl mb-4">🦈</div>
            <h3 className="text-xl font-semibold mb-2">No Shark Mode History</h3>
            <p className="text-muted-foreground">
              Shark Mode activations will appear here
            </p>
          </Card>
        ) : (
          <>
            {history.map((entry: any, index: number) => {
              const isActivatedByMe = entry.activatedBy === userId;
              const activatorName = isActivatedByMe ? 'You' : entry.activatedByName || partnerName;
              const reassurerName = entry.reassuranceBy === userId ? 'You' : entry.reassuranceByName || partnerName;
              
              return (
                <Card key={entry.id || index} className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center flex-shrink-0">
                        <Waves className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {isActivatedByMe ? 'You' : partnerName} needed support
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(entry.activatedAt)}</span>
                          <span>•</span>
                          <span>{getTimeAgo(entry.activatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap flex-shrink-0 ${getStatusColor(entry)}`}>
                      {getStatus(entry)}
                    </div>
                  </div>

                  {/* Duration and Days */}
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">{formatDuration(entry)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested: </span>
                      <span className="font-medium">{entry.durationDays} day{entry.durationDays === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {isActivatedByMe ? 'Your note:' : `${partnerName}'s note:`}
                      </p>
                      <div className="p-3 rounded-xl bg-accent/50">
                        <p className="text-sm">{entry.note}</p>
                      </div>
                    </div>
                  )}

                  {/* Reassurance */}
                  {entry.reassurance && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {entry.reassuranceBy === userId ? 'Your reassurance:' : `${reassurerName}'s reassurance:`}
                      </p>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <div className="flex items-start space-x-3">
                          <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm">{entry.reassurance}</p>
                            {entry.reassuranceAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {getTimeAgo(entry.reassuranceAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
