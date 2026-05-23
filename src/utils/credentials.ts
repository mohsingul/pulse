/** Store login in the device password manager (iOS Passwords, Chrome, etc.). */
export async function storeLoginCredential(username: string, password: string): Promise<void> {
  if (!username || !password) return;

  const PasswordCredential =
    (window as unknown as { PasswordCredential?: new (data: PasswordCredentialData) => Credential })
      .PasswordCredential;

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
    console.warn('[Credentials] Could not store login:', error);
  }
}

/** Offer saved credentials when the login form loads. */
export async function loadSavedLoginCredential(): Promise<{ username: string; password: string } | null> {
  if (!('credentials' in navigator) || !navigator.credentials?.get) {
    return null;
  }

  try {
    const credential = (await navigator.credentials.get({
      password: true,
      mediation: 'optional',
    })) as PasswordCredential | null;

    if (credential && credential.password && credential.id) {
      return { username: credential.id, password: credential.password };
    }
  } catch {
    // User dismissed or no saved credential
  }

  return null;
}
