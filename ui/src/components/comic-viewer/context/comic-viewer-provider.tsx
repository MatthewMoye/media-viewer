import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiComicBook, ComicBook } from "@/types";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { ComicViewerContext } from "./comic-viewer-context";

const PAGE_SIZE = 30;

function parseTags(description: string): string[] {
  if (!description.trim()) return [];
  return description
    .split(",")
    .map((t) => {
      const trimmed = t.trim();
      const colonIdx = trimmed.indexOf(":");
      return colonIdx !== -1 ? trimmed.slice(colonIdx + 1).trim() : trimmed;
    })
    .filter(Boolean);
}

function toComicBook(api: ApiComicBook): ComicBook {
  const baseName = api.filename.replace(/\.cbz$/i, "");
  const parts = [api.year, api.month, api.day].filter(Boolean);
  return {
    id: String(api.id),
    title: api.title || baseName,
    author: api.writer || "Unknown",
    issue: parts.length > 0 ? parts.join("-") : "",
    cover: `/comic-thumbnail/${api.id}`,
    description: api.tags || api.genre || "",
  };
}

export const ComicViewerProvider = ({ children }: PropsWithChildren) => {
  const [comicBooks, setComicBooks] = useState<ComicBook[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTermState] = useState("");
  const [selectedAuthor, setSelectedAuthorState] = useState<string | null>(null);
  const [selectedTag, setSelectedTagState] = useState<string | null>(null);
  const [authorSearch, setAuthorSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [randomized, setRandomized] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeComic, setActiveComic] = useState<ComicBook | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/comics")
      .then((res) => res.json())
      .then((data: ApiComicBook[]) => setComicBooks(data?.map(toComicBook)))
      .catch((err) => console.error("Failed to load comics:", err))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const comic of comicBooks) {
      for (const tag of parseTags(comic.description)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [comicBooks]);

  const allAuthors = useMemo(() => {
    const authorCounts = new Map<string, number>();
    for (const comic of comicBooks) {
      authorCounts.set(comic.author, (authorCounts.get(comic.author) ?? 0) + 1);
    }
    return [...authorCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [comicBooks]);

  const visibleAuthors = useMemo(() => {
    const q = authorSearch.trim().toLowerCase();
    if (!q) return allAuthors;
    return allAuthors.filter(([author]) => author.toLowerCase().includes(q));
  }, [allAuthors, authorSearch]);

  const visibleTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter(([tag]) => tag.toLowerCase().includes(q));
  }, [allTags, tagSearch]);

  const filteredComics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return comicBooks.filter((comic) => {
      const matchesSearch = !query || comic.title.toLowerCase().includes(query);
      const matchesAuthor = !selectedAuthor || comic.author === selectedAuthor;
      const matchesTag =
        !selectedTag || parseTags(comic.description).includes(selectedTag);
      return matchesSearch && matchesAuthor && matchesTag;
    });
  }, [comicBooks, searchTerm, selectedAuthor, selectedTag]);

  const shuffleComics = useCallback(() => {
    setRandomized(true);
    setShuffledIds(
      filteredComics.map((comic) => comic.id).sort(() => Math.random() - 0.5),
    );
    setCurrentPage(1);
  }, [filteredComics]);

  const orderedComics = useMemo(() => {
    if (!randomized || shuffledIds.length === 0) return filteredComics;
    const indexMap = new Map(shuffledIds.map((id, index) => [id, index]));
    return [...filteredComics].sort((a, b) => {
      const ai = indexMap.get(a.id) ?? Infinity;
      const bi = indexMap.get(b.id) ?? Infinity;
      return ai - bi;
    });
  }, [filteredComics, randomized, shuffledIds]);

  const totalPages = Math.max(1, Math.ceil(orderedComics.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;

  const visibleComics = useMemo(
    () => orderedComics.slice(startIndex, startIndex + PAGE_SIZE),
    [orderedComics, startIndex],
  );

  const activeFilterCount = Number(Boolean(selectedAuthor)) + Number(Boolean(selectedTag)) + Number(Boolean(randomized));

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    setCurrentPage(1);
  }, []);

  const setSelectedAuthor = useCallback((author: string | null) => {
    setSelectedAuthorState(author);
    setCurrentPage(1);
  }, []);

  const setSelectedTag = useCallback((tag: string | null) => {
    setSelectedTagState(tag);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedAuthorState(null);
    setSelectedTagState(null);
    setCurrentPage(1);
  }, []);

  const openComic = useCallback((comic: ComicBook) => {
    setActiveComic(comic);
  }, []);

  const closeComic = useCallback(() => {
    setActiveComic(null);
  }, []);

  const value = useMemo(
    () => ({
      comicBooks,
      visibleComics,
      filteredCount: filteredComics.length,
      loading,
      searchTerm,
      selectedAuthor,
      selectedTag,
      allAuthors,
      visibleAuthors,
      authorSearch,
      allTags,
      visibleTags,
      tagSearch,
      activeFilterCount,
      filtersExpanded,
      randomized,
      currentPage: safePage,
      totalPages,
      startIndex,
      pageSize: PAGE_SIZE,
      activeComic,
      setSearchTerm,
      setSelectedAuthor,
      setSelectedTag,
      setAuthorSearch,
      setTagSearch,
      setFiltersExpanded,
      setCurrentPage,
      openComic,
      closeComic,
      clearFilters,
      shuffleComics,
    }),
    [
      comicBooks,
      visibleComics,
      filteredComics.length,
      loading,
      searchTerm,
      selectedAuthor,
      selectedTag,
      allAuthors,
      visibleAuthors,
      authorSearch,
      allTags,
      visibleTags,
      tagSearch,
      activeFilterCount,
      filtersExpanded,
      randomized,
      safePage,
      totalPages,
      startIndex,
      activeComic,
      setSearchTerm,
      setSelectedAuthor,
      setSelectedTag,
      setAuthorSearch,
      clearFilters,
      openComic,
      closeComic,
      shuffleComics,
    ],
  );

  return (
    <ComicViewerContext.Provider value={value}>
      {children}
    </ComicViewerContext.Provider>
  );
};
