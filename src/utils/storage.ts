// Local storage utilities for user data

interface UserData {
  userId: string;
  username: string;
  displayName: string;
}

const USER_KEY = 'pulse_user';
const SESSION_ACTIVE_KEY = 'pulse_session_active';

export const storage = {
  /**
   * Logged-in user for the current app session.
   * Cleared on app close (pagehide) or explicit logout — not on home-screen resume.
   */
  getUser: (): UserData | null => {
    if (typeof window === 'undefined') return null;
    if (sessionStorage.getItem(SESSION_ACTIVE_KEY) !== 'true') return null;
    const user = sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: UserData) => {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** End login session (logout or app fully closed). */
  clearSession: () => {
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
  },

  clearUser: () => {
    storage.clearSession();
  },

  clearAllLocalData: () => {
    storage.clearSession();
    localStorage.removeItem('pulse_theme');
    localStorage.removeItem('pulse_notifications');
    localStorage.removeItem('pulse_notification_prompt_state');
    localStorage.removeItem('pulse_device_login');
  },

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem('pulse_theme') as 'light' | 'dark') || 'light';
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('pulse_theme', theme);
  },

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

  getNotificationPromptState: () => {
    const stored = localStorage.getItem('pulse_notification_prompt_state');
    return stored ? JSON.parse(stored) : { lastPromptTime: 0, promptCount: 0 };
  },

  setNotificationPromptState: (state: any) => {
    localStorage.setItem('pulse_notification_prompt_state', JSON.stringify(state));
  },
};
