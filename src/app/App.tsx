/// <reference types="react" />
import React, { useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { coupleAPI, todayAPI, notificationAPI, userAPI, sharkModeAPI } from '@/utils/api';
import { projectId, publicAnonKey } from '/utils/supabase/info';
// Screens
import { WelcomeScreen } from '@/app/screens/WelcomeScreen';
import { CreateProfileScreen } from '@/app/screens/CreateProfileScreen';
import { LoginScreen } from '@/app/screens/LoginScreen';
import { ConnectScreen } from '@/app/screens/ConnectScreen';
import { CreateCoupleScreen } from '@/app/screens/CreateCoupleScreen';
import { JoinCoupleScreen } from '@/app/screens/JoinCoupleScreen';
import { SuccessScreen } from '@/app/screens/SuccessScreen';
import { HomeScreen } from '@/app/screens/HomeScreen';
import { ProfileScreen } from '@/app/screens/ProfileScreen';
import { SettingsScreen } from '@/app/screens/SettingsScreen';
import { HistoryScreen } from '@/app/screens/HistoryScreen';
import { DoodleCanvasScreen } from '@/app/screens/DoodleCanvasScreen';
import { DoodleGalleryScreen } from '@/app/screens/DoodleGalleryScreen';
import { MessageArchiveScreen } from '@/app/screens/MessageArchiveScreen';
import { MoodArchiveScreen } from '@/app/screens/MoodArchiveScreen';
import { SharkModeArchiveScreen } from '@/app/screens/SharkModeArchiveScreen';
import { DailyChallengeArchiveScreen } from '@/app/screens/DailyChallengeArchiveScreen';
import { NotificationSettingsScreen } from '@/app/screens/NotificationSettingsScreen';
import { NotificationCenterScreen } from '@/app/screens/NotificationCenterScreen';
import { CoupleCalendarScreen } from '@/app/screens/CoupleCalendarScreen';
import { TeaseOrPleaseScreen } from '@/app/screens/TeaseOrPleaseScreen';
// Sexy Dice — hidden for now (re-enable to launch)
// import { SexyDiceScreen } from '@/app/screens/SexyDiceScreen';

// Components
import { UpdatePulseSheet } from '@/app/components/UpdatePulseSheet';
import { DoodleExpandedView } from '@/app/components/DoodleExpandedView';
import { NotificationOnboarding } from '@/app/components/NotificationOnboarding';
import { NotificationPermissionPrompt } from '@/app/components/NotificationPermissionPrompt';

// Hooks
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import { useReminderNotifications, syncReminderPreferencesToServer } from '@/hooks/useReminderNotifications';
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle';
import { calendarAPI, reminderAPI } from '@/utils/api';
import {
  parseAppDeepLink,
  savePendingCalendarEvent,
  consumePendingCalendarEvent,
  clearAppUrlParams,
} from '@/utils/deepLink';
import { bootstrapPushRegistration, refreshPushRegistrationIfNeeded } from '@/utils/pushBootstrap';

type Screen =
  | 'welcome'
  | 'create-profile'
  | 'login'
  | 'connect'
  | 'create-couple'
  | 'join-couple'
  | 'success'
  | 'home'
  | 'profile'
  | 'settings'
  | 'notification-settings'
  | 'notification-center'
  | 'history'
  | 'doodle'
  | 'doodle-gallery'
  | 'message-archive'
  | 'mood-archive'
  | 'shark-mode-archive'
  | 'daily-challenge-archive'
  | 'couple-calendar'
  | 'tease-or-please';
  // | 'sexy-dice';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [user, setUser] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [expandedDoodle, setExpandedDoodle] = useState<any>(null);
  const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
  const [showNotificationPermissionPrompt, setShowNotificationPermissionPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [highlightCalendarEventId, setHighlightCalendarEventId] = useState<string | null>(null);

  // Push works without an active login session (FCM token + prefs stay on server)
  const pushUserId = user?.userId ?? storage.getPushUserId() ?? undefined;
  const pairedCoupleId = couple?.coupleId ?? storage.getPairedCoupleId() ?? undefined;

  const notifications = useFirebaseNotifications(pushUserId);

  useReminderNotifications(!!pushUserId && notificationPermission === 'granted');

  // Log out when the app is closed (sessionStorage session ends)
  useSessionLifecycle(() => {
    setUser(null);
    setCouple(null);
    setCurrentScreen('welcome');
  });

  const openCalendarEvent = (eventId: string) => {
    setHighlightCalendarEventId(eventId);
    setCurrentScreen('couple-calendar');
    clearAppUrlParams();
  };

  const applyDeepLinkNavigation = () => {
    const link = parseAppDeepLink();
    const pendingEventId = consumePendingCalendarEvent();
    const eventId = link?.eventId || pendingEventId;

    if (link?.screen === 'couple-calendar' && eventId) {
      if (couple) {
        openCalendarEvent(eventId);
      } else {
        savePendingCalendarEvent(eventId);
      }
    }
  };

  useEffect(() => {
    // Initialize theme
    const savedTheme = storage.getTheme();
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Drop legacy persistent login from older builds
    localStorage.removeItem('pulse_user');

    // Test backend connection
    testBackendConnection();

    // Restore user only if this browser session is still active
    const savedUser = storage.getUser();
    if (savedUser) {
      setUser(savedUser);
      // Check for existing couple
      checkCouple(savedUser.userId);
    }

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    if (Notification.permission === 'granted') {
      refreshPushRegistrationIfNeeded().catch((err) =>
        console.warn('[Push] Startup refresh failed:', err),
      );
    }

    applyDeepLinkNavigation();
  }, []);

  useEffect(() => {
    if (couple) {
      applyDeepLinkNavigation();
    }
  }, [couple]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_CALENDAR' && event.data.eventId) {
        openCalendarEvent(event.data.eventId);
      }
      if (event.data?.type === 'NAVIGATE_HOME') {
        setHighlightCalendarEventId(null);
        setCurrentScreen('home');
        clearAppUrlParams();
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [couple]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Notification.permission === 'granted') {
        refreshPushRegistrationIfNeeded().catch((err) =>
          console.warn('[Push] Resume refresh failed:', err),
        );
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (user && notificationPermission !== 'granted') {
      setShowNotificationPermissionPrompt(true);
    }
  }, [user, notificationPermission]);

  // Register FCM + reminder prefs whenever notifications are allowed (session optional)
  useEffect(() => {
    if (!pushUserId || notificationPermission !== 'granted') {
      return;
    }

    notifications.checkNotificationStatus().catch((err) => {
      console.error('[Notifications] Token sync failed:', err);
    });
    bootstrapPushRegistration(pushUserId).catch((err) => {
      console.error('[Notifications] Push bootstrap failed:', err);
    });
    syncReminderPreferencesToServer(pushUserId).catch((err) => {
      console.error('[Reminders] Preference sync failed:', err);
    });
  }, [pushUserId, notificationPermission]);

  // Server-side FCM reminders when app opens (pulse + calendar); cron handles when fully closed
  useEffect(() => {
    if (!pushUserId || notificationPermission !== 'granted') {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `reminders_synced_${pushUserId}_${today}`;
    if (sessionStorage.getItem(storageKey) === '1') {
      return;
    }

    const run = pairedCoupleId
      ? calendarAPI.processReminders(pairedCoupleId, pushUserId)
      : reminderAPI.processForUser(pushUserId);

    Promise.resolve(run)
      .then(() => sessionStorage.setItem(storageKey, '1'))
      .catch((err) => console.warn('[Reminders] Sync failed:', err));
  }, [pushUserId, pairedCoupleId, notificationPermission]);

  // Show notification onboarding after successful pairing
  useEffect(() => {
    if (couple && notifications.permission === 'default' && currentScreen === 'success') {
      // Wait 2 seconds after pairing success, then show onboarding
      const timer = setTimeout(() => {
        setShowNotificationOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [couple, notifications.permission, currentScreen]);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey,
          },
        }
      );
      const data = await response.json();
      console.log('[Backend Health Check]', data);

      // Initialize demo users silently in background (no UI logs)
      try {
        await userAPI.initDemo();
      } catch (demoError: any) {
        // Silent - demo user initialization is optional
      }
    } catch (error) {
      console.error('[Backend Health Check Failed]', error);
      console.error('Make sure the Supabase Edge Function is deployed');
    }
  };

  const checkCouple = async (userId: string) => {
    try {
      const response = await coupleAPI.get(userId);
      if (response.coupleId) {
        storage.setPairedCoupleId(response.coupleId);
        setCouple(response);
        setCurrentScreen('home');
      } else {
        setCurrentScreen('connect');
      }
    } catch (error) {
      console.error('Error checking couple:', error);
      setCurrentScreen('connect');
    }
  };

  const handleAuthSuccess = (userData: any) => {
    storage.setPushUserId(userData.userId);
    setUser(userData);
    checkCouple(userData.userId);

    if (notificationPermission !== 'granted') {
      setShowNotificationPermissionPrompt(true);
    } else {
      bootstrapPushRegistration(userData.userId).catch(console.error);
    }
  };

  const handlePairingSuccess = (coupleData: any) => {
    if (coupleData?.coupleId) {
      storage.setPairedCoupleId(coupleData.coupleId);
    }
    setCouple(coupleData);
    setCurrentScreen('success');
  };

  const handleReconnect = (coupleData: any) => {
    if (coupleData?.coupleId) {
      storage.setPairedCoupleId(coupleData.coupleId);
    }
    setCouple(coupleData);
    setCurrentScreen('home');
  };

  const handleUpdatePulse = async (data: {
    mood?: string;
    message?: string;
    doodle?: string;
    intensity?: string;
  }) => {
    if (!couple?.coupleId || !user?.userId) return;

    try {
      await todayAPI.update(couple.coupleId, user.userId, data);
      
      // Send mood update notification if mood is present
      if (data.mood) {
        try {
          await notificationAPI.sendMoodUpdate(
            couple.coupleId,
            user.userId,
            data.mood,
            data.intensity
          );
        } catch (notificationError) {
          console.log('Unable to send mood notification (non-critical):', notificationError);
          // Don't fail the update if notification fails
        }
      }
      
      // Send message update notification if message is present
      if (data.message) {
        try {
          await notificationAPI.sendMessageUpdate(
            couple.coupleId,
            user.userId,
            data.message
          );
        } catch (notificationError) {
          console.log('Unable to send message notification (non-critical):', notificationError);
          // Don't fail the update if notification fails
        }
      }
      
      // Send doodle update notification if doodle is present
      if (data.doodle) {
        try {
          await notificationAPI.sendDoodleUpdate(
            couple.coupleId,
            user.userId,
            data.doodle
          );
        } catch (notificationError) {
          console.log('Unable to send doodle notification (non-critical):', notificationError);
          // Don't fail the update if notification fails
        }
      }
      
      // The HomeScreen will auto-refresh
    } catch (error) {
      console.error('Error updating pulse:', error);
      alert('Failed to update pulse. Please try again.');
    }
  };

  const handleDoodleSave = async (dataUrl: string) => {
    setCurrentScreen('home');
    await handleUpdatePulse({ doodle: dataUrl });
  };

  const handleUnpair = () => {
    setCouple(null);
    setCurrentScreen('connect');
  };

  const handleLogout = () => {
    storage.clearPushContext();
    storage.clearSession();
    setUser(null);
    setCouple(null);
    setCurrentScreen('welcome');
  };

  const handleEnableNotifications = async () => {
    try {
      const uid = user?.userId ?? storage.getPushUserId();
      if (uid) {
        storage.setPushUserId(uid);
        await notifications.enableNotifications();
        await bootstrapPushRegistration(uid);
        setNotificationPermission('granted');
        setShowNotificationPermissionPrompt(false);
        console.log('[Notifications] FCM enabled and token registered');
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setShowNotificationPermissionPrompt(false);
      }
    } catch (error) {
      console.error('[Notifications] Enable failed:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Could not enable notifications. Check browser settings and try again.',
      );
    }
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => setCurrentScreen('create-profile')}
            onLogin={() => setCurrentScreen('login')}
          />
        );

      case 'create-profile':
        return (
          <CreateProfileScreen
            onBack={() => setCurrentScreen('welcome')}
            onSuccess={handleAuthSuccess}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentScreen('welcome')}
            onSuccess={handleAuthSuccess}
          />
        );

      case 'connect':
        return (
          <ConnectScreen
            userId={user?.userId ?? ''}
            onCreateCouple={() => setCurrentScreen('create-couple')}
            onJoinCouple={() => setCurrentScreen('join-couple')}
            onReconnect={handleReconnect}
          />
        );

      case 'create-couple':
        return (
          <CreateCoupleScreen
            userId={user.userId}
            onBack={() => setCurrentScreen('connect')}
            onSuccess={handlePairingSuccess}
          />
        );

      case 'join-couple':
        return (
          <JoinCoupleScreen
            userId={user.userId}
            onBack={() => setCurrentScreen('connect')}
            onSuccess={handlePairingSuccess}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            partnerName={couple.partner.displayName}
            onContinue={() => setCurrentScreen('home')}
          />
        );

      case 'home':
        return couple ? (
          <>
            <HomeScreen
              userId={user.userId}
              coupleId={couple.coupleId}
              user1Id={couple.user1Id}
              user2Id={couple.user2Id}
              userName={user.displayName}
              partnerName={couple.partner.displayName}
              onUpdatePulse={() => setShowUpdateSheet(true)}
              onViewHistory={() => setCurrentScreen('history')}
              onViewProfile={() => setCurrentScreen('profile')}
              onViewCalendar={() => setCurrentScreen('couple-calendar')}
              onViewDailyChallengeArchive={() => setCurrentScreen('daily-challenge-archive')}
              // onPlaySexyDice={() => setCurrentScreen('sexy-dice')}
            />
            <UpdatePulseSheet
              isOpen={showUpdateSheet}
              onClose={() => setShowUpdateSheet(false)}
              onUpdate={handleUpdatePulse}
              onOpenDoodle={() => setCurrentScreen('doodle')}
            />
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        );

      case 'profile':
        return (
          <ProfileScreen
            userId={user.userId}
            userName={user.displayName}
            partnerName={couple?.partner?.displayName}
            coupleId={couple?.coupleId}
            user1Id={couple?.user1Id}
            user2Id={couple?.user2Id}
            onBack={() => setCurrentScreen('home')}
            onSettings={() => setCurrentScreen('settings')}
            onUnpair={handleUnpair}
            onLogout={handleLogout}
            onDoodleGallery={() => setCurrentScreen('doodle-gallery')}
            onMessageArchive={() => setCurrentScreen('message-archive')}
            onMoodArchive={() => setCurrentScreen('mood-archive')}
            onSharkModeArchive={() => setCurrentScreen('shark-mode-archive')}
            onDailyChallengeArchive={() => setCurrentScreen('daily-challenge-archive')}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            userId={user!.userId}
            userName={user!.displayName}
            pushNotifications={notifications}
            coupleId={couple?.coupleId}
            user1Id={couple?.user1Id}
            user2Id={couple?.user2Id}
            partnerName={couple?.partner?.displayName}
            onBack={() => setCurrentScreen('profile')}
            onNotificationSettings={() => setCurrentScreen('notification-settings')}
          />
        );

      case 'notification-settings':
        return (
          <NotificationSettingsScreen
            userId={user!.userId}
            userName={user!.displayName}
            onBack={() => setCurrentScreen('settings')}
            onNotificationCenter={() => setCurrentScreen('notification-center')}
          />
        );

      case 'notification-center':
        return (
          <NotificationCenterScreen
            userId={user!.userId}
            coupleId={couple?.coupleId}
            onBack={() => setCurrentScreen('notification-settings')}
          />
        );

      case 'history':
        return (
          <>
            <HistoryScreen
              coupleId={couple.coupleId}
              userId={user.userId}
              user1Id={couple.user1Id}
              user2Id={couple.user2Id}
              userName={user.displayName}
              partnerName={couple.partner.displayName}
              onBack={() => setCurrentScreen('home')}
              onDoodleClick={(doodle) => setExpandedDoodle(doodle)}
            />
            {expandedDoodle && (
              <DoodleExpandedView
                doodle={expandedDoodle}
                onClose={() => setExpandedDoodle(null)}
              />
            )}
          </>
        );

      case 'doodle':
        return (
          <DoodleCanvasScreen
            onClose={() => setCurrentScreen('home')}
            onSave={handleDoodleSave}
          />
        );

      case 'doodle-gallery':
        return (
          <>
            <DoodleGalleryScreen
              coupleId={couple.coupleId}
              userId={user.userId}
              user1Id={couple.user1Id}
              user2Id={couple.user2Id}
              userName={user.displayName}
              partnerName={couple.partner.displayName}
              onBack={() => setCurrentScreen('profile')}
              onDoodleClick={(doodle) => setExpandedDoodle(doodle)}
            />
            {expandedDoodle && (
              <DoodleExpandedView
                doodle={expandedDoodle}
                onClose={() => setExpandedDoodle(null)}
              />
            )}
          </>
        );

      case 'message-archive':
        return (
          <MessageArchiveScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            user1Id={couple.user1Id}
            user2Id={couple.user2Id}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'mood-archive':
        return (
          <MoodArchiveScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            user1Id={couple.user1Id}
            user2Id={couple.user2Id}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'shark-mode-archive':
        return (
          <SharkModeArchiveScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'daily-challenge-archive':
        return (
          <DailyChallengeArchiveScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            user1Id={couple.user1Id}
            user2Id={couple.user2Id}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'couple-calendar':
        return couple ? (
          <CoupleCalendarScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            user1Id={couple.user1Id}
            user2Id={couple.user2Id}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            highlightEventId={highlightCalendarEventId}
            onBack={() => {
              setHighlightCalendarEventId(null);
              setCurrentScreen('home');
            }}
            onClearHighlight={() => setHighlightCalendarEventId(null)}
          />
        ) : null;

      case 'tease-or-please':
        return couple ? (
          <TeaseOrPleaseScreen
            coupleId={couple.coupleId}
            userId={user.userId}
            userName={user.displayName}
            partnerName={couple.partner.displayName}
            onBack={() => setCurrentScreen('home')}
          />
        ) : null;

      // case 'sexy-dice':
      //   return couple ? (
      //     <SexyDiceScreen
      //       coupleId={couple.coupleId}
      //       userId={user.userId}
      //       userName={user.displayName}
      //       partnerName={couple.partner.displayName}
      //       onBack={() => setCurrentScreen('home')}
      //     />
      //   ) : null;

      default:
        return <WelcomeScreen onGetStarted={() => setCurrentScreen('create-profile')} onLogin={() => setCurrentScreen('login')} />;
    }
  };

  return (
    <div className="h-full w-full bg-background text-foreground overflow-auto">
      {renderScreen()}

      {/* Notification permission prompt */}
      {showNotificationPermissionPrompt && (
        <NotificationPermissionPrompt
          onEnable={handleEnableNotifications}
          permissionStatus={notificationPermission}
        />
      )}

      {/* Notification onboarding modal */}
      {showNotificationOnboarding && (
        <NotificationOnboarding
          isOpen={showNotificationOnboarding}
          onClose={() => setShowNotificationOnboarding(false)}
          onEnableNotifications={async () => {
            await notifications.enableNotifications();
            setShowNotificationOnboarding(false);
          }}
        />
      )}
    </div>
  );
}