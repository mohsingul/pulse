import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Copy, Share2, Clock } from 'lucide-react';
import { pairingAPI, coupleAPI } from '@/utils/api';
import { copyToClipboard } from '@/utils/clipboard';

interface CreateCoupleScreenProps {
  userId: string;
  onBack: () => void;
  onSuccess: (couple: any) => void;
}

export function CreateCoupleScreen({ userId, onBack, onSuccess }: CreateCoupleScreenProps) {
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Poll for connection
  useEffect(() => {
    if (!code || checking) return;

    const interval = setInterval(async () => {
      try {
        const response = await coupleAPI.get(userId);
        if (response.coupleId) {
          clearInterval(interval);
          onSuccess(response);
        }
      } catch (error) {
        // Continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [code, userId]);

  const generateCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pairingAPI.generate(userId);
      setCode(response.code);
      setExpiresAt(response.expiresAt);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aimo Pulse - Join my couple',
          text: `Join me on Aimo Pulse! Use code: ${code}`,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="h-full w-full flex flex-col px-6 py-8 safe-top safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {loading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Generating code...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={generateCode}>Try Again</Button>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Code Display */}
            <Card gradient className="text-center space-y-4">
              <div className="text-6xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold">Your Pairing Code</h2>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl py-6 px-4">
                <div className="text-6xl font-bold tracking-widest font-mono">
                  {code}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {timeRemaining === 'Expired' ? 'Expired' : `Expires in ${timeRemaining}`}
                </span>
              </div>
            </Card>

            {/* Info */}
            <div className="bg-accent/50 rounded-2xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your code is saved in Profile. Share it with your partner to connect.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </Button>
              </div>

              <div className="text-center pt-4">
                <div className="inline-flex items-center space-x-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-[#A83FFF] rounded-full animate-pulse" />
                  <span className="text-sm">Waiting for your partner to join...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}