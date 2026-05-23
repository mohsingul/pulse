/**
 * Password autofill + save for Safari and home-screen PWA.
 * Uses Credential Management API (conditional UI = iOS "Fill Password" bar).
 * Device localStorage is a fallback when the system UI is unavailable.
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

function getPasswordCredentialConstructor():
  | (new (data: PasswordCredentialData) => Credential)
  | undefined {
  return (window as unknown as { PasswordCredential?: new (data: PasswordCredentialData) => Credential })
    .PasswordCredential;
}

/**
 * Shows the native "Fill Password" bar (iOS) when saved Passwords exist for this site.
 * Call on page load and when username/password fields are focused.
 */
export function requestConditionalPasswordAutofill(
  onFilled?: (login: SavedDeviceLogin) => void,
): void {
  if (!('credentials' in navigator) || !navigator.credentials?.get) {
    return;
  }

  navigator.credentials
    .get({
      password: true,
      mediation: 'conditional',
    } as CredentialRequestOptions)
    .then((credential) => {
      const pwd = credential as PasswordCredential | null;
      if (pwd?.id && pwd.password) {
        onFilled?.({ username: pwd.id, password: pwd.password });
      }
    })
    .catch(() => {
      // No saved password or user dismissed
    });
}

/** Prompt iOS / browser to save login in Passwords after successful sign-in. */
export async function storeLoginCredential(username: string, password: string): Promise<void> {
  if (!username || !password) return;

  saveDeviceLogin(username, password);

  const PasswordCredential = getPasswordCredentialConstructor();
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
    console.warn('[Credentials] Password manager store failed:', error);
  }
}

/** Pre-fill from device fallback, then offer conditional system autofill. */
export async function loadSavedLoginCredential(): Promise<SavedDeviceLogin | null> {
  return loadDeviceLogin();
}
