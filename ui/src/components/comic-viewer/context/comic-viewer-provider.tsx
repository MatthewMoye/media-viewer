import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiComicBook, ApiComicsResponse, ComicBook } from "@/types";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { ComicViewerContext } from "./comic-viewer-context";

const PAGE_SIZE = 30;

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
    filename: api.filename,
    year: api.year,
    month: api.month,
    day: api.day,
    genre: api.genre,
    tags: api.tags,
    web: api.web,
    series: api.series,
    format: api.format,
    page_count: api.page_count,
    root: api.root || "",
    parent_folder: api.parent_folder || "",
    size: typeof api.size === "number" ? api.size : null,
    modified: typeof api.modified === "number" ? api.modified : null,
  };
}

function createRandomSeed() {
  return Math.floor(Math.random() * 2147483647);
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
  const [randomSeed, setRandomSeed] = useState<number | null>(null);

  const [allAuthors, setAllAuthors] = useState<[string, number][]>([]);
  const [allTags, setAllTags] = useState<[string, number][]>([]);

  const [currentPage, setCurrentPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const responseCacheRef = useRef(new Map<string, ApiComicsResponse>());

  const [activeComic, setActiveComic] = useState<ComicBook | null>(null);

  const requestSignature = useMemo(() => {
    return JSON.stringify({
      search: searchTerm.trim(),
      selectedAuthor,
      selectedTag,
      randomized,
      randomSeed,
      pageSize: PAGE_SIZE,
    });
  }, [searchTerm, selectedAuthor, selectedTag, randomized, randomSeed]);

  const buildQueryString = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      if (searchTerm.trim() !== "") {
        params.set("search", searchTerm.trim());
      }

      if (selectedAuthor) {
        params.set("author", selectedAuthor);
      }

      if (selectedTag) {
        params.set("tag", selectedTag);
      }

      if (randomized && randomSeed !== null) {
        params.set("randomSeed", String(randomSeed));
      }

      return params.toString();
    },
    [searchTerm, selectedAuthor, selectedTag, randomized, randomSeed],
  );

  const applyResponse = useCallback((data: ApiComicsResponse) => {
    setComicBooks(data.items.map(toComicBook));
    setAllAuthors(data.authors);
    setAllTags(data.tags);
    setFilteredCount(data.totalCount);
    setTotalPages(Math.max(1, data.totalPages));
  }, []);

  useEffect(() => {
    responseCacheRef.current.clear();
  }, [requestSignature]);

  useEffect(() => {
    const controller = new AbortController();
    const currentKey = `${requestSignature}|${currentPage}`;

    const fetchPage = async (page: number, shouldApply: boolean) => {
      const queryString = buildQueryString(page);
      const response = await authenticatedFetch(`/api/comics?${queryString}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load comics");
      }

      const data: ApiComicsResponse = await response.json();
      responseCacheRef.current.set(`${requestSignature}|${page}`, data);

      if (shouldApply && !controller.signal.aborted) {
        applyResponse(data);
      }

      return data;
    };

    const loadCurrentPage = async () => {
      const cached = responseCacheRef.current.get(currentKey);

      if (cached) {
        applyResponse(cached);
        setLoading(false);

        if (currentPage > 1) {
          const previousKey = `${requestSignature}|${currentPage - 1}`;
          if (!responseCacheRef.current.has(previousKey)) {
            void fetchPage(currentPage - 1, false).catch(() => {});
          }
        }

        if (currentPage < cached.totalPages) {
          const nextKey = `${requestSignature}|${currentPage + 1}`;
          if (!responseCacheRef.current.has(nextKey)) {
            void fetchPage(currentPage + 1, false).catch(() => {});
          }
        }

        return;
      }

      setLoading(true);

      try {
        const data = await fetchPage(currentPage, true);

        if (controller.signal.aborted) {
          return;
        }

        if (currentPage > 1) {
          const previousKey = `${requestSignature}|${currentPage - 1}`;
          if (!responseCacheRef.current.has(previousKey)) {
            void fetchPage(currentPage - 1, false).catch(() => {});
          }
        }

        if (currentPage < data.totalPages) {
          const nextKey = `${requestSignature}|${currentPage + 1}`;
          if (!responseCacheRef.current.has(nextKey)) {
            void fetchPage(currentPage + 1, false).catch(() => {});
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load comics:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCurrentPage();

    return () => {
      controller.abort();
    };
  }, [
    applyResponse,
    buildQueryString,
    currentPage,
    requestSignature,
  ]);

  const visibleAuthors = useMemo(() => {
    const query = authorSearch.trim().toLowerCase();
    if (!query) return allAuthors;

    return allAuthors.filter(([author]) =>
      author.toLowerCase().includes(query),
    );
  }, [allAuthors, authorSearch]);

  const visibleTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return allTags;

    return allTags.filter(([tag]) => tag.toLowerCase().includes(query));
  }, [allTags, tagSearch]);

  const activeFilterCount =
    Number(Boolean(selectedAuthor)) +
    Number(Boolean(selectedTag)) +
    Number(Boolean(randomized));

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    setCurrentPageState(1);
  }, []);

  const setSelectedAuthor = useCallback((author: string | null) => {
    setSelectedAuthorState(author);
    setCurrentPageState(1);
  }, []);

  const setSelectedTag = useCallback((tag: string | null) => {
    setSelectedTagState(tag);
    setCurrentPageState(1);
  }, []);

  const setCurrentPage = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPageState(nextPage);
    },
    [totalPages],
  );

  const clearFilters = useCallback(() => {
    setSelectedAuthorState(null);
    setSelectedTagState(null);
    setRandomized(false);
    setRandomSeed(null);
    setCurrentPageState(1);
  }, []);

  const shuffleComics = useCallback(() => {
    setRandomized(true);
    setRandomSeed(createRandomSeed());
    setCurrentPageState(1);
  }, []);

  const openComic = useCallback((comic: ComicBook) => {
    setActiveComic(comic);
  }, []);

  const closeComic = useCallback(() => {
    setActiveComic(null);
  }, []);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const value = useMemo(
    () => ({
      comicBooks,
      visibleComics: comicBooks,
      filteredCount,
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

      currentPage,
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
      filteredCount,
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
      currentPage,
      totalPages,
      startIndex,
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
    ],
  );

  return (
    <ComicViewerContext.Provider value={value}>
      {children}
    </ComicViewerContext.Provider>
  );
};