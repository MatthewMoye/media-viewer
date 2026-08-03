import { useCallback, useRef, useState } from "react";
import { useMediaViewer } from "../context/use-media-viewer";
import { useModalEscapeClose, useModalHistoryClose } from "@/utils/modal-hooks";
import MediaModalHeader from "./media-modal-header";
import MediaModalContent from "./media-modal-content";
import MediaModalInfoPanel from "./media-modal-info-panel";

const MediaModal = () => {
  const { modalOpen, modalItem, modalRef, closeModal, requestFullscreen } = useMediaViewer();

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleClose = useCallback(() => {
    setShowInfo(false);
    closeModal();
  }, [closeModal]);

  useModalHistoryClose(modalOpen, "media", handleClose);
  useModalEscapeClose(modalOpen, handleClose);

  const isOpen = modalOpen && Boolean(modalItem);

  const attachOverlayRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (overlayRef.current) {
        const previous = overlayRef.current;

        previous.removeEventListener("wheel", preventScroll, {
          capture: true,
        });
        previous.removeEventListener("touchmove", preventScroll, {
          capture: true,
        });
      }

      overlayRef.current = node;

      if (node && isOpen) {
        node.addEventListener("wheel", preventScroll, {
          passive: false,
          capture: true,
        });

        node.addEventListener("touchmove", preventScroll, {
          passive: false,
          capture: true,
        });
      }
    },
    [isOpen],
  );

  if (!modalOpen || !modalItem) {
    return null;
  }

  return (
    <div
      ref={attachOverlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-none bg-slate-950/90 p-2 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={modalItem.title}
        onClick={(event) => event.stopPropagation()}
        className="flex min-h-[50vh] max-h-[90dvh] w-fit max-w-full flex-col overflow-hidden border-2 border-surface bg-surface py-2"
      >
        <MediaModalHeader
          title={modalItem.title}
          showInfo={showInfo}
          canFullscreen={modalItem.type === "image"}
          onToggleInfo={() => setShowInfo((current) => !current)}
          onRequestFullscreen={requestFullscreen}
          onClose={handleClose}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t-2 border-surface bg-black md:flex-row">
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
            <MediaModalContent item={modalItem} />
          </div>
          {showInfo && <MediaModalInfoPanel item={modalItem} />}
        </div>
      </div>
    </div>
  );
};

const preventScroll = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

export default MediaModal;
