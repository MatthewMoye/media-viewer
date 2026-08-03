function parseComicInfo(xmlContent) {
  function getField(tag) {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xmlContent);
    return match ? match[1].trim() || null : null;
  }

  const yearRaw = getField("Year");
  const monthRaw = getField("Month");
  const dayRaw = getField("Day");
  const pageCountRaw = getField("PageCount");

  return {
    title: getField("Title"),
    year: yearRaw ? Number.parseInt(yearRaw, 10) : null,
    month: monthRaw ? Number.parseInt(monthRaw, 10) : null,
    day: dayRaw ? Number.parseInt(dayRaw, 10) : null,
    writer: getField("Writer"),
    genre: getField("Genre"),
    tags: getField("Tags"),
    web: getField("Web"),
    series: getField("Series"),
    format: getField("Format"),
    pageCount: pageCountRaw ? Number.parseInt(pageCountRaw, 10) : null,
  };
}

module.exports = {
  parseComicInfo,
};
