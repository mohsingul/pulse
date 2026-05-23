import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, name, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? (name ? `field-${name}` : generatedId);

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        className={`w-full px-4 py-3 rounded-2xl bg-input-background dark:bg-input border-2 border-transparent focus:border-[#A83FFF] focus:outline-none transition-all ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
