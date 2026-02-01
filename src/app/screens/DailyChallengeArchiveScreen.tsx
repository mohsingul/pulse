import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { ArrowLeft, Calendar, TrendingUp, Flame } from 'lucide-react';
import { dailyChallengeAPI } from '@/utils/api';
import { format, parseISO } from 'date-fns';

interface DailyChallengeArchiveScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

export function DailyChallengeArchiveScreen({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onBack,
}: DailyChallengeArchiveScreenProps) {
  const [archive, setArchive] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchive();
  }, [coupleId]);

  async function fetchArchive() {
    try {
      const data = await dailyChallengeAPI.getArchive(coupleId);
      setArchive(data.archive || []);
      setStats(data.stats || { totalAnswered: 0, currentStreak: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching archive:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),12px)]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg sticky top-[max(env(safe-area-inset-top),12px)] z-10 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Daily Challenge Archive</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your journey together</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FB3094] to-[#A83FFF] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#FB3094] to-[#A83FFF] bg-clip-text text-transparent">
              {stats?.totalAnswered || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Challenges Completed</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {stats?.currentStreak || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak 🔥</p>
          </Card>
        </div>

        {/* Archive List */}
        {archive.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-bold mb-2">No completed challenges yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start answering daily challenges together to build your archive!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {archive.map((entry) => {
              const user1Answer = entry.user1Answer;
              const user2Answer = entry.user2Answer;
              const date = parseISO(entry.date);

              return (
                <Card key={entry.date} className="p-5 hover:shadow-lg transition-shadow">
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{format(date, 'MMMM d, yyyy')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{format(date, 'EEEE')}</p>
                      </div>
                    </div>
                    {entry.bothAnswered && (
                      <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        ✓ Both Answered
                      </div>
                    )}
                  </div>

                  {/* Question */}
                  <div className="bg-gradient-to-r from-[#FB3094]/10 via-[#A83FFF]/10 to-[#2571FF]/10 rounded-xl p-3 mb-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center">
                      {entry.question}
                    </p>
                  </div>

                  {/* Answers */}
                  <div className="space-y-3">
                    {/* User 1 Answer */}
                    <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                          {userName}
                        </p>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 ml-8">
                        {user1Answer || <span className="text-gray-400 italic">No answer</span>}
                      </p>
                    </div>

                    {/* User 2 Answer */}
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                          {partnerName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {partnerName}
                        </p>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 ml-8">
                        {user2Answer || <span className="text-gray-400 italic">No answer</span>}
                      </p>
                    </div>
                  </div>

                  {/* Completion timestamp */}
                  {entry.bothAnsweredAt && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-400">
                        Completed together on {format(parseISO(entry.bothAnsweredAt), 'MMM d \'at\' h:mm a')}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}