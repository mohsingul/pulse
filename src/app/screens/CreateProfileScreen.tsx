import React, { useState } from 'react';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { ArrowLeft } from 'lucide-react';
import { userAPI } from '@/utils/api';
import { storage } from '@/utils/storage';

interface CreateProfileScreenProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export function CreateProfileScreen({ onBack, onSuccess }: CreateProfileScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: any = {};
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.create(username.trim(), password, displayName.trim());
      storage.setUser(response.user);
      onSuccess(response.user);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
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
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Create Your Profile</h1>
            <p className="text-muted-foreground">
              This stays on your phone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Display Name"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              autoComplete="name"
            />

            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
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
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}