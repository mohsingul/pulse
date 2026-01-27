import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Calendar } from 'lucide-react';
import { historyAPI } from '@/utils/api';
import { format } from 'date-fns';

interface HistoryScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  partnerName: string;
  onBack: () => void;
}

export function HistoryScreen({ coupleId, userId, user1Id, user2Id, partnerName, onBack }: HistoryScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  
  // Determine if current user is user1 or user2
  const isUser1 = userId === user1Id;
  const partnerPrefix = isUser1 ? 'user2' : 'user1';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await historyAPI.get(coupleId);
      const allHistory = response.history || [];
      
      // Transform history to show only partner's data
      const partnerHistory = allHistory
        .map((day: any) => {
          const partnerMood = day[`${partnerPrefix}Mood`];
          const partnerIntensity = day[`${partnerPrefix}Intensity`];
          const partnerMessage = day[`${partnerPrefix}Message`];
          const partnerDoodle = day[`${partnerPrefix}Doodle`];
          const partnerUpdatedAt = day[`${partnerPrefix}UpdatedAt`];
          
          // Only include days where partner shared something
          if (!partnerMood && !partnerMessage && !partnerDoodle) {
            return null;
          }
          
          return {
            date: day.date,
            mood: partnerMood,
            intensity: partnerIntensity,
            message: partnerMessage,
            doodle: partnerDoodle,
            updatedAt: partnerUpdatedAt || day.updatedAt,
            reactions: day.reactions || [],
          };
        })
        .filter((day: any) => day !== null);
      
      setHistory(partnerHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center border-b border-border">
        <button
          onClick={selectedDay ? () => setSelectedDay(null) : onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold ml-4">
          {selectedDay ? formatDate(selectedDay.date) : 'History'}
        </h2>
      </div>

      {/* Content */}
      {selectedDay ? (
        /* Day Detail */
        <div className="flex-1 px-6 py-8 overflow-y-auto">
          <Card gradient className="min-h-[400px]">
            <div className="space-y-6 text-white">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{partnerName}'s Pulse</h3>
                <div className="text-sm text-white/70">
                  {formatTime(selectedDay.updatedAt)}
                </div>
              </div>

              {/* Mood */}
              {selectedDay.mood && (
                <div className="text-center space-y-2">
                  <div className="text-8xl">{selectedDay.mood}</div>
                  {selectedDay.intensity && (
                    <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm">
                      Intensity: {selectedDay.intensity}
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {selectedDay.message && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <p className="text-lg leading-relaxed">{selectedDay.message}</p>
                </div>
              )}

              {/* Doodle */}
              {selectedDay.doodle && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <img
                    src={selectedDay.doodle}
                    alt="Doodle"
                    className="w-full h-48 object-contain rounded-xl"
                  />
                </div>
              )}

              {/* Reactions */}
              {selectedDay.reactions && selectedDay.reactions.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <h4 className="text-sm font-medium mb-3">Reactions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.reactions.map((reaction: any, i: number) => (
                      <span key={i} className="text-2xl">{reaction.emoji}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* History List */
        <div className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">📅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground">
                  {partnerName} hasn't shared any pulses yet
                </p>
              </div>
            </div>
          ) : (
            history.map((day, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-all"
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex items-center space-x-4">
                  {/* Date */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[image:var(--pulse-gradient)] flex flex-col items-center justify-center text-white text-center">
                    <div className="text-xs font-medium">
                      {format(new Date(day.date), 'MMM')}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(new Date(day.date), 'd')}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {day.mood && <span className="text-2xl">{day.mood}</span>}
                      {day.intensity && (
                        <span className="text-xs px-2 py-1 bg-accent rounded-full">
                          {day.intensity}
                        </span>
                      )}
                    </div>
                    {day.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {day.message}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(day.updatedAt)}
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                    {day.doodle && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img
                          src={day.doodle}
                          alt="Doodle"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {day.reactions && day.reactions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {day.reactions.length} reactions
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}