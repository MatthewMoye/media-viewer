type ComicFilterOptions = {
  search?: unknown;
  author?: unknown;
  tag?: unknown;
};

function buildComicFilters(options: ComicFilterOptions = {}) {
  const conditions = [];
  const params = [];

  const search = typeof options.search === "string" ? options.search.trim() : "";
  if (search) {
    const searchTerms = search.split(/\s+/);
    for (const searchTerm of searchTerms) {
      conditions.push("COALESCE(title, filename) LIKE ?");
      params.push(`%${searchTerm}%`);
    }
  }

  if (typeof options.author === "string" && options.author.trim() !== "") {
    if (options.author === "Unknown") {
      conditions.push("(writer IS NULL OR TRIM(writer) = '')");
    } else {
      conditions.push("writer = ?");
      params.push(options.author.trim());
    }
  }

  if (typeof options.tag === "string" && options.tag.trim() !== "") {
    conditions.push(
      "((tags IS NOT NULL AND tags LIKE ?) OR (tags IS NULL AND genre IS NOT NULL AND genre LIKE ?))",
    );
    params.push(`%${options.tag.trim()}%`, `%${options.tag.trim()}%`);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export { buildComicFilters };
