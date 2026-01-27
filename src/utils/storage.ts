// Local storage utilities for user data

interface UserData {
  userId: string;
  username: string;
  displayName: string;
}

export const storage = {
  // User
  getUser: (): UserData | null => {
    const user = localStorage.getItem('pulse_user');
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: UserData) => {
    localStorage.setItem('pulse_user', JSON.stringify(user));
  },

  clearUser: () => {
    localStorage.removeItem('pulse_user');
    localStorage.removeItem('pulse_theme');
    localStorage.removeItem('pulse_notifications');
  },

  // Theme
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem('pulse_theme') as 'light' | 'dark') || 'light';
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('pulse_theme', theme);
  },

  // Notifications
  getNotifications: () => {
    const defaults = {
      morning: { enabled: true, time: '09:00' },
      midday: { enabled: true, time: '13:00' },
      evening: { enabled: true, time: '19:00' },
    };
    const stored = localStorage.getItem('pulse_notifications');
    return stored ? JSON.parse(stored) : defaults;
  },

  setNotifications: (notifications: any) => {
    localStorage.setItem('pulse_notifications', JSON.stringify(notifications));
  },
};
