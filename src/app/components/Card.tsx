import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function Card({ children, className = '', gradient = false }: CardProps) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-lg ${
        gradient 
          ? 'bg-[image:var(--pulse-gradient)] text-white' 
          : 'bg-card dark:bg-card'
      } ${className}`}
    >
      {children}
    </div>
  );
}
