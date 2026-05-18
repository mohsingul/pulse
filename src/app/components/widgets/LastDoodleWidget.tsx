import React from 'react';
import { Card } from '@/app/components/Card';

export function LastDoodleWidget({ doodleUrl, onOpen }: { doodleUrl?: string | null; onOpen?: () => void }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">Last Doodle</p>
      {doodleUrl ? (
        <div className="mt-3">
          <img src={doodleUrl} alt="Last doodle" className="w-full h-32 object-cover rounded-lg" />
          <button onClick={onOpen} className="mt-3 w-full px-4 py-2 bg-[image:var(--pulse-gradient)] text-white rounded-full">View Doodle</button>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">No doodles yet</div>
      )}
    </Card>
  );
}
