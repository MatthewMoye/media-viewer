import ModalActionButton from "@/components/common/modal-action-button";

type MediaModalHeaderProps = {
  title: string;
  showInfo: boolean;
  canFullscreen: boolean;
  onToggleInfo: () => void;
  onRequestFullscreen: () => void;
  onClose: () => void;
};

const MediaModalHeader = ({
  title,
  showInfo,
  canFullscreen,
  onToggleInfo,
  onRequestFullscreen,
  onClose,
}: MediaModalHeaderProps) => {
  const truncatedTitle = title.length > 50 ? `${title.slice(0, 50)}...` : title;

  return (
    <div className="flex h-16 shrink-0 items-center justify-between px-4 py-3">
      <p className="min-w-0 truncate text-sm font-semibold text-primary">
        {truncatedTitle}
      </p>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <ModalActionButton onClick={onToggleInfo} className="hover:bg-accent">
          {showInfo ? "Hide info" : "Info"}
        </ModalActionButton>
        {canFullscreen && (
          <ModalActionButton
            variant="accent"
            onClick={onRequestFullscreen}
            className="hover:opacity-90"
          >
            Fullscreen
          </ModalActionButton>
        )}
        <ModalActionButton onClick={onClose} className="hover:bg-accent">
          Close
        </ModalActionButton>
      </div>
    </div>
  );
};

export default MediaModalHeader;
