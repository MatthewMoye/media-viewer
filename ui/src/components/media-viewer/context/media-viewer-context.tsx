import { createContext, type RefObject } from "react";
import type { MediaItem, MediaType } from "@/types";

export type MediaViewMode = "all" | MediaType;

export type MediaViewerContextValue = {
  files: MediaItem[];
  folders: string[];
  visibleFiles: MediaItem[];
  filteredFileCount: number;
  loading: boolean;

  searchTerm: string;
  viewMode: MediaViewMode;
  includedParentFolder: string;
  excludedParentFolders: string[];
  activeFilterCount: number;

  currentPage: number;
  totalPages: number;
  startIndex: number;
  pageSize: number;

  selectedItemId: string;
  modalOpen: boolean;
  modalItem: MediaItem | null;
  modalRef: RefObject<HTMLDivElement | null>;

  randomized: boolean;

  setSearchTerm: (value: string) => void;
  setViewMode: (mode: MediaViewMode) => void;
  setIncludedParentFolder: (folder: string) => void;
  toggleExcludedParentFolder: (folder: string) => void;
  clearFolderFilters: () => void;
  clearAllFilters: () => void;
  shuffleMedia: () => void;
  requestPageChange: (page: number) => void;

  openModal: (item: MediaItem) => void;
  closeModal: () => void;
  requestFullscreen: () => void;
};

export const MediaViewerContext = createContext<MediaViewerContextValue | null>(null);
