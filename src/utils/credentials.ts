/**
 * Saved login for home-screen PWA (iOS Passwords API is unreliable in standalone mode).
 * Stored on device only; cleared via "Reset local profile" in login settings.
 */
const DEVICE_LOGIN_KEY = 'pulse_device_login';

export type SavedDeviceLogin = {
  username: string;
  password: string;
};

export function saveDeviceLogin(username: string, password: string): void {
  if (!username || !password) return;
  try {
    localStorage.setItem(
      DEVICE_LOGIN_KEY,
      JSON.stringify({ username, password } satisfies SavedDeviceLogin),
    );
  } catch (error) {
    console.warn('[Credentials] Could not save device login:', error);
  }
}

export function loadDeviceLogin(): SavedDeviceLogin | null {
  try {
    const raw = localStorage.getItem(DEVICE_LOGIN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedDeviceLogin;
    if (data?.username && data?.password) {
      return { username: data.username, password: data.password };
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

export function clearDeviceLogin(): void {
  localStorage.removeItem(DEVICE_LOGIN_KEY);
}

/** Store login — device storage for PWA + Credential API where supported. */
export async function storeLoginCredential(
  username: string,
  password: string,
  options?: { saveOnDevice?: boolean },
): Promise<void> {
  if (!username || !password) return;

  if (options?.saveOnDevice !== false) {
    saveDeviceLogin(username, password);
  }

  const PasswordCredential = (
    window as unknown as { PasswordCredential?: new (data: PasswordCredentialData) => Credential }
  ).PasswordCredential;

  if (!('credentials' in navigator) || !PasswordCredential) {
    return;
  }

  try {
    const credential = new PasswordCredential({
      id: username,
      password,
      name: username,
    });
    await navigator.credentials.store(credential);
  } catch (error) {
    console.warn('[Credentials] Password manager API store failed:', error);
  }
}

/** Load saved login — device storage first (works in home-screen PWA). */
export async function loadSavedLoginCredential(): Promise<SavedDeviceLogin | null> {
  const device = loadDeviceLogin();
  if (device) return device;

  if (!('credentials' in navigator) || !navigator.credentials?.get) {
    return null;
  }

  try {
    const credential = (await navigator.credentials.get({
      password: true,
      mediation: 'optional',
    })) as PasswordCredential | null;

    if (credential?.password && credential.id) {
      return { username: credential.id, password: credential.password };
    }
  } catch {
    // User dismissed or unavailable
  }

  return null;
}
