import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft } from 'lucide-react';
import { historyAPI } from '@/utils/api';
import { format } from 'date-fns';

interface MoodArchiveScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

export function MoodArchiveScreen({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onBack,
}: MoodArchiveScreenProps) {
  const [moods, setMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isUser1 = userId === user1Id;

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const response = await historyAPI.get(coupleId);
      const allHistory = response.history || [];

      // Extract all moods from both users
      const allMoods: any[] = [];

      allHistory.forEach((day: any) => {
        // User1's mood
        if (day.user1Mood) {
          allMoods.push({
            mood: day.user1Mood,
            intensity: day.user1Intensity,
            createdBy: user1Id,
            senderName: isUser1 ? 'You' : partnerName,
            isMine: isUser1,
            date: day.date,
            timestamp: day.user1UpdatedAt || day.updatedAt,
          });
        }
        // User2's mood
        if (day.user2Mood) {
          allMoods.push({
            mood: day.user2Mood,
            intensity: day.user2Intensity,
            createdBy: user2Id,
            senderName: isUser1 ? partnerName : 'You',
            isMine: !isUser1,
            date: day.date,
            timestamp: day.user2UpdatedAt || day.updatedAt,
          });
        }
      });

      // Sort by timestamp descending
      allMoods.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setMoods(allMoods);
    } catch (error) {
      console.error('Error fetching moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'EEEE, MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Group moods by date
  const moodsByDate = moods.reduce((acc: any, mood) => {
    const date = formatDate(mood.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(mood);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold ml-4">Mood Archive</h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading moods...</p>
          </div>
        ) : moods.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">😊</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Moods Yet</h3>
              <p className="text-muted-foreground">
                Your shared feelings will live here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(moodsByDate).map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-accent rounded-full">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Moods for this date */}
                <div className="space-y-3">
                  {moodsByDate[date].map((mood: any, index: number) => (
                    <Card
                      key={index}
                      className={`${
                        mood.isMine
                          ? 'ml-8 bg-gradient-to-r from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 border-[#A83FFF]/20'
                          : 'mr-8 bg-accent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Mood Emoji */}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0 ${
                            mood.isMine
                              ? 'bg-[image:var(--pulse-gradient)]'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                        >
                          {mood.mood}
                        </div>

                        {/* Mood Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              {mood.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(mood.timestamp)}
                            </span>
                          </div>
                          {mood.intensity && (
                            <div className="inline-block px-3 py-1 bg-accent rounded-full text-xs font-medium">
                              Intensity: {mood.intensity}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
