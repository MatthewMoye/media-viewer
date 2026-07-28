import MediaFiles from "./media-files";
import { MediaFilters } from "./filters/media-filters";
import MediaModal from "./media-modal";
import { MediaViewerProvider } from "./context/media-viewer-provider";
import { useMediaViewer } from "./context/use-media-viewer";
import PaginationControls from "../common/pagination-controls";

export const MediaViewer = () => {
  return (
    <MediaViewerProvider>
      <MediaViewerContent />
      <MediaModal />
    </MediaViewerProvider>
  );
};

const MediaViewerContent = () => {
  const {
    visibleFiles,
    filteredFileCount,
    loading,
    selectedItemId,
    openModal,
    currentPage,
    totalPages,
    startIndex,
    pageSize,
    requestPageChange,
  } = useMediaViewer();

  const showPagination = !loading && filteredFileCount > 0;

  return (
    <section className="mb-10 rounded-3xl border border-surface bg-surface-90 p-5 shadow-xl shadow-surface sm:p-6">
      <MediaFilters />
      {loading && <p className="mt-6 text-muted">Loading media...</p>}
      {!loading && filteredFileCount === 0 && (
        <p className="mt-6 text-muted">No media found.</p>
      )}
      {showPagination && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={filteredFileCount}
            pageSize={pageSize}
            onPageChange={requestPageChange}
          />
        </div>
      )}
      <MediaFiles
        files={visibleFiles}
        selectedItemId={selectedItemId}
        handleCardClick={openModal}
      />
      {showPagination && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={filteredFileCount}
            pageSize={pageSize}
            onPageChange={requestPageChange}
          />
        </div>
      )}
    </section>
  );
};
