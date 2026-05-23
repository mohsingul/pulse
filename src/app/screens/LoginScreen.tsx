import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/app/components/Input';
import { Button } from '@/app/components/Button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { userAPI } from '@/utils/api';
import { storage } from '@/utils/storage';
import { requestConditionalPasswordAutofill, storeLoginCredential } from '@/utils/credentials';
interface LoginScreenProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export function LoginScreen({ onBack, onSuccess }: LoginScreenProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const applyLoginToFields = (username: string, password: string) => {
    if (usernameRef.current) usernameRef.current.value = username;
    if (passwordRef.current) passwordRef.current.value = password;
  };

  const enableAutofillOnField = (el: HTMLInputElement | null) => {
    if (!el) return;
    el.removeAttribute('readonly');
  };

  useEffect(() => {
    const unlockTimer = window.setTimeout(() => {
      enableAutofillOnField(usernameRef.current);
      enableAutofillOnField(passwordRef.current);
    }, 400);

    return () => window.clearTimeout(unlockTimer);
  }, []);

  const handleAutofillFocus = () => {
    requestConditionalPasswordAutofill(applyLoginToFields);
  };

  const getLoginErrorMessage = (message: string) => {
    if (message.includes('Unable to connect to server')) {
      return 'Unable to reach the backend. Check your internet connection or verify the Supabase function deployment.';
    }
    if (message.includes('Invalid credentials')) {
      return 'Invalid username or password. Please try again.';
    }
    if (message.includes('Failed to log in')) {
      return 'Login failed due to a server error. Please try again shortly.';
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const username = usernameRef.current?.value?.trim() ?? '';
    const password = passwordRef.current?.value ?? '';

    if (!username || !password) {
      setErrors({ general: 'Please enter username and password' });
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.login(username, password);
      storage.setUser(response.user);

      await storeLoginCredential(username, password);

      // Brief pause so iOS can show "Save Password?" before the screen changes
      await new Promise((resolve) => setTimeout(resolve, 350));

      onSuccess(response.user);
    } catch (error: any) {
      setErrors({ general: getLoginErrorMessage(error.message || 'An unknown error occurred') });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    storage.clearAllLocalData();
    setShowResetConfirm(false);
    if (usernameRef.current) usernameRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
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
    <div className="h-full w-full flex flex-col px-6 py-8 safe-top safe-bottom overflow-y-auto">
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Log in to your profile</p>
          </div>

          <form
            ref={formRef}
            id="aimo-login-form"
            onSubmit={handleSubmit}
            method="post"
            action="/"
            autoComplete="on"
            className="space-y-5"
          >
            <Input
              ref={usernameRef}
              label="Username"
              name="username"
              type="text"
              inputMode="text"
              placeholder="Enter your username"
              defaultValue=""
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              readOnly
              onFocus={(e) => {
                enableAutofillOnField(e.currentTarget);
                handleAutofillFocus();
              }}
              required
            />

            <Input
              ref={passwordRef}
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              defaultValue=""
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              readOnly
              onFocus={(e) => {
                enableAutofillOnField(e.currentTarget);
                handleAutofillFocus();
              }}
              required
            />

            {errors.general && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tap username or password to use iPhone Passwords (key above the keyboard → Fill
              Password). Passwords are not filled automatically.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#A83FFF] hover:text-[#FB3094] transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <div className="pt-8 border-t border-border space-y-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            >
              Reset local profile
            </button>
          </div>
        </div>
      </div>

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
                  This will clear all local data. You&apos;ll need to create a new profile.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)} className="flex-1">
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
              </div>
            </div>
            <form
              onSubmit={handleResetPassword}
              method="post"
              action="/"
              autoComplete="on"
              className="space-y-5"
            >
              <Input
                label="Username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />

              <Input
                label="New Password"
                name="new-password"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                passwordRules="minlength: 6;"
                required
              />

              <Input
                label="Confirm Password"
                name="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                required
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
              <Button variant="secondary" onClick={() => setShowForgotPassword(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
