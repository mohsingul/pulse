import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft, Bell, Heart, MessageCircle, Palette, Sparkles, Trash2, CheckCheck, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from 'date-fns';
import { notificationAPI } from '@/utils/api';

interface NotificationCenterScreenProps {
  userId: string;
  onBack: () => void;
}

interface Notification {
  id: string;
  type: 'nudge' | 'mood-update' | 'message-update' | 'doodle-update' | 'challenge' | 'shark-mode';
  senderName: string;
  timestamp: string;
  read: boolean;
  mood?: string;
  intensity?: string;
  message?: string;
  doodle?: string;
}

export function NotificationCenterScreen({
  userId,
  onBack
}: NotificationCenterScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(userId);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => notificationAPI.markAsRead(id)));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const groupedNotifications = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[image:var(--pulse-gradient)] text-white px-6 py-4 safe-top shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-sm text-white/80">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-2">
          <FilterTab
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={notifications.length}
          />
          <FilterTab
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
            label="Unread"
            count={unreadCount}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-2xl mx-auto">
        {loading ? (
          <LoadingState />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  {formatDateHeader(date)}
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {notifs.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-white text-[#A83FFF]'
          : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-2 ${active ? 'text-[#A83FFF]/60' : 'text-white/50'}`}>
          {count}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-full -z-10"
          transition={{ type: 'spring', duration: 0.5 }}
        />
      )}
    </button>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [dragX, setDragX] = useState(0);

  const getIcon = () => {
    switch (notification.type) {
      case 'nudge':
        return <Bell className="w-5 h-5" />;
      case 'mood-update':
        return <Heart className="w-5 h-5" />;
      case 'message-update':
        return <MessageCircle className="w-5 h-5" />;
      case 'doodle-update':
        return <Palette className="w-5 h-5" />;
      case 'challenge':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getContent = () => {
    switch (notification.type) {
      case 'nudge':
        return `${notification.senderName} nudged you! 💗`;
      case 'mood-update':
        return `${notification.senderName} updated their mood ${notification.mood}`;
      case 'message-update':
        return notification.message || `${notification.senderName} sent a message`;
      case 'doodle-update':
        return `${notification.senderName} created a doodle 🎨`;
      default:
        return `New update from ${notification.senderName}`;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      drag="x"
      dragConstraints={{ left: -80, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x < -50) {
          onDelete(notification.id);
        }
        setDragX(0);
      }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      className="relative"
    >
      {/* Delete action (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: dragX < -20 ? 1 : 0,
            scale: dragX < -20 ? 1 : 0.8,
          }}
          className="bg-red-500 p-3 rounded-full"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Notification card */}
      <Card
        onClick={() => {
          if (!notification.read) {
            onMarkAsRead(notification.id);
          }
        }}
        className={`p-4 cursor-pointer transition-all ${
          notification.read
            ? 'bg-card/30 backdrop-blur-sm'
            : 'bg-gradient-to-r from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 border-l-4 border-[#A83FFF] shadow-md'
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notification.read
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'bg-gradient-to-br from-[#FB3094] via-[#A83FFF] to-[#2571FF] text-white'
          }`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm mb-1 ${
              notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'
            }`}>
              {getContent()}
            </p>

            {/* Doodle preview */}
            {notification.type === 'doodle-update' && notification.doodle && (
              <div className="mt-2 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <img
                  src={notification.doodle}
                  alt="Doodle preview"
                  className="w-full h-24 object-contain"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-[#A83FFF] flex-shrink-0 mt-2" />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-card/30 backdrop-blur-sm animate-pulse"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: 'all' | 'unread' }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FB3094]/20 via-[#A83FFF]/20 to-[#2571FF]/20 flex items-center justify-center">
        <Inbox className="w-12 h-12 text-[#A83FFF]" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {filter === 'unread'
          ? 'You\'ve read all your notifications. Check back later for updates from your partner.'
          : 'When your partner sends you updates, they\'ll appear here.'}
      </p>
    </div>
  );
}

// Helper functions
function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    const date = startOfDay(new Date(notification.timestamp)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
  });

  return groups;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}
