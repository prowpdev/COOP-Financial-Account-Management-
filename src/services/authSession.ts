import { AuthSession } from '../types';

const SESSION_STORAGE_KEY = 'coop_auth_session';
const SESSION_KEY_STORAGE_KEY = 'coop_auth_session_key';
const ENCRYPTION_VERSION = 1;

interface EncryptedSession {
  version: number;
  iv: string;
  ciphertext: string;
}

let cachedSession: AuthSession | null | undefined;
let loadingSession: Promise<AuthSession | null> | undefined;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = window.atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const getEncryptionKey = async (create: boolean): Promise<CryptoKey | null> => {
  const storedKey = window.sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
  if (storedKey) {
    return window.crypto.subtle.importKey('raw', fromBase64(storedKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  if (!create) return null;

  const keyBytes = window.crypto.getRandomValues(new Uint8Array(32));
  window.sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, toBase64(keyBytes));
  return window.crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const key = await getEncryptionKey(true);
  if (!key) throw new Error('Unable to initialize session encryption.');

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  const encryptedSession: EncryptedSession = {
    version: ENCRYPTION_VERSION,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext))
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(encryptedSession));
  cachedSession = session;
}

async function readStoredAuthSession(): Promise<AuthSession | null> {
  const storedValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!storedValue) {
    cachedSession = null;
    return null;
  }

  const parsed: unknown = JSON.parse(storedValue);
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'version' in parsed &&
    'iv' in parsed &&
    'ciphertext' in parsed
  ) {
    const encrypted = parsed as EncryptedSession;
    if (encrypted.version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encrypted session version: ${encrypted.version}`);
    }

    const key = await getEncryptionKey(false);
    if (!key) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      cachedSession = null;
      return null;
    }

    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(encrypted.iv) },
      key,
      fromBase64(encrypted.ciphertext)
    );
    cachedSession = JSON.parse(new TextDecoder().decode(plaintext)) as AuthSession;
    return cachedSession;
  }

  const legacySession = parsed as AuthSession;
  if (
    !legacySession ||
    (legacySession.type !== 'staff' && legacySession.type !== 'member') ||
    typeof legacySession.token !== 'string'
  ) {
    throw new Error('Stored authentication session is invalid.');
  }

  await saveAuthSession(legacySession);
  return legacySession;
}

export function loadAuthSession(): Promise<AuthSession | null> {
  if (cachedSession !== undefined) return Promise.resolve(cachedSession);
  if (!loadingSession) {
    loadingSession = readStoredAuthSession().finally(() => {
      loadingSession = undefined;
    });
  }
  return loadingSession;
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
  cachedSession = null;
}
