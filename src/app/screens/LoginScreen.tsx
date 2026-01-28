import React, { useState } from 'react';
import { Input } from '@/app/components/Input';
import { Button } from '@/app/components/Button';
import { GradientBlob } from '@/app/components/GradientBlob';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { userAPI } from '@/utils/api';
import { storage } from '@/utils/storage';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export function LoginScreen({ onBack, onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadDebugInfo = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb/debug/users`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setDebugInfo(data);
      console.log('[Debug Info]', data);
    } catch (error) {
      console.error('[Debug Info] Error:', error);
    }
  };

  const createDemoUser = async () => {
    try {
      const response = await userAPI.initDemo();
      console.log('[Create Demo] Response:', response);
      alert(`Demo users created! Total users: ${response.totalUsers}\nUsernames: ${response.usernames.join(', ')}`);
      loadDebugInfo();
    } catch (error: any) {
      console.error('[Create Demo] Error:', error);
      alert('Error creating demo users: ' + (error.message || 'Unknown error'));
    }
  };

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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setResetErrors({});
    setResetSuccess(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrors({});

    // Validation
    if (!resetUsername.trim()) {
      setResetErrors({ username: 'Username is required' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setResetLoading(true);
    try {
      await userAPI.resetPassword(resetUsername.trim(), newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
      }, 2000);
    } catch (error: any) {
      setResetErrors({ general: error.message || 'Failed to reset password' });
    } finally {
      setResetLoading(false);
    }
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

            {/* Remember Me */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-border text-[#A83FFF] focus:ring-[#A83FFF] focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground">
                Remember me on this device
              </span>
            </label>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#A83FFF] hover:text-[#FB3094] transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          {/* Reset Profile */}
          <div className="pt-8 border-t border-border space-y-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            >
              Reset local profile
            </button>
            
            {/* Debug: Create Demo Users Button */}
            <div>
              <button
                onClick={createDemoUser}
                className="text-[#A83FFF] hover:text-[#FB3094] transition-colors text-sm font-medium"
              >
                🔧 Create Demo Users (Testing)
              </button>
            </div>
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForgotPassword(false)}
          />
          <div className="relative bg-background dark:bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Forgot Password?</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your username and new password to reset.
                </p>
                <p className="text-xs text-muted-foreground mt-2 opacity-75">
                  Note: You must have an existing account to reset your password.
                </p>
              </div>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <Input
                label="Username"
                placeholder="Enter your username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                autoComplete="username"
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {resetErrors.username && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                  <p className="text-sm text-destructive">{resetErrors.username}</p>
                </div>
              )}

              {resetErrors.password && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                  <p className="text-sm text-destructive">{resetErrors.password}</p>
                </div>
              )}

              {resetErrors.confirm && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                  <p className="text-sm text-destructive">{resetErrors.confirm}</p>
                </div>
              )}

              {resetErrors.general && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                  <p className="text-sm text-destructive">{resetErrors.general}</p>
                </div>
              )}

              {resetSuccess && (
                <div className="p-4 bg-success/10 border border-success rounded-2xl">
                  <p className="text-sm text-success">Password reset successfully!</p>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full mt-8"
                disabled={resetLoading}
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
            <div className="flex space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}