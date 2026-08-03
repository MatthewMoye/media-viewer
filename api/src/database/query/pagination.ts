function normalizePage(page) {
  const parsed = Number.parseInt(String(page ?? "1"), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(pageSize) {
  const parsed = Number.parseInt(String(pageSize ?? "30"), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 30;
  }

  return Math.min(parsed, 100);
}

function normalizeRandomSeed(randomSeed) {
  if (randomSeed === undefined || randomSeed === null || randomSeed === "") {
    return null;
  }

  const parsed = Number.parseInt(String(randomSeed), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildOrderBySql(randomSeed) {
  if (randomSeed === null) {
    return "ORDER BY modified DESC, id DESC";
  }

  return "ORDER BY (((id * 1103515245 + ?) % 2147483647 + 2147483647) % 2147483647) ASC, modified DESC, id DESC";
}

function buildPaginationResult(totalCount, page, pageSize) {
  return {
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export {
  normalizePage,
  normalizePageSize,
  normalizeRandomSeed,
  buildOrderBySql,
  buildPaginationResult,
};
