const readParams = (): URLSearchParams => new URLSearchParams(window.location.search);

export const readUrlSearchParam = (key: string): string | null => {
  const value = readParams().get(key);
  return value !== null && value.trim() !== "" ? value : null;
};

export const readUrlNumberParam = (key: string): number | null => {
  const raw = readUrlSearchParam(key);

  if (raw === null) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const readUrlPageParam = (key: string): number => {
  const page = readUrlNumberParam(key);
  return page === null ? 1 : Math.max(1, Math.floor(page));
};

export const writeUrlSearchParams = (updates: Record<string, string | null>): void => {
  const url = new URL(window.location.href);
  let changed = false;

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
      continue;
    }

    if (url.searchParams.get(key) !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState(null, "", url);
  }
};
