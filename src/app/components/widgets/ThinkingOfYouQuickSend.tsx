import React, { useState } from 'react';
import { Card } from '@/app/components/Card';
import { notificationAPI, todayAPI } from '@/utils/api';

export function ThinkingOfYouQuickSend({ coupleId, userId }: { coupleId: string; userId: string }) {
  const [sending, setSending] = useState(false);
  const quickMessages = ['Thinking of you ❤️', 'You are on my mind ✨', 'Miss you 💗', 'Can’t wait to see you!'];

  const sendQuick = async (message: string) => {
    setSending(true);
    try {
      // Update today's message and send a notification
      await todayAPI.update(coupleId, userId, { message });
      await notificationAPI.sendMessageUpdate(coupleId, userId, message);
      alert('Sent!');
    } catch (error: any) {
      console.error('Quick send failed:', error);
      alert(error?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">Thinking of you</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {quickMessages.map((m) => (
          <button key={m} onClick={() => sendQuick(m)} className="px-3 py-2 rounded-lg bg-white/5 text-left" disabled={sending}>
            {m}
          </button>
        ))}
      </div>
    </Card>
  );
}
