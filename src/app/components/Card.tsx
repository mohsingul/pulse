import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function Card({ children, className = '', gradient = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-lg ${
        gradient
          ? 'bg-[image:var(--pulse-gradient)] text-white'
          : 'bg-card dark:bg-card'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
