// Local storage utilities for user data

interface UserData {
  userId: string;
  username: string;
  displayName: string;
}

const USER_KEY = 'pulse_user';
const BOOT_KEY = 'pulse_current_boot';
const USER_BOOT_KEY = 'pulse_user_boot';

/** New id every time the app bundle loads (home-screen open or browser refresh). */
if (typeof window !== 'undefined') {
  sessionStorage.setItem(
    BOOT_KEY,
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  );
}

function currentBootId(): string {
  return sessionStorage.getItem(BOOT_KEY) ?? '';
}

export const storage = {
  /**
   * Logged-in user for this app launch only.
   * Cleared on close (pagehide) or when the app is opened again (new boot id).
   */
  getUser: (): UserData | null => {
    if (typeof window === 'undefined') return null;
    if (sessionStorage.getItem(USER_BOOT_KEY) !== currentBootId()) return null;
    const user = sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: UserData) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(USER_BOOT_KEY, currentBootId());
  },

  /** End login session (logout or app closed). Keeps theme & saved password on device. */
  clearSession: () => {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_BOOT_KEY);
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
