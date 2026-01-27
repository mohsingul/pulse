import React, { useState } from 'react';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { userAPI } from '@/utils/api';
import { storage } from '@/utils/storage';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export function LoginScreen({ onBack, onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!username.trim() || !password) {
      setErrors({ general: 'Please enter username and password' });
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.login(username.trim(), password);
      storage.setUser(response.user);
      onSuccess(response.user);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    storage.clearUser();
    setShowResetConfirm(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
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
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Log in to your profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {errors.general && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-8"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          {/* Reset Profile */}
          <div className="pt-8 border-t border-border">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            >
              Reset local profile
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-background dark:bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Reset Profile?</h3>
                <p className="text-sm text-muted-foreground">
                  This will clear all local data. You'll need to create a new profile.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
