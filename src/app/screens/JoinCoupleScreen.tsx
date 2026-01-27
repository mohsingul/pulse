import React, { useState } from 'react';
import { Button } from '@/app/components/Button';
import { ArrowLeft } from 'lucide-react';
import { pairingAPI } from '@/utils/api';

interface JoinCoupleScreenProps {
  userId: string;
  onBack: () => void;
  onSuccess: (couple: any) => void;
}

export function JoinCoupleScreen({ userId, onBack, onSuccess }: JoinCoupleScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value && newCode.every(d => d)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const codeString = fullCode || code.join('');
    
    if (codeString.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await pairingAPI.join(userId, codeString);
      onSuccess(response);
    } catch (error: any) {
      setError(error.message);
      setCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('code-0');
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
          disabled={loading}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="w-full space-y-8">
          {/* Icon */}
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-3xl font-bold mb-2">Enter Pairing Code</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code from your partner
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center space-x-3">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${
                  error 
                    ? 'border-destructive bg-destructive/10' 
                    : 'border-border focus:border-[#A83FFF] bg-input-background dark:bg-input'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-2xl text-center">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => handleSubmit()}
            disabled={loading || code.some(d => !d)}
          >
            {loading ? 'Joining...' : 'Join'}
          </Button>

          {/* Helper Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>The code expires in 15 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
