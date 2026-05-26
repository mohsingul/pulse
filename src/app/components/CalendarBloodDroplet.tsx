/** Small red blood droplet — matches sun/moon icon size on the calendar grid. */
export function CalendarBloodDroplet({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`inline-block shrink-0 ${className}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#DC2626"
        d="M12 3.5c-2.8 4.2-6.5 6.8-6.5 11a6.5 6.5 0 0 0 13 0c0-4.2-3.7-6.8-6.5-11z"
      />
      <path
        fill="#B91C1C"
        opacity="0.35"
        d="M12 8c-1.2 1.8-2.8 2.9-2.8 4.8a2.8 2.8 0 0 0 5.6 0C14.8 10.9 13.2 9.8 12 8z"
      />
    </svg>
  );
}
