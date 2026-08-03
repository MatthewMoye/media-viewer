function buildMediaFilters(options = {}) {
  const conditions = ["type IN ('image', 'video')"];
  const params = [];

  const search = typeof options.search === "string" ? options.search.trim() : "";
  if (search) {
    conditions.push("filename LIKE ?");
    params.push(`%${search}%`);
  }

  if (options.type === "image" || options.type === "video") {
    conditions.push("type = ?");
    params.push(options.type);
  }

  if (
    typeof options.includeFolder === "string" &&
    options.includeFolder.trim() !== "" &&
    options.includeFolder !== "all"
  ) {
    conditions.push("parent_folder = ?");
    params.push(options.includeFolder.trim());
  }

  const excludedFolders = Array.isArray(options.excludeFolders)
    ? options.excludeFolders.filter(
        (folder) => typeof folder === "string" && folder.trim() !== "",
      )
    : [];

  if (excludedFolders.length > 0) {
    const placeholders = excludedFolders.map(() => "?").join(", ");
    conditions.push(`parent_folder NOT IN (${placeholders})`);
    params.push(...excludedFolders);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

module.exports = {
  buildMediaFilters,
};
