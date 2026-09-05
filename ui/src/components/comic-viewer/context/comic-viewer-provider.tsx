import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { ApiComicBook, ApiComicsResponse, ComicBook } from "@/types";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { createRandomSeed } from "@/utils/random";
import { usePagedResourceCache } from "@/utils/use-paged-resource-cache";
import {
  readUrlNumberParam,
  readUrlPageParam,
  readUrlSearchParam,
  writeUrlSearchParams,
} from "@/utils/url-search-params";
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

export const ComicViewerProvider = ({ children }: PropsWithChildren) => {
  const [comicBooks, setComicBooks] = useState<ComicBook[]>([]);

  const [searchTerm, setSearchTermState] = useState(() => readUrlSearchParam("comics.search") ?? "");
  const [selectedAuthor, setSelectedAuthorState] = useState<string | null>(() =>
    readUrlSearchParam("comics.author"),
  );
  const [selectedTag, setSelectedTagState] = useState<string | null>(() =>
    readUrlSearchParam("comics.tag"),
  );
  const [authorSearch, setAuthorSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number | null>(() => readUrlNumberParam("comics.seed"));
  const [randomized, setRandomized] = useState(() => readUrlNumberParam("comics.seed") !== null);

  const [allAuthors, setAllAuthors] = useState<[string, number][]>([]);
  const [allTags, setAllTags] = useState<[string, number][]>([]);

  const [currentPage, setCurrentPageState] = useState(() => readUrlPageParam("comics.page"));
  const [totalPages, setTotalPages] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);

  const [activeComic, setActiveComic] = useState<ComicBook | null>(null);

  useEffect(() => {
    writeUrlSearchParams({
      "comics.search": searchTerm.trim() === "" ? null : searchTerm.trim(),
      "comics.author": selectedAuthor,
      "comics.tag": selectedTag,
      "comics.seed": randomized && randomSeed !== null ? String(randomSeed) : null,
      "comics.page": currentPage > 1 ? String(currentPage) : null,
    });
  }, [searchTerm, selectedAuthor, selectedTag, randomized, randomSeed, currentPage]);

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
    const pages = Math.max(1, data.totalPages);

    setComicBooks(data.items.map(toComicBook));
    setAllAuthors(data.authors);
    setAllTags(data.tags);
    setFilteredCount(data.totalCount);
    setTotalPages(pages);
    setCurrentPageState((page) => Math.min(page, pages));
  }, []);

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal): Promise<ApiComicsResponse> => {
      const queryString = buildQueryString(page);
      const response = await authenticatedFetch(`/api/comics?${queryString}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load comics");
      }

      return response.json() as Promise<ApiComicsResponse>;
    },
    [buildQueryString],
  );

  const { loading } = usePagedResourceCache<ApiComicsResponse>({
    requestSignature,
    currentPage,
    fetchPage,
    applyResponse,
    getTotalPages: (data) => Math.max(1, data.totalPages),
    maxEntries: 12,
    onError: (error) => {
      console.error("Failed to load comics:", error);
    },
  });

  const visibleAuthors = useMemo(() => {
    const query = authorSearch.trim().toLowerCase();
    if (!query) return allAuthors;

    return allAuthors.filter(([author]) => author.toLowerCase().includes(query));
  }, [allAuthors, authorSearch]);

  const visibleTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return allTags;

    return allTags.filter(([tag]) => tag.toLowerCase().includes(query));
  }, [allTags, tagSearch]);

  const activeFilterCount =
    Number(Boolean(selectedAuthor)) + Number(Boolean(selectedTag)) + Number(Boolean(randomized));

  const resetToFirstPage = useCallback(() => {
    setCurrentPageState(1);
  }, []);

  const setSearchTerm = useCallback(
    (value: string) => {
      setSearchTermState(value);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const setSelectedAuthor = useCallback(
    (author: string | null) => {
      setSelectedAuthorState(author);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const setSelectedTag = useCallback(
    (tag: string | null) => {
      setSelectedTagState(tag);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPageState(nextPage);
    },
    [totalPages],
  );

  const clearFilters = useCallback(() => {
    setSearchTermState("");
    setSelectedAuthorState(null);
    setSelectedTagState(null);
    setAuthorSearch("");
    setTagSearch("");
    setRandomized(false);
    setRandomSeed(null);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const shuffleComics = useCallback(() => {
    setRandomized(true);
    setRandomSeed(createRandomSeed());
    resetToFirstPage();
  }, [resetToFirstPage]);

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

  return <ComicViewerContext.Provider value={value}>{children}</ComicViewerContext.Provider>;
};
