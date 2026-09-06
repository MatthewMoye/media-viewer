const STORAGE_PREFIX = "mv-state:";
const HEARTBEAT_KEY = `${STORAGE_PREFIX}heartbeat`;
const HEARTBEAT_INTERVAL_MS = 0.05 * 60 * 1000;
export const SESSION_TTL_MS = 0.1 * 60 * 1000;

type StoredPayload = {
  savedAt: number;
  value: unknown;
};

let heartbeatStarted = false;

export const startSessionHeartbeat = (): void => {
  if (heartbeatStarted) {
    return;
  }

  heartbeatStarted = true;

  const beat = () => {
    try {
      localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; freshness just won't update.
    }
  };

  beat();
  window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
};

const readHeartbeat = (): number => {
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    return raw === null ? 0 : Number(raw);
  } catch {
    return 0;
  }
};

const isSessionAlive = (): boolean => {
  const heartbeat = readHeartbeat();
  return heartbeat > 0 && Date.now() - heartbeat < SESSION_TTL_MS;
};

const clearExpiredSession = (): void => {
  try {
    localStorage.removeItem(HEARTBEAT_KEY);
    localStorage.removeItem(`${STORAGE_PREFIX}media`);
    localStorage.removeItem(`${STORAGE_PREFIX}comics`);
  } catch {
    // Ignore storage failures; the expired state will continue to be ignored.
  }
};

export const loadSessionState = <T>(slot: string): T | null => {
  if (!isSessionAlive()) {
    clearExpiredSession();
    return null;
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slot}`);

    if (raw === null) {
      return null;
    }

    return (JSON.parse(raw) as StoredPayload).value as T;
  } catch {
    return null;
  }
};

export const saveSessionState = <T>(slot: string, value: T): void => {
  try {
    const payload: StoredPayload = { savedAt: Date.now(), value };
    localStorage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (quota/private mode); state just won't persist.
  }
};
