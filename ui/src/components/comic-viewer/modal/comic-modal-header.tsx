import ModalActionButton from "@/components/common/modal-action-button";

type ComicModalHeaderProps = {
  title: string;
  showInfo: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  canNavigate: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleInfo: () => void;
  onClose: () => void;
};

const ComicModalHeader = ({
  title,
  showInfo,
  hasPrev,
  hasNext,
  canNavigate,
  onPrev,
  onNext,
  onToggleInfo,
  onClose,
}: ComicModalHeaderProps) => {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-surface bg-surface-90 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary">{title}</p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2">
        {canNavigate && (
          <>
            <ModalActionButton
              onClick={onPrev}
              disabled={!hasPrev}
              className="disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
            >
              ← Prev
            </ModalActionButton>
            <ModalActionButton
              onClick={onNext}
              disabled={!hasNext}
              className="disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
            >
              Next →
            </ModalActionButton>
          </>
        )}
        <ModalActionButton onClick={onToggleInfo} className="hover:bg-accent">
          {showInfo ? "Hide info" : "Info"}
        </ModalActionButton>
        <ModalActionButton onClick={onClose} className="hover:bg-accent">
          Close
        </ModalActionButton>
      </div>
    </div>
  );
};

export default ComicModalHeader;
