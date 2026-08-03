import DetailsList from "@/components/common/details-list";
import type { MediaItem } from "@/types";
import { formatNumber, formatTimestamp } from "@/utils/formatters";

const MediaModalInfoPanel = ({ item }: { item: MediaItem }) => {
  const details = [
    { label: "Filename", value: item.filename, breakValue: true },
    { label: "Type", value: item.type },
    { label: "Extension", value: item.extension || "Unknown" },
    { label: "Size", value: `${formatNumber(item.size)} bytes` },
    { label: "Modified", value: formatTimestamp(item.modified) },
    { label: "Library root", value: item.root || "Unknown" },
    { label: "Parent folder", value: item.parent_folder || "Unknown" },
  ];

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-t border-surface bg-surface-90 p-4 text-sm text-primary md:w-[320px] md:border-l md:border-t-0">
      <h3 className="mb-3 text-sm font-semibold text-primary">File details</h3>
      <DetailsList items={details} />
    </aside>
  );
};

export default MediaModalInfoPanel;
