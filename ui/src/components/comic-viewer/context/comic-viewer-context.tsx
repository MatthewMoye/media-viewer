import { createContext } from "react";
import type { ComicBook } from "@/types";

export type ComicViewerContextValue = {
  comicBooks: ComicBook[];
  visibleComics: ComicBook[];
  filteredCount: number;
  loading: boolean;

  searchTerm: string;
  selectedAuthor: string | null;
  selectedTag: string | null;
  allAuthors: [string, number][];
  visibleAuthors: [string, number][];
  authorSearch: string;
  allTags: [string, number][];
  visibleTags: [string, number][];
  tagSearch: string;
  activeFilterCount: number;
  filtersExpanded: boolean;
  randomized: boolean;

  currentPage: number;
  totalPages: number;
  startIndex: number;
  pageSize: number;

  activeComic: ComicBook | null;

  setSearchTerm: (value: string) => void;
  setSelectedAuthor: (author: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
  setAuthorSearch: (value: string) => void;
  setTagSearch: (value: string) => void;
  setFiltersExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  setCurrentPage: (page: number) => void;
  openComic: (comic: ComicBook) => void;
  closeComic: () => void;
  clearFilters: () => void;
  shuffleComics: () => void;
};

export const ComicViewerContext =
  createContext<ComicViewerContextValue | null>(null);
