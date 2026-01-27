import React from 'react';

export function GradientBlob() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--pulse-pink)_0%,_transparent_50%)] opacity-20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--pulse-blue)_0%,_transparent_50%)] opacity-20 blur-3xl animate-pulse-slow animation-delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--pulse-purple)_0%,_transparent_50%)] opacity-15 blur-3xl animate-pulse-slow animation-delay-2000" />
    </div>
  );
}
