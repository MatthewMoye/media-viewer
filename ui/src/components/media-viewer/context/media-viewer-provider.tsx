import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiMediaFile, FullscreenElement, MediaItem } from "@/types";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { MediaViewerContext, type MediaViewMode } from "./media-viewer-context";

const PAGE_SIZE = 30;
const ALL_FOLDERS = "all";

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
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageChangeTimeoutRef = useRef<number | null>(null);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const getFiles = async () => {
      try {
        const response = await authenticatedFetch("/api/files", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }

        const data: ApiMediaFile[] = await response.json();
        const folderSet = new Set<string>();

        const media = data.reduce<MediaItem[]>((accumulator, file) => {
          if (file.type !== "image" && file.type !== "video") {
            return accumulator;
          }

          const parentFolder = file.parent_folder || "Unknown";

          folderSet.add(parentFolder);

          accumulator.push({
            id: String(file.id),
            title: file.filename.replaceAll("-", " ").replaceAll("_", " "),
            type: file.type,
            thumbnail:
              file.type === "video"
                ? `/thumbnail/${file.id}`
                : `/file/${file.id}`,
            parent_folder: parentFolder,
          });

          return accumulator;
        }, []);

        setFiles(media);
        setFolders([...folderSet].sort());
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

    void getFiles();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pageChangeTimeoutRef.current !== null) {
        window.clearTimeout(pageChangeTimeoutRef.current);
      }
    };
  }, []);

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
    setCurrentPage(1);
  }, []);

  const filteredFiles = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    return files.filter((item) => {
      const matchesSearch =
        normalizedSearchTerm === "" ||
        item.title.toLowerCase().includes(normalizedSearchTerm);

      const matchesType = viewMode === "all" || item.type === viewMode;

      const matchesIncludedFolder =
        includedParentFolder === ALL_FOLDERS ||
        item.parent_folder === includedParentFolder;

      const matchesExcludedFolders = !excludedParentFolders.includes(
        item.parent_folder,
      );

      return (
        matchesSearch &&
        matchesType &&
        matchesIncludedFolder &&
        matchesExcludedFolders
      );
    });
  }, [
    files,
    searchTerm,
    viewMode,
    includedParentFolder,
    excludedParentFolders,
  ]);

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
    setShuffledIds(
      filteredFiles.map((f) => f.id).sort(() => Math.random() - 0.5),
    );
    setCurrentPage(1);
  }, [filteredFiles]);

  const orderedFiles = useMemo(() => {
    if (!randomized || shuffledIds.length === 0) return filteredFiles;
    const indexMap = new Map(shuffledIds.map((id, i) => [id, i]));
    return [...filteredFiles].sort((a, b) => {
      const ai = indexMap.get(a.id) ?? Infinity;
      const bi = indexMap.get(b.id) ?? Infinity;
      return ai - bi;
    });
  }, [filteredFiles, randomized, shuffledIds]);

  const totalPages = Math.max(1, Math.ceil(orderedFiles.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;

  const visibleFiles = useMemo(
    () => orderedFiles.slice(startIndex, startIndex + PAGE_SIZE),
    [orderedFiles, startIndex],
  );

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

  const value = useMemo(
    () => ({
      files,
      folders,
      visibleFiles,
      filteredFileCount: orderedFiles.length,
      loading,

      searchTerm,
      viewMode,
      includedParentFolder,
      excludedParentFolders,
      activeFilterCount,
      randomized,

      currentPage: safePage,
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
      visibleFiles,
      orderedFiles.length,
      loading,
      searchTerm,
      viewMode,
      includedParentFolder,
      excludedParentFolders,
      activeFilterCount,
      randomized,
      safePage,
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
