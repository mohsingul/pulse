import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb`;

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

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error(`[API] Request failed for ${endpoint}:`, error);
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. The Supabase Edge Function may not be deployed or network connection is unavailable.');
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