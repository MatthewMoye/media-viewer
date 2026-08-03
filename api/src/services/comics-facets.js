function parseTagList(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      const colonIndex = trimmed.indexOf(":");
      return colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;
    })
    .filter(Boolean);
}

function buildComicTagFacets(rows) {
  const counts = new Map();

  for (const row of rows) {
    const source = row.tags || row.genre || "";
    const tags = parseTagList(source);

    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

module.exports = {
  buildComicTagFacets,
};
