import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { NotificationPanel } from '@/app/components/NotificationPanel';
import { Heart, SmilePlus, Sparkles, Clock, History, User, Bell, X } from 'lucide-react';
import { todayAPI, notificationAPI } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns';

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
}: HomeScreenProps) {
  const [todayCard, setTodayCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [showNudgeTooltip, setShowNudgeTooltip] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const previousNotificationIdsRef = React.useRef<Set<string>>(new Set());

  // Create notification sound
  const notificationSound = React.useMemo(() => {
    // Using a pleasant notification tone (Web Audio API)
    return () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Pleasant double beep sound
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        // Second beep
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();

          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);

          oscillator2.frequency.value = 1000;
          oscillator2.type = 'sine';

          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator2.start(audioContext.currentTime);
          oscillator2.stop(audioContext.currentTime + 0.1);
        }, 150);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    };
  }, []);

  useEffect(() => {
    fetchTodayCard();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchTodayCard();
      fetchNotifications();
    }, 1000); // Refresh every 1s for near-instant updates
    return () => clearInterval(interval);
  }, [coupleId]);

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

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications(userId);
      const unreadNotifications = response.notifications?.filter((n: any) => !n.read) || [];
      setNotifications(unreadNotifications);
      setAllNotifications(response.notifications || []);
      
      // Check for NEW notification IDs that weren't in the previous set
      const newNotificationIds = new Set(unreadNotifications.map((n: any) => n.id));
      const previousNotificationIds = previousNotificationIdsRef.current;
      
      // Find truly new notifications (IDs that exist now but didn't exist before)
      let hasNewNotifications = false;
      newNotificationIds.forEach((id) => {
        if (!previousNotificationIds.has(id)) {
          hasNewNotifications = true;
        }
      });
      
      // Only play sound if there are actually new notifications
      if (hasNewNotifications && previousNotificationIds.size > 0) {
        notificationSound();
      }
      
      // Update the set for the next check
      previousNotificationIdsRef.current = newNotificationIds;
    } catch (error) {
      // Silently handle notification errors - they're not critical to app functionality
      // Only log to console for debugging purposes
      console.log('Unable to fetch notifications (non-critical):', error);
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
    if (nudgeCount >= 3) {
      setShowNudgeTooltip(true);
      setTimeout(() => setShowNudgeTooltip(false), 2000);
      return;
    }
    
    try {
      await notificationAPI.sendNudge(coupleId, userId);
      setNudgeCount(nudgeCount + 1);
      alert(`Nudge sent to ${partnerName}! 💗`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.log('Unable to dismiss notification (non-critical):', error);
      // Still remove it from UI even if server update fails
      setNotifications(notifications.filter((n) => n.id !== notificationId));
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
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[image:var(--pulse-gradient)] flex items-center justify-center text-white font-bold">
            {userName[0]}
          </div>
          <div>
            <h2 className="font-semibold">{userName}</h2>
            <p className="text-xs text-muted-foreground">Connected with {partnerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotificationPanel(true)}
            className="p-2 hover:bg-accent rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FB3094] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications.length}
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

          {/* Recent Reactions */}
          {todayCard?.reactions && todayCard.reactions.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <span>Recent:</span>
              {todayCard.reactions.slice(-5).map((reaction: any, i: number) => (
                <span key={i} className="text-lg">{reaction.emoji}</span>
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
                Max 3 nudges per day
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotificationPanel}
        notifications={allNotifications}
        onDismiss={handleDismissNotification}
        onClose={() => setShowNotificationPanel(false)}
      />
    </div>
  );
}