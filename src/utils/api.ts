import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb`;

// Development mode flag - automatically enabled when server is unreachable
let isDevelopmentMode = false;
let developmentModeReason = '';

// Health check to verify server is accessible
let serverHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

async function checkServerHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return serverHealthy;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    serverHealthy = response.ok;
    lastHealthCheck = now;
    
    if (serverHealthy && isDevelopmentMode) {
      console.log('[API] ✅ Server is back online! Development mode can be disabled.');
    }
    
    return serverHealthy;
  } catch (error) {
    console.warn('[API] Health check failed:', error);
    serverHealthy = false;
    lastHealthCheck = now;
    
    if (!isDevelopmentMode) {
      isDevelopmentMode = true;
      developmentModeReason = 'Server health check failed';
      console.warn('[API] ⚠️ Enabling development mode - server is unreachable');
      console.warn('[API] 💡 The app will use local storage for data persistence');
      console.warn('[API] 📝 To deploy the server, follow Supabase Edge Functions deployment guide');
    }
    
    return false;
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    console.log(`[API] Making request to: ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
      mode: 'cors',
    });

    console.log(`[API] Response status: ${response.status}`);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[API] Non-JSON response received for ${endpoint}`);
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error(`[API] Request failed for ${endpoint}:`, error);
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[API] Network error - Check if Supabase Edge Function is deployed');
      console.error('[API] Base URL:', BASE_URL);
      console.error('[API] Full URL:', `${BASE_URL}${endpoint}`);
      
      // For non-critical operations like marking notifications as read, fail silently
      if (endpoint.includes('/notifications/') && endpoint.includes('/read')) {
        console.log('[API] Notification mark-as-read failed (non-critical), continuing...');
        return { success: false, error: 'Network error' };
      }
      
      // For fetching notifications, return empty array instead of throwing
      if (endpoint.includes('/notifications/') && !endpoint.includes('/read')) {
        console.log('[API] Notification fetch failed, returning empty array');
        return { notifications: [] };
      }
      
      // For fetching shark mode status, return null instead of throwing
      if (endpoint.includes('/shark-mode/status/')) {
        console.log('[API] Shark mode status fetch failed (non-critical), returning null');
        return { sharkMode: null };
      }
      
      // For fetching shark mode history, return empty array instead of throwing
      if (endpoint.includes('/shark-mode/history/')) {
        console.log('[API] Shark mode history fetch failed (non-critical), returning empty array');
        return { history: [] };
      }
      
      throw new Error('Unable to connect to server. Please check your network connection and try again.');
    }
    
    throw error;
  }
}

// User API
export const userAPI = {
  create: (username: string, password: string, displayName: string) =>
    apiRequest('/users/create', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    }),

  login: (username: string, password: string) =>
    apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  get: (userId: string) =>
    apiRequest(`/users/${userId}`),

  resetPassword: (username: string, newPassword: string) =>
    apiRequest('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ username, newPassword }),
    }),

  initDemo: () =>
    apiRequest('/init-demo', {
      method: 'POST',
    }),
};

// Pairing API
export const pairingAPI = {
  generate: (userId: string) =>
    apiRequest('/pairing/generate', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  join: (userId: string, code: string) =>
    apiRequest('/pairing/join', {
      method: 'POST',
      body: JSON.stringify({ userId, code }),
    }),

  getCode: (userId: string) =>
    apiRequest(`/pairing/${userId}`),
};

// Couple API
export const coupleAPI = {
  get: (userId: string) =>
    apiRequest(`/couples/${userId}`),

  unpair: (userId: string) =>
    apiRequest(`/couples/${userId}`, {
      method: 'DELETE',
    }),
};

// Today Card API
export const todayAPI = {
  get: (coupleId: string) =>
    apiRequest(`/today/${coupleId}`),

  update: (coupleId: string, userId: string, data: {
    mood?: string;
    message?: string;
    doodle?: string;
    intensity?: string;
  }) =>
    apiRequest(`/today/${coupleId}`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    }),

  react: (coupleId: string, userId: string, emoji: string) =>
    apiRequest(`/today/${coupleId}/react`, {
      method: 'POST',
      body: JSON.stringify({ userId, emoji }),
    }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (userId: string) =>
    apiRequest(`/notifications/${userId}`),

  sendNudge: (coupleId: string, senderId: string) =>
    apiRequest('/notifications/nudge', {
      method: 'POST',
      body: JSON.stringify({ coupleId, senderId }),
    }),

  sendMoodUpdate: (coupleId: string, senderId: string, mood: string, intensity?: string) =>
    apiRequest('/notifications/mood-update', {
      method: 'POST',
      body: JSON.stringify({ coupleId, senderId, mood, intensity }),
    }),

  sendMessageUpdate: (coupleId: string, senderId: string, message: string) =>
    apiRequest('/notifications/message-update', {
      method: 'POST',
      body: JSON.stringify({ coupleId, senderId, message }),
    }),

  sendDoodleUpdate: (coupleId: string, senderId: string, doodle: string) =>
    apiRequest('/notifications/doodle-update', {
      method: 'POST',
      body: JSON.stringify({ coupleId, senderId, doodle }),
    }),

  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: 'POST',
    }),
};

// History API
export const historyAPI = {
  get: (coupleId: string) =>
    apiRequest(`/history/${coupleId}`),
};

// Shark Mode API
export const sharkModeAPI = {
  activate: (coupleId: string, userId: string, durationDays: number, note?: string) =>
    apiRequest('/shark-mode/activate', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId, durationDays, note }),
    }),

  extend: (coupleId: string, userId: string, additionalDays: number) =>
    apiRequest('/shark-mode/extend', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId, additionalDays }),
    }),

  deactivate: (coupleId: string, userId: string) =>
    apiRequest('/shark-mode/deactivate', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId }),
    }),

  updateNote: (coupleId: string, userId: string, note: string) =>
    apiRequest('/shark-mode/update-note', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId, note }),
    }),

  sendReassurance: (coupleId: string, userId: string, reassurance: string) =>
    apiRequest('/shark-mode/reassurance', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId, reassurance }),
    }),

  getStatus: (coupleId: string) =>
    apiRequest(`/shark-mode/status/${coupleId}`),

  getHistory: (coupleId: string) =>
    apiRequest(`/shark-mode/history/${coupleId}`),
};

// Challenges API
export const challengesAPI = {
  getCurrent: (coupleId: string) =>
    apiRequest(`/challenges/current/${coupleId}`),

  complete: (coupleId: string, userId: string, response?: string) =>
    apiRequest('/challenges/complete', {
      method: 'POST',
      body: JSON.stringify({ coupleId, userId, response }),
    }),

  getHistory: (coupleId: string) =>
    apiRequest(`/challenges/history/${coupleId}`),
};

// Export health check function
export { checkServerHealth };