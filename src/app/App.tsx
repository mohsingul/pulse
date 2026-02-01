import React, { useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { coupleAPI, todayAPI, notificationAPI, userAPI } from '@/utils/api';
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

// Components
import { UpdatePulseSheet } from '@/app/components/UpdatePulseSheet';
import { DoodleExpandedView } from '@/app/components/DoodleExpandedView';

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
  | 'history'
  | 'doodle'
  | 'doodle-gallery'
  | 'message-archive'
  | 'mood-archive';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [user, setUser] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [expandedDoodle, setExpandedDoodle] = useState<any>(null);

  useEffect(() => {
    // Initialize theme
    const savedTheme = storage.getTheme();
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Test backend connection
    testBackendConnection();

    // Check for existing user
    const savedUser = storage.getUser();
    if (savedUser) {
      setUser(savedUser);
      // Check for existing couple
      checkCouple(savedUser.userId);
    }
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      console.log('[Backend Health Check]', data);
      
      // Initialize demo users for testing
      try {
        console.log('[Demo Data] Initializing demo users...');
        const demoResponse = await userAPI.initDemo();
        console.log('[Demo Data] Response:', demoResponse);
        
        if (demoResponse.created && demoResponse.created.length > 0) {
          console.log('✅ Demo users created successfully!');
          console.log(`📊 Total users in database: ${demoResponse.totalUsers}`);
          console.log(`📝 Usernames available: ${demoResponse.usernames.join(', ')}`);
          console.log('');
          console.log('🔑 You can now test password reset with:');
          console.log('   Username: demo');
          console.log('   Password: password123');
        } else {
          console.log('ℹ️ Demo users already exist');
          console.log(`📊 Total users in database: ${demoResponse.totalUsers}`);
          console.log(`📝 Usernames available: ${demoResponse.usernames.join(', ')}`);
        }
      } catch (demoError: any) {
        console.log('[Demo Data] Error:', demoError.message || demoError);
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
    setUser(userData);
    checkCouple(userData.userId);
  };

  const handlePairingSuccess = (coupleData: any) => {
    setCouple(coupleData);
    setCurrentScreen('success');
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
    setUser(null);
    setCouple(null);
    setCurrentScreen('welcome');
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
            onCreateCouple={() => setCurrentScreen('create-couple')}
            onJoinCouple={() => setCurrentScreen('join-couple')}
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
            onBack={() => setCurrentScreen('home')}
            onSettings={() => setCurrentScreen('settings')}
            onUnpair={handleUnpair}
            onLogout={handleLogout}
            onDoodleGallery={() => setCurrentScreen('doodle-gallery')}
            onMessageArchive={() => setCurrentScreen('message-archive')}
            onMoodArchive={() => setCurrentScreen('mood-archive')}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            userId={user!.userId}
            onBack={() => setCurrentScreen('profile')}
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

      default:
        return <WelcomeScreen onGetStarted={() => setCurrentScreen('create-profile')} onLogin={() => setCurrentScreen('login')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {renderScreen()}
    </div>
  );
}