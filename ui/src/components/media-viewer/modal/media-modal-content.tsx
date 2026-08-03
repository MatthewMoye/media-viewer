import type { MediaItem } from "@/types";

const MediaModalContent = ({ item }: { item: MediaItem }) => {
  if (item.type === "image") {
    return (
      <img
        src={`/file/${item.id}`}
        alt={item.title}
        draggable={false}
        className="max-h-[calc(100dvh-4rem)] max-w-full object-contain"
      />
    );
  }

  return (
    <video
      controls
      loop
      src={`/file/${item.id}`}
      poster={item.thumbnail}
      className="max-h-[calc(90dvh-5rem)] max-w-full bg-black object-contain"
    >
      Sorry, your browser does not support embedded videos.
    </video>
  );
};

export default MediaModalContent;
