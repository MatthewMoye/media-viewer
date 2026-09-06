const readParams = (): URLSearchParams => new URLSearchParams(window.location.search);

export const readUrlSearchParam = (key: string): string | null => {
  const value = readParams().get(key);
  return value !== null && value.trim() !== "" ? value : null;
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
