const PENDING_CALENDAR_EVENT_KEY = 'pulse_pending_calendar_event';

export type AppDeepLink = {
  screen?: string;
  eventId?: string;
  coupleId?: string;
};

export function parseAppDeepLink(search?: string): AppDeepLink | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(search ?? window.location.search);
  const screen = params.get('screen') ?? undefined;
  const eventId = params.get('eventId') ?? undefined;
  const coupleId = params.get('coupleId') ?? undefined;

  if (!screen && !eventId) return null;

  return { screen, eventId, coupleId };
}

export function savePendingCalendarEvent(eventId: string) {
  localStorage.setItem(PENDING_CALENDAR_EVENT_KEY, eventId);
}

export function consumePendingCalendarEvent(): string | null {
  const id = localStorage.getItem(PENDING_CALENDAR_EVENT_KEY);
  if (id) {
    localStorage.removeItem(PENDING_CALENDAR_EVENT_KEY);
  }
  return id;
}

export function clearAppUrlParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('screen');
  url.searchParams.delete('eventId');
  url.searchParams.delete('coupleId');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
