import React from 'react';
import { Card } from '@/app/components/Card';
import { X, Bell, Palette } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onDismiss: (id: string) => void;
}

export function NotificationPanel({ 
  isOpen, 
  onClose, 
  notifications,
  onDismiss 
}: NotificationPanelProps) {
  if (!isOpen) return null;

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getFullTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background dark:bg-card z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-[image:var(--pulse-gradient)] text-white">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-sm text-white/80">{notifications.length} total</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-5rem)] overflow-y-auto px-6 py-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-4 transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-[#A83FFF] bg-accent/30' : ''
                }`}
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    {notification.type === 'nudge' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-[#FB3094]" />
                          <p className="font-semibold">{notification.senderName} nudged you! 💗</p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{getTimeAgo(notification.timestamp)}</p>
                          <p className="text-[10px]">{getFullTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    ) : notification.type === 'mood-update' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="text-4xl">{notification.mood}</div>
                          <div className="flex-1">
                            <p className="font-semibold">{notification.senderName} updated their mood</p>
                            {notification.intensity && (
                              <p className="text-sm text-muted-foreground">
                                Intensity: {notification.intensity}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{getTimeAgo(notification.timestamp)}</p>
                          <p className="text-[10px]">{getFullTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    ) : notification.type === 'message-update' ? (
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <p className="font-semibold">{notification.senderName} sent a message 💬</p>
                          <div className="bg-accent/50 rounded-lg p-3">
                            <p className="text-sm">{notification.message}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{getTimeAgo(notification.timestamp)}</p>
                          <p className="text-[10px]">{getFullTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    ) : notification.type === 'doodle-update' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Palette className="w-5 h-5 text-[#2571FF]" />
                          <div className="flex-1">
                            <p className="font-semibold">{notification.senderName} created a doodle 🎨</p>
                          </div>
                        </div>
                        {notification.doodle && (
                          <div className="mt-2 rounded-lg overflow-hidden bg-white">
                            <img 
                              src={notification.doodle} 
                              alt="Doodle preview" 
                              className="w-full h-32 object-contain"
                            />
                          </div>
                        )}
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{getTimeAgo(notification.timestamp)}</p>
                          <p className="text-[10px]">{getFullTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  
                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1 hover:bg-accent rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}