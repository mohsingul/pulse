import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { InstallPrompt } from '@/app/components/InstallPrompt';
import { CalendarRemindersHome } from '@/app/components/CalendarRemindersHome';
import { SharkModeHomeCard } from '@/app/components/SharkModeHomeCard';
import { DailyChallenge } from '@/app/components/DailyChallenge';
import { Sparkles, History, User, Calendar, HandHeart, Bell, Clock } from 'lucide-react';
// import { Dices } from 'lucide-react';
import { todayAPI, notificationAPI, sharkModeAPI, partnerStatusAPI, calendarAPI } from '@/utils/api';
// import { sexyDiceGameAPI } from '@/utils/api';
import { storage, NUDGE_DAILY_LIMIT } from '@/utils/storage';
import { getUpcomingCalendarReminders } from '@/app/constants/calendar';
import { formatDistanceToNow } from 'date-fns';
import { PartnerStatusHomeCard } from '@/app/components/PartnerStatusHomeCard';
import { PartnerStatusSheet } from '@/app/components/PartnerStatusSheet';
import {
  getUserStatusFromRecord,
  getPartnerStatusMeta,
  type PartnerStatusData,
} from '@/app/constants/partnerStatus';

interface HomeScreenProps {
  userId: string;
  coupleId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onUpdatePulse: () => void;
  onViewHistory: () => void;
  onViewProfile: () => void;
  onViewCalendar: () => void;
  onViewDailyChallengeArchive?: () => void;
  onPlayTeaseOrPlease?: () => void;
  // onPlaySexyDice?: () => void;
}

const REACTIONS = ['❤️', '🫶', '😘', '😄', '🥺'];

export function HomeScreen({
  userId,
  coupleId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onUpdatePulse,
  onViewHistory,
  onViewProfile,
  onViewCalendar,
  onViewDailyChallengeArchive,
  onPlayTeaseOrPlease,
  // onPlaySexyDice,
}: HomeScreenProps) {
  const [todayCard, setTodayCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [nudgeCount, setNudgeCount] = useState(() => storage.getDailyNudgeCount(coupleId));
  const [showNudgeTooltip, setShowNudgeTooltip] = useState(false);
  const [sharkMode, setSharkMode] = useState<any>(null);
  const [partnerStatusRecord, setPartnerStatusRecord] = useState<any>(null);
  const [showPartnerStatusSheet, setShowPartnerStatusSheet] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  // const [sexyDiceInvitePending, setSexyDiceInvitePending] = useState(false);

  useEffect(() => {
    fetchTodayCard();
    fetchSharkMode();
    fetchPartnerStatus();
    fetchCalendarEvents();
    // fetchSexyDiceInvite();
    const interval = setInterval(() => {
      fetchTodayCard();
      fetchSharkMode();
      fetchPartnerStatus();
      fetchCalendarEvents();
      // fetchSexyDiceInvite();
    }, 1000); // Refresh every 1s for near-instant updates
    return () => clearInterval(interval);
  }, [coupleId, userId]);

  useEffect(() => {
    setNudgeCount(storage.getDailyNudgeCount(coupleId));
  }, [coupleId]);

  // const fetchSexyDiceInvite = async () => {
  //   try {
  //     const data = await sexyDiceGameAPI.get(coupleId, userId);
  //     setSexyDiceInvitePending(
  //       data?.session?.status === 'invite_pending' && data.isHost === false,
  //     );
  //   } catch {
  //     setSexyDiceInvitePending(false);
  //   }
  // };

  const fetchTodayCard = async () => {
    try {
      const response = await todayAPI.get(coupleId);
      setTodayCard(response.todayCard);
      setLoading(false);
      setLoadingError(null);
    } catch (error) {
      console.error('Error fetching today card:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to connect to server');
      setLoading(false);
    }
  };

  const fetchSharkMode = async () => {
    try {
      const response = await sharkModeAPI.getStatus(coupleId);
      setSharkMode(response.sharkMode);
    } catch (error) {
      console.error('Error fetching shark mode:', error);
    }
  };

  const fetchPartnerStatus = async () => {
    try {
      const response = await partnerStatusAPI.get(coupleId);
      setPartnerStatusRecord(response.partnerStatus ?? response.partnerNeeds);
    } catch (error) {
      console.error('Error fetching partner status:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await calendarAPI.get(coupleId);
      setCalendarEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const handleUpdatePartnerStatus = async (data: Omit<PartnerStatusData, 'updatedAt'>) => {
    await partnerStatusAPI.update(coupleId, userId, data);
    await fetchPartnerStatus();
  };

  const handleSendReassurance = async (reassurance: string) => {
    try {
      await sharkModeAPI.sendReassurance(coupleId, userId, reassurance);
      await fetchSharkMode();
    } catch (error: any) {
      console.error('Failed to send reassurance:', error);
      alert(error.message || 'Failed to send reassurance');
      throw error;
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      await todayAPI.react(coupleId, userId, emoji);
      await fetchTodayCard();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleNudge = async () => {
    if (nudgeCount >= NUDGE_DAILY_LIMIT) {
      setShowNudgeTooltip(true);
      setTimeout(() => setShowNudgeTooltip(false), 2000);
      return;
    }

    try {
      await notificationAPI.sendNudge(coupleId, userId);
      const next = storage.incrementDailyNudgeCount(coupleId);
      setNudgeCount(next);
      alert(`Nudge sent to ${partnerName}! 💗`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    }
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const updatedByName = todayCard?.updatedBy === userId ? 'You' : partnerName;
  
  // Determine if current user is user1 or user2
  const isUser1 = userId === user1Id;
  const userPrefix = isUser1 ? 'user1' : 'user2';
  const partnerPrefix = isUser1 ? 'user2' : 'user1';
  
  // Get current user's mood data (for the top "YOUR MOOD TODAY" card)
  const myMood = todayCard?.[`${userPrefix}Mood`];
  const myIntensity = todayCard?.[`${userPrefix}Intensity`];
  const myUpdatedAt = todayCard?.[`${userPrefix}UpdatedAt`];
  
  // Get partner's data (for the main "Today" card)
  const partnerMood = todayCard?.[`${partnerPrefix}Mood`];
  const partnerIntensity = todayCard?.[`${partnerPrefix}Intensity`];
  const partnerMessage = todayCard?.[`${partnerPrefix}Message`];
  const partnerDoodle = todayCard?.[`${partnerPrefix}Doodle`];
  const partnerUpdatedAt = todayCard?.[`${partnerPrefix}UpdatedAt`];

  const myStatus = getUserStatusFromRecord(partnerStatusRecord, userId, user1Id);
  const partnerUserId = isUser1 ? user2Id : user1Id;
  const partnerStatus = getUserStatusFromRecord(partnerStatusRecord, partnerUserId, user1Id);
  const myStatusMeta = myStatus ? getPartnerStatusMeta(myStatus.statusId) : null;
  const calendarReminders = getUpcomingCalendarReminders(calendarEvents);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Server Error Banner */}
      {loadingError && (
        <div className="px-6 pt-4 safe-top">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  Server Connection Issue
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  The Supabase Edge Function is not responding. Please ensure it's deployed and accessible.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  <strong>For developers:</strong> Run <code className="px-1 py-0.5 bg-yellow-500/20 rounded">supabase functions deploy server</code> to deploy the backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-end safe-top flex-shrink-0 border-b border-border">
        <div className="flex items-center space-x-1">
          {/* Sexy Dice — hidden for now
          {onPlaySexyDice && (
            <button
              onClick={onPlaySexyDice}
              className="p-2 hover:bg-fuchsia-500/10 rounded-full transition-colors relative"
              aria-label="Sexy Dice"
              title={sexyDiceInvitePending ? 'Dice game invite — tap to accept' : 'Sexy Dice'}
            >
              <Dices className="w-5 h-5 text-fuchsia-400" />
              {sexyDiceInvitePending && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-fuchsia-500 rounded-full ring-2 ring-background animate-pulse" />
              )}
            </button>
          )}
          */}
          <button
            onClick={() => setShowPartnerStatusSheet(true)}
            className="p-2 hover:bg-accent rounded-full transition-colors relative"
            aria-label="Partner Status"
            title="Partner Status"
          >
            <HandHeart className="w-5 h-5" />
            {myStatusMeta && (
              <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
                {myStatusMeta.emoji}
              </span>
            )}
          </button>
          <button
            onClick={onViewCalendar}
            className="p-2 hover:bg-accent rounded-full transition-colors relative"
            aria-label="Couple calendar"
            title="Couple calendar"
          >
            <Calendar className="w-5 h-5" />
            {calendarReminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FB3094] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {calendarReminders.length}
              </span>
            )}
          </button>
          <button
            onClick={onViewHistory}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={onViewProfile}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
        {/* Partner Status — emotional awareness (not Shark Mode) */}
        {partnerStatus && (
          <PartnerStatusHomeCard partnerName={partnerName} status={partnerStatus} />
        )}

        <CalendarRemindersHome
          reminders={calendarReminders}
          onViewCalendar={onViewCalendar}
        />

        {/* Shark Mode - Show for BOTH users */}
        {sharkMode && (
          <SharkModeHomeCard
            sharkMode={sharkMode}
            userId={userId}
            partnerName={partnerName}
            onSendReassurance={handleSendReassurance}
          />
        )}

        {/* Daily Challenge */}
        <DailyChallenge
          coupleId={coupleId}
          userId={userId}
          user1Id={user1Id}
          user2Id={user2Id}
          userName={userName}
          partnerName={partnerName}
          onViewArchive={() => onViewDailyChallengeArchive?.()}
        />

        {/* Your Mood Summary - Show ONLY the current user's mood */}
        {myMood && myUpdatedAt && (
          <Card className="p-4 bg-gradient-to-r from-[#FB3094]/10 via-[#A83FFF]/10 to-[#2571FF]/10 border-2 border-[#A83FFF]/30">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">{myMood}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-muted-foreground">YOUR MOOD TODAY</p>
                <p className="text-lg font-medium">Shared with {partnerName}</p>
                {myIntensity && (
                  <p className="text-sm text-muted-foreground">Intensity: {myIntensity}</p>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {getTimeAgo(myUpdatedAt)}
              </div>
            </div>
          </Card>
        )}

        {/* Today Card */}
        {loading ? (
          <Card className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading today's pulse...</p>
            </div>
          </Card>
        ) : loadingError ? (
          <Card className="min-h-[400px] flex items-center justify-center bg-destructive/10 border-destructive/30">
            <div className="text-center space-y-4 p-6">
              <div className="text-6xl">⚠️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-destructive">Connection Error</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Unable to connect to the server. Please check your internet connection.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Error: {loadingError}
                </p>
              </div>
              <button
                onClick={() => {
                  setLoadingError(null);
                  setLoading(true);
                  fetchTodayCard();
                }}
                className="px-6 py-2 bg-[image:var(--pulse-gradient)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Retry Connection
              </button>
            </div>
          </Card>
        ) : !partnerMood && !partnerMessage && !partnerDoodle ? (
          <Card gradient className="min-h-[400px] flex flex-col items-center justify-center text-center text-white space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWRpZCkiLz48L3N2Zz4=')] opacity-20" />
            <div className="relative z-10 space-y-4">
              <div className="text-6xl">✨</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Waiting for {partnerName}'s Pulse</h3>
                <p className="text-white/80">
                  They haven't shared anything yet today
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card gradient className="min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWRpZCkiLz48L3N2Zz4=')] opacity-20" />
            
            <div className="relative z-10 space-y-6 text-white">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Today</h3>
                {partnerUpdatedAt && (
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>Updated {getTimeAgo(partnerUpdatedAt)}</span>
                  </div>
                )}
              </div>

              {/* Partner's Mood */}
              {partnerMood && (
                <div className="text-center space-y-2">
                  <div className="text-8xl">{partnerMood}</div>
                  {partnerIntensity && (
                    <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm">
                      Intensity: {partnerIntensity}
                    </div>
                  )}
                </div>
              )}

              {/* Partner's Message */}
              {partnerMessage && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-lg leading-relaxed">{partnerMessage}</p>
                </div>
              )}

              {/* Partner's Doodle */}
              {partnerDoodle && (
                <div className="rounded-2xl p-4">
                  <img
                    src={partnerDoodle}
                    alt="Doodle"
                    className="w-full h-48 object-contain"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-white/60">
                Last updated by {partnerName}
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-4">
          {/* Quick Reactions */}
          {partnerMood && (
            <div className="flex items-center justify-center space-x-3">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-12 h-12 bg-accent hover:bg-accent/80 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Update Button */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={onUpdatePulse}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Update Pulse
          </Button>

          {/* Nudge Button */}
          <div className="relative">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleNudge}
            >
              <Bell className="w-5 h-5 mr-2" />
              Nudge {partnerName}
            </Button>
            {showNudgeTooltip && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm whitespace-nowrap">
                Max {NUDGE_DAILY_LIMIT} nudges per day
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Install Prompt */}
      <InstallPrompt />

      <PartnerStatusSheet
        isOpen={showPartnerStatusSheet}
        onClose={() => setShowPartnerStatusSheet(false)}
        currentStatus={myStatus}
        onSave={handleUpdatePartnerStatus}
      />
    </div>
  );
}