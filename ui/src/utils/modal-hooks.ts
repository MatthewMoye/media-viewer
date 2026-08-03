import { useEffect } from "react";

export const useModalHistoryClose = (isOpen: boolean, modalState: string, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.history.pushState({ modal: modalState }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, modalState, onClose]);
};

export const useModalEscapeClose = (
  isOpen: boolean,
  onClose: () => void,
  extraHandler?: (event: KeyboardEvent) => void,
) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      extraHandler?.(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, extraHandler]);
};

export const useLockBodyScroll = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLocked]);
};
