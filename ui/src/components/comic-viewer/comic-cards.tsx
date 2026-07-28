import type { ComicBook } from "@/types";

type ComicCardsProps = {
  comics: ComicBook[];
  onCardClick: (comic: ComicBook) => void;
};

const ComicCards = ({ comics, onCardClick }: ComicCardsProps) => {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {comics.map((comic) => (
        <article
          key={comic.id}
          onClick={() => onCardClick(comic)}
          className="cursor-pointer overflow-hidden rounded-xl border-2 border-surface bg-surface-90 transition hover:bg-surface-strong"
        >
          <div className="relative h-80 overflow-hidden border-b-2 border-surface bg-black">
            <img
              src={comic.cover}
              alt={comic.title}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-full w-full object-contain"
            />
            <span className="absolute left-3 top-3 flex items-center justify-center rounded-full bg-surface-90 px-2 py-1 text-xs shadow-sm">
              📚
            </span>
          </div>
          <div className="p-4">
            <h3 className="truncate text-base font-semibold text-primary">
              {comic.title}
            </h3>
            {comic.author !== "Unknown" && (
              <p className="mt-1 truncate text-sm text-muted">{comic.author}</p>
            )}
            {comic.issue && (
              <p className="mt-1 text-xs text-muted">{comic.issue}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default ComicCards;
