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

function createRandomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

export const MediaViewerProvider = ({ children }: PropsWithChildren) => {
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
  const responseCacheRef = useRef(new Map<string, ApiMediaFilesResponse>());

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

  useEffect(() => {
    return () => {
      if (pageChangeTimeoutRef.current !== null) {
        window.clearTimeout(pageChangeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    responseCacheRef.current.clear();
  }, [requestSignature]);

  useEffect(() => {
    const controller = new AbortController();
    const currentKey = `${requestSignature}|${currentPage}`;

    const fetchPage = async (page: number, shouldApply: boolean) => {
      const queryString = buildQueryString(page);
      const response = await authenticatedFetch(`/api/files?${queryString}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data: ApiMediaFilesResponse = await response.json();
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

        console.error("Failed to load media:", error);
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
  }, [applyResponse, buildQueryString, currentPage, requestSignature]);

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    setCurrentPage(1);
  }, []);

  const setViewMode = useCallback((mode: MediaViewMode) => {
    setViewModeState(mode);
    setCurrentPage(1);
  }, []);

  const setIncludedParentFolder = useCallback((folder: string) => {
    setIncludedParentFolderState(folder);

    if (folder !== ALL_FOLDERS) {
      setExcludedParentFolders((currentFolders) =>
        currentFolders.filter((excludedFolder) => excludedFolder !== folder),
      );
    }

    setCurrentPage(1);
  }, []);

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

    setCurrentPage(1);
  }, []);

  const clearFolderFilters = useCallback(() => {
    setIncludedParentFolderState(ALL_FOLDERS);
    setExcludedParentFolders([]);
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTermState("");
    setViewModeState("all");
    setIncludedParentFolderState(ALL_FOLDERS);
    setExcludedParentFolders([]);
    setRandomized(false);
    setRandomSeed(null);
    setCurrentPage(1);
  }, []);

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
    setCurrentPage(1);
  }, []);

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
