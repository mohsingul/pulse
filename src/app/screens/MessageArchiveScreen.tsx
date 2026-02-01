import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { historyAPI } from '@/utils/api';
import { format } from 'date-fns';

interface MessageArchiveScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

export function MessageArchiveScreen({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onBack,
}: MessageArchiveScreenProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isUser1 = userId === user1Id;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await historyAPI.get(coupleId);
      const allHistory = response.history || [];

      // Extract all messages from both users using galleries
      const allMessages: any[] = [];

      allHistory.forEach((day: any) => {
        // User1's messages from gallery
        if (day.user1MessageGallery && Array.isArray(day.user1MessageGallery)) {
          day.user1MessageGallery.forEach((messageEntry: any) => {
            allMessages.push({
              message: messageEntry.message,
              mood: day.user1Mood, // Get mood from the day card
              createdBy: user1Id,
              senderName: isUser1 ? 'You' : partnerName,
              isMine: isUser1,
              date: day.date,
              timestamp: messageEntry.timestamp,
            });
          });
        }
        
        // User2's messages from gallery
        if (day.user2MessageGallery && Array.isArray(day.user2MessageGallery)) {
          day.user2MessageGallery.forEach((messageEntry: any) => {
            allMessages.push({
              message: messageEntry.message,
              mood: day.user2Mood, // Get mood from the day card
              createdBy: user2Id,
              senderName: isUser1 ? partnerName : 'You',
              isMine: !isUser1,
              date: day.date,
              timestamp: messageEntry.timestamp,
            });
          });
        }
      });

      // Sort by timestamp descending
      allMessages.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setMessages(allMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'EEEE, MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Group messages by date
  const messagesByDate = messages.reduce((acc: any, message) => {
    const date = formatDate(message.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-border safe-top flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">Message Archive</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto safe-bottom">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">💬</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground">
                Your shared words will live here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(messagesByDate).map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-accent rounded-full">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {messagesByDate[date].map((msg: any, index: number) => (
                    <Card
                      key={index}
                      className={`${
                        msg.isMine
                          ? 'ml-8 bg-gradient-to-r from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 border-[#A83FFF]/20'
                          : 'mr-8 bg-accent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Emoji/Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                            msg.isMine
                              ? 'bg-[image:var(--pulse-gradient)] text-white'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          }`}
                        >
                          {msg.mood || msg.senderName[0]}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">
                              {msg.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}