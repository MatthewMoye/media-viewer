import type { MediaItem } from "@/types";

type MediaFilesProps = {
  files: MediaItem[];
  selectedItemId: string | null;
  handleCardClick: (item: MediaItem) => void;
};

const MediaFiles = ({
  files,
  selectedItemId,
  handleCardClick,
}: MediaFilesProps) => {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((item) => (
        <div
          key={item.id}
          onClick={() => handleCardClick(item)}
          className={`group cursor-pointer overflow-hidden rounded-xl border-2 transition ${
            selectedItemId === item.id
              ? "border-accent bg-surface-strong"
              : "border-surface bg-surface-90 hover:bg-surface-strong"
          }`}
        >
          <div className="relative h-80 overflow-hidden border-b-2 border-surface bg-black">
            {item.type === "video" ? (
              <img
                src={`/thumbnail/${item.id}`}
                alt={item.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-full w-full object-contain"
              />
            ) : (
              <img
                src={`/file/${item.id}`}
                alt={item.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-full w-full object-contain"
              />
            )}

            <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-90 text-primary shadow-sm">
              {item.type === "video" ? "▶" : "🖼"}
            </span>
          </div>
          <div className="p-4 text-left">
            <h3 className="text-base font-semibold text-primary truncate">
              {item.title}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaFiles;
