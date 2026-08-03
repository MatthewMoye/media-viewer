import DetailsList from "@/components/common/details-list";
import type { ComicBook } from "@/types";
import {
  formatNumber,
  formatReleaseDate,
  formatTimestamp,
} from "@/utils/formatters";

const ComicModalInfoPanel = ({ comic }: { comic: ComicBook }) => {
  const details = [
    { label: "Title", value: comic.title, breakValue: true },
    { label: "Filename", value: comic.filename, breakValue: true },
    { label: "Author", value: comic.author || "Unknown" },
    {
      label: "Release date",
      value: formatReleaseDate(comic.year, comic.month, comic.day),
    },
    { label: "Series", value: comic.series || "Unknown" },
    { label: "Format", value: comic.format || "Unknown" },
    { label: "Genre", value: comic.genre || "Unknown" },
    { label: "Tags", value: comic.tags || "Unknown", breakValue: true },
    { label: "Web", value: comic.web || "Unknown", breakValue: true },
    { label: "Library root", value: comic.root || "Unknown" },
    { label: "Parent folder", value: comic.parent_folder || "Unknown" },
    { label: "Size", value: formatNumber(comic.size) },
    { label: "Modified", value: formatTimestamp(comic.modified) },
  ];

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-t border-surface bg-surface-90 p-4 text-sm text-primary md:w-[320px] md:border-l md:border-t-0">
      <h3 className="mb-3 text-sm font-semibold text-primary">Comic details</h3>
      <DetailsList items={details} />
    </aside>
  );
};

export default ComicModalInfoPanel;
