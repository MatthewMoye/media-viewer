export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return new Intl.NumberFormat().format(value);
};

export const formatTimestamp = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return new Date(value).toLocaleString();
};

export const formatReleaseDate = (
  year: number | null | undefined,
  month: number | null | undefined,
  day: number | null | undefined,
): string => {
  const releaseParts = [year, month, day].filter(
    (part): part is number => typeof part === "number",
  );

  if (releaseParts.length === 0) {
    return "Unknown";
  }

  return releaseParts.join("-");
};
