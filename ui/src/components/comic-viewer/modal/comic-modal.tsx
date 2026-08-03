import { useEffect, useState, useCallback } from "react";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { useLockBodyScroll, useModalEscapeClose, useModalHistoryClose } from "@/utils/modal-hooks";
import { useComicViewer } from "../context/use-comic-viewer";
import ComicModalHeader from "./comic-modal-header";
import ComicPageStage from "./comic-page-stage";
import ComicModalInfoPanel from "./comic-modal-info-panel";

const ComicModal = () => {
  const { activeComic, closeComic } = useComicViewer();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!activeComic) {
      return;
    }

    let isMounted = true;

    (async () => {
      setShowInfo(false);
      setLoading(true);

      try {
        const res = await authenticatedFetch(`/api/comics/${activeComic.id}/pages`);
        if (!res.ok) {
          throw new Error("Failed to fetch pages");
        }

        const data: { pages: string[] } = await res.json();
        if (isMounted) {
          setPages(data.pages);
          setError(false);
          setCurrentPage(0);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setPages([]);
          setCurrentPage(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeComic]);

  const goToPrev = useCallback(() => {
    setCurrentPage((page) => Math.max(0, page - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((page) => Math.min(pages.length - 1, page + 1));
  }, [pages.length]);

  const handleClose = useCallback(() => {
    setShowInfo(false);
    closeComic();
  }, [closeComic]);

  const isOpen = Boolean(activeComic);

  useModalHistoryClose(isOpen, "comic", handleClose);
  useModalEscapeClose(isOpen, handleClose, (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      goToNext();
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      goToPrev();
    }
  });
  useLockBodyScroll(isOpen);

  if (!activeComic) {
    return null;
  }

  const hasPrev = currentPage > 0;
  const hasNext = currentPage < pages.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={activeComic.title}
    >
      <ComicModalHeader
        title={activeComic.title}
        showInfo={showInfo}
        hasPrev={hasPrev}
        hasNext={hasNext}
        canNavigate={pages.length > 0}
        onPrev={goToPrev}
        onNext={goToNext}
        onToggleInfo={() => setShowInfo((current) => !current)}
        onClose={handleClose}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black md:flex-row">
        <ComicPageStage
          pages={pages}
          currentPage={currentPage}
          loading={loading}
          error={error}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goToPrev}
          onNext={goToNext}
        />
        {showInfo && <ComicModalInfoPanel comic={activeComic} />}
      </div>
      {pages.length > 1 && (
        <div className="flex shrink-0 items-center justify-center border-t border-surface bg-surface-90 py-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ComicModal;
