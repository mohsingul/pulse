import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Sparkles, Check, Archive } from 'lucide-react';
import { dailyChallengeAPI } from '@/utils/api';

interface DailyChallengeProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onViewArchive: () => void;
}

export function DailyChallenge({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onViewArchive,
}: DailyChallengeProps) {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const isUser1 = userId === user1Id;
  const myAnswer = isUser1 ? challenge?.user1Answer : challenge?.user2Answer;
  const partnerAnswer = isUser1 ? challenge?.user2Answer : challenge?.user1Answer;
  const hasAnswered = !!myAnswer;
  const partnerHasAnswered = !!partnerAnswer;
  const bothAnswered = challenge?.bothAnswered;

  useEffect(() => {
    fetchChallenge();
    const interval = setInterval(fetchChallenge, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [coupleId]);

  async function fetchChallenge() {
    try {
      const data = await dailyChallengeAPI.getCurrent(coupleId);
      setChallenge(data.challenge);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const data = await dailyChallengeAPI.submitAnswer(coupleId, userId, answer.trim());
      setChallenge(data.challenge);
      setAnswer('');
      
      if (data.justCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-[#FB3094] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Card>
    );
  }

  if (!challenge) return null;

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl animate-scale-in">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] bg-clip-text text-transparent">
              Both Answered!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You both completed today's challenge 💕
            </p>
          </div>
        </div>
      )}
      
      <Card className="mb-6 relative overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] opacity-20 blur-xl"></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Daily Challenge</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connect deeper together</p>
              </div>
            </div>
            <button
              onClick={onViewArchive}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Question */}
          <div className="bg-gradient-to-r from-[#FB3094]/10 via-[#A83FFF]/10 to-[#2571FF]/10 rounded-xl p-4 mb-4">
            <p className="text-center text-base font-medium text-gray-800 dark:text-gray-200">
              {challenge.question}
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              hasAnswered 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {hasAnswered && <Check className="w-4 h-4" />}
              <span className="text-sm font-medium">{userName}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              partnerHasAnswered 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {partnerHasAnswered && <Check className="w-4 h-4" />}
              <span className="text-sm font-medium">{partnerName}</span>
            </div>
          </div>

          {/* Show partner's answer if they've answered */}
          {partnerHasAnswered && !hasAnswered && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                {partnerName} answered:
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{partnerAnswer}</p>
            </div>
          )}

          {/* Show both answers if both answered */}
          {bothAnswered && (
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-1">
                  {userName}:
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{myAnswer}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                  {partnerName}:
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{partnerAnswer}</p>
              </div>
            </div>
          )}

          {/* Input area - only show if user hasn't answered */}
          {!hasAnswered && (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#A83FFF] resize-none transition-colors"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {answer.length}/500
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || submitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          )}

          {/* Show completion message if user answered but waiting for partner */}
          {hasAnswered && !bothAnswered && (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ✨ Waiting for {partnerName} to answer...
              </p>
            </div>
          )}

          {/* Show celebration message if both completed */}
          {bothAnswered && (
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                🎉 You both completed today's challenge!
              </p>
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
