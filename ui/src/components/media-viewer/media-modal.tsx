import { useEffect, useRef } from "react";
import { useMediaViewer } from "./context/use-media-viewer";

const MediaModal = () => {
  const { modalOpen, modalItem, modalRef, closeModal, requestFullscreen } =
    useMediaViewer();

  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!modalOpen) return;

    // Push history state for back button support
    window.history.pushState({ modal: "media" }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal === "media") {
        closeModal();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [modalOpen, closeModal]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen, closeModal]);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!modalOpen || !overlay) {
      return;
    }

    const preventScroll = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    overlay.addEventListener("wheel", preventScroll, {
      passive: false,
      capture: true,
    });

    overlay.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });

    return () => {
      overlay.removeEventListener("wheel", preventScroll, {
        capture: true,
      });

      overlay.removeEventListener("touchmove", preventScroll, {
        capture: true,
      });
    };
  }, [modalOpen]);

  if (!modalOpen || !modalItem) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-none bg-slate-950/90 p-2 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={modalItem.title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90dvh] w-fit max-w-full flex-col overflow-hidden border-2 border-surface bg-surface py-2 min-h-[50vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-surface px-4 py-3">
          <p className="min-w-0 truncate text-sm font-semibold text-primary">
            {modalItem.title.length > 50
              ? `${modalItem.title.slice(0, 50)}...`
              : modalItem.title}
          </p>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={requestFullscreen}
              className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-primary transition hover-bg-accent"
            >
              Fullscreen
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition hover-bg-surface-strong"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border-t-2 border-surface bg-black">
          {modalItem.type === "image" ? (
            <img
              src={`/file/${modalItem.id}`}
              alt={modalItem.title}
              draggable={false}
              className="max-h-[calc(90dvh-5rem)] max-w-full object-contain"
            />
          ) : (
            <video
              controls
              loop
              src={`/file/${modalItem.id}`}
              poster={modalItem.thumbnail}
              className="max-h-[calc(90dvh-5rem)] max-w-full bg-black object-contain"
            >
              Sorry, your browser does not support embedded videos.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
