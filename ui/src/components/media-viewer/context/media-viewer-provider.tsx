import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  ApiMediaFile,
  ApiMediaFilesResponse,
  FullscreenElement,
  MediaItem,
} from "@/types";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { createRandomSeed } from "@/utils/random";
import { usePagedResourceCache } from "@/utils/use-paged-resource-cache";
import { MediaViewerContext, type MediaViewMode } from "./media-viewer-context";

const PAGE_SIZE = 30;
const ALL_FOLDERS = "all";

function toMediaItem(file: ApiMediaFile): MediaItem {
  const parentFolder = file.parent_folder || "Unknown";

  return {
    id: String(file.id),
    title: file.filename.replaceAll("-", " ").replaceAll("_", " "),
    type: file.type,
    thumbnail:
      file.type === "video" ? `/thumbnail/${file.id}` : `/file/${file.id}`,
    root: file.root,
    parent_folder: parentFolder,
    filename: file.filename,
    extension: file.extension,
    size: file.size,
    modified: file.modified,
    thumbnail_generated: file.thumbnail_generated,
  };
}

export const MediaViewerProvider = ({ children }: PropsWithChildren) => {
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);

  const [searchTerm, setSearchTermState] = useState("");
  const [viewMode, setViewModeState] = useState<MediaViewMode>("all");
  const [includedParentFolder, setIncludedParentFolderState] =
    useState(ALL_FOLDERS);
  const [excludedParentFolders, setExcludedParentFolders] = useState<string[]>(
    [],
  );

  const [randomized, setRandomized] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredFileCount, setFilteredFileCount] = useState(0);

  const pageChangeTimeoutRef = useRef<number | null>(null);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  const requestSignature = useMemo(() => {
    const normalizedSearch = searchTerm.trim();
    const sortedExcludedFolders = [...excludedParentFolders].sort();

    return JSON.stringify({
      normalizedSearch,
      viewMode,
      includedParentFolder,
      sortedExcludedFolders,
      randomized,
      randomSeed,
      pageSize: PAGE_SIZE,
    });
  }, [
    searchTerm,
    viewMode,
    includedParentFolder,
    excludedParentFolders,
    randomized,
    randomSeed,
  ]);

  const buildQueryString = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      if (searchTerm.trim() !== "") {
        params.set("search", searchTerm.trim());
      }

      if (viewMode !== "all") {
        params.set("type", viewMode);
      }

      if (includedParentFolder !== ALL_FOLDERS) {
        params.set("includeFolder", includedParentFolder);
      }

      if (excludedParentFolders.length > 0) {
        params.set("excludeFolders", excludedParentFolders.join(","));
      }

      if (randomized && randomSeed !== null) {
        params.set("randomSeed", String(randomSeed));
      }

      return params.toString();
    },
    [
      searchTerm,
      viewMode,
      includedParentFolder,
      excludedParentFolders,
      randomized,
      randomSeed,
    ],
  );

  const applyResponse = useCallback((data: ApiMediaFilesResponse) => {
    setFiles(data.items.map(toMediaItem));
    setFolders(data.folders);
    setFilteredFileCount(data.totalCount);
    setTotalPages(Math.max(1, data.totalPages));
  }, []);

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal): Promise<ApiMediaFilesResponse> => {
      const queryString = buildQueryString(page);
      const response = await authenticatedFetch(`/api/files?${queryString}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      return response.json() as Promise<ApiMediaFilesResponse>;
    },
    [buildQueryString],
  );

  const { loading } = usePagedResourceCache<ApiMediaFilesResponse>({
    requestSignature,
    currentPage,
    fetchPage,
    applyResponse,
    getTotalPages: (data) => Math.max(1, data.totalPages),
    maxEntries: 12,
    onError: (error) => {
      console.error("Failed to load media:", error);
    },
  });

  useEffect(() => {
    return () => {
      if (pageChangeTimeoutRef.current !== null) {
        window.clearTimeout(pageChangeTimeoutRef.current);
      }
    };
  }, []);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const setViewMode = useCallback((mode: MediaViewMode) => {
    setViewModeState(mode);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const setIncludedParentFolder = useCallback((folder: string) => {
    setIncludedParentFolderState(folder);

    if (folder !== ALL_FOLDERS) {
      setExcludedParentFolders((currentFolders) =>
        currentFolders.filter((excludedFolder) => excludedFolder !== folder),
      );
    }

    resetToFirstPage();
  }, [resetToFirstPage]);

  const toggleExcludedParentFolder = useCallback((folder: string) => {
    setExcludedParentFolders((currentFolders) => {
      const folderIsExcluded = currentFolders.includes(folder);

      if (folderIsExcluded) {
        return currentFolders.filter(
          (excludedFolder) => excludedFolder !== folder,
        );
      }

      return [...currentFolders, folder];
    });

    setIncludedParentFolderState((currentFolder) =>
      currentFolder === folder ? ALL_FOLDERS : currentFolder,
    );

    resetToFirstPage();
  }, [resetToFirstPage]);

  const clearFolderFilters = useCallback(() => {
    setIncludedParentFolderState(ALL_FOLDERS);
    setExcludedParentFolders([]);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const clearAllFilters = useCallback(() => {
    setSearchTermState("");
    setViewModeState("all");
    setIncludedParentFolderState(ALL_FOLDERS);
    setExcludedParentFolders([]);
    setRandomized(false);
    setRandomSeed(null);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (searchTerm.trim() !== "") {
      count += 1;
    }

    if (viewMode !== "all") {
      count += 1;
    }

    if (includedParentFolder !== ALL_FOLDERS) {
      count += 1;
    }

    count += excludedParentFolders.length;

    if (randomized) {
      count += 1;
    }

    return count;
  }, [
    searchTerm,
    viewMode,
    includedParentFolder,
    excludedParentFolders,
    randomized,
  ]);

  const shuffleMedia = useCallback(() => {
    setRandomized(true);
    setRandomSeed(createRandomSeed());
    resetToFirstPage();
  }, [resetToFirstPage]);

  const requestPageChange = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(1, page), totalPages);

      if (pageChangeTimeoutRef.current !== null) {
        window.clearTimeout(pageChangeTimeoutRef.current);
      }

      pageChangeTimeoutRef.current = window.setTimeout(() => {
        setCurrentPage(nextPage);
        pageChangeTimeoutRef.current = null;
      }, 180);
    },
    [totalPages],
  );

  const openModal = useCallback((item: MediaItem) => {
    setSelectedItemId(item.id);
    setModalItem(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalItem(null);
  }, []);

  const requestFullscreen = useCallback(() => {
    const element = modalRef.current as FullscreenElement | null;

    if (element?.requestFullscreen) {
      void element.requestFullscreen();
      return;
    }

    if (element?.webkitRequestFullscreen) {
      void element.webkitRequestFullscreen();
    }
  }, []);

  const startIndex = (Math.max(1, currentPage) - 1) * PAGE_SIZE;

  const value = useMemo(
    () => ({
      files,
      folders,
      visibleFiles: files,
      filteredFileCount,
      loading,

      searchTerm,
      viewMode,
      includedParentFolder,
      excludedParentFolders,
      activeFilterCount,
      randomized,

      currentPage,
      totalPages,
      startIndex,
      pageSize: PAGE_SIZE,

      selectedItemId,
      modalOpen,
      modalItem,
      modalRef,

      setSearchTerm,
      setViewMode,
      setIncludedParentFolder,
      toggleExcludedParentFolder,
      clearFolderFilters,
      clearAllFilters,
      shuffleMedia,
      requestPageChange,

      openModal,
      closeModal,
      requestFullscreen,
    }),
    [
      files,
      folders,
      filteredFileCount,
      loading,
      searchTerm,
      viewMode,
      includedParentFolder,
      excludedParentFolders,
      activeFilterCount,
      randomized,
      currentPage,
      totalPages,
      startIndex,
      selectedItemId,
      modalOpen,
      modalItem,
      setSearchTerm,
      setViewMode,
      setIncludedParentFolder,
      toggleExcludedParentFolder,
      clearFolderFilters,
      clearAllFilters,
      shuffleMedia,
      requestPageChange,
      openModal,
      closeModal,
      requestFullscreen,
    ],
  );

  return (
    <MediaViewerContext.Provider value={value}>
      {children}
    </MediaViewerContext.Provider>
  );
};
