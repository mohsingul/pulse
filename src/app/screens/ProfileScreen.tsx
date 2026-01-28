import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Copy, Share2, Settings, AlertTriangle, UserX, Image, MessageSquare, Smile } from 'lucide-react';
import { pairingAPI, coupleAPI } from '@/utils/api';
import { storage } from '@/utils/storage';
import { copyToClipboard } from '@/utils/clipboard';

interface ProfileScreenProps {
  userId: string;
  userName: string;
  partnerName?: string;
  coupleId?: string;
  onBack: () => void;
  onSettings: () => void;
  onUnpair: () => void;
  onLogout: () => void;
  onDoodleGallery?: () => void;
  onMessageArchive?: () => void;
  onMoodArchive?: () => void;
}

export function ProfileScreen({
  userId,
  userName,
  partnerName,
  coupleId,
  onBack,
  onSettings,
  onUnpair,
  onLogout,
  onDoodleGallery,
  onMessageArchive,
  onMoodArchive,
}: ProfileScreenProps) {
  const [codeData, setCodeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchCode();
  }, []);

  const fetchCode = async () => {
    try {
      const response = await pairingAPI.getCode(userId);
      setCodeData(response);
    } catch (error) {
      console.error('Error fetching code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewCode = async () => {
    setLoading(true);
    try {
      const response = await pairingAPI.generate(userId);
      setCodeData({
        code: response.code,
        expiresAt: response.expiresAt,
        status: 'active',
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (codeData?.code) {
      const success = await copyToClipboard(codeData.code);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (!codeData?.code) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aimo Pulse - Join my couple',
          text: `Join me on Aimo Pulse! Use code: ${codeData.code}`,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleUnpair = async () => {
    try {
      await coupleAPI.unpair(userId);
      setShowUnpairConfirm(false);
      onUnpair();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    storage.clearUser();
    onLogout();
  };

  const isExpired = codeData && new Date(codeData.expiresAt) < new Date();

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
        <h2 className="text-xl font-semibold">Profile</h2>
        <button
          onClick={onSettings}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
        {/* User Info */}
        <Card className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-[image:var(--pulse-gradient)] flex items-center justify-center text-white text-3xl font-bold">
            {userName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userName}</h2>
            {partnerName && (
              <p className="text-muted-foreground mt-1">
                Connected with {partnerName}
              </p>
            )}
          </div>
          {coupleId && (
            <div className="pt-4 border-t border-border">
              <div className="inline-flex items-center px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                ● Connected
              </div>
            </div>
          )}
        </Card>

        {/* Pairing Code */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Your Pairing Code</h3>
          
          {loading ? (
            <Card className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto" />
            </Card>
          ) : codeData?.code ? (
            <Card className={isExpired ? 'opacity-60' : ''}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-3xl font-bold tracking-wider">
                    {codeData.code}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isExpired
                      ? 'bg-destructive/10 text-destructive'
                      : codeData.status === 'used'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-green-500/10 text-green-600 dark:text-green-400'
                  }`}>
                    {isExpired ? 'Expired' : codeData.status === 'used' ? 'Used' : 'Active'}
                  </div>
                </div>

                {!isExpired && codeData.status === 'active' && (
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      onClick={handleCopy}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8 text-muted-foreground">
              <p>No pairing code generated yet</p>
            </Card>
          )}

          <Button
            variant="gradient"
            className="w-full"
            onClick={handleGenerateNewCode}
            disabled={loading}
          >
            {codeData?.code ? 'Generate New Code' : 'Generate Code'}
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {coupleId && (
            <button
              onClick={() => setShowUnpairConfirm(true)}
              className="w-full px-4 py-3 bg-destructive/10 text-destructive rounded-2xl hover:bg-destructive/20 transition-colors flex items-center justify-center space-x-2"
            >
              <UserX className="w-5 h-5" />
              <span>Unpair from {partnerName}</span>
            </button>
          )}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-4 py-3 bg-accent hover:bg-accent/80 rounded-2xl transition-colors text-muted-foreground"
          >
            Log Out
          </button>
        </div>

        {/* Additional Actions */}
        <div className="space-y-3 pt-4">
          {onDoodleGallery && (
            <button
              onClick={onDoodleGallery}
              className="w-full px-4 py-3 bg-accent hover:bg-accent/80 rounded-2xl transition-colors flex items-center justify-center space-x-2"
            >
              <Image className="w-5 h-5" />
              <span>Doodle Gallery</span>
            </button>
          )}

          {onMessageArchive && (
            <button
              onClick={onMessageArchive}
              className="w-full px-4 py-3 bg-accent hover:bg-accent/80 rounded-2xl transition-colors flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Message Archive</span>
            </button>
          )}

          {onMoodArchive && (
            <button
              onClick={onMoodArchive}
              className="w-full px-4 py-3 bg-accent hover:bg-accent/80 rounded-2xl transition-colors flex items-center justify-center space-x-2"
            >
              <Smile className="w-5 h-5" />
              <span>Mood Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Unpair Confirmation Modal */}
      {showUnpairConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUnpairConfirm(false)}
          />
          <div className="relative bg-background dark:bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Unpair from {partnerName}?</h3>
                <p className="text-sm text-muted-foreground">
                  This will disconnect you from your partner. You'll need to pair again to reconnect.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowUnpairConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnpair}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Unpair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-background dark:bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-accent rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Log Out?</h3>
                <p className="text-sm text-muted-foreground">
                  You can log back in anytime with your username and password.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1"
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}