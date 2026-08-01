import { ComicViewerProvider } from "./context/comic-viewer-provider";
import { useComicViewer } from "./context/use-comic-viewer";
import { ComicFilters } from "./filters/comic-filters";
import ComicCards from "./comic-cards";
import ComicModal from "./comic-modal";
import PaginationControls from "../common/pagination-controls";

const ComicViewerContent = () => {
  const {
    filteredCount,
    loading,
    currentPage,
    totalPages,
    startIndex,
    pageSize,
    setCurrentPage,
  } = useComicViewer();

  const showPagination = !loading && filteredCount > 0;

  return (
    <section className="rounded-3xl border border-surface bg-surface-90 p-5 shadow-xl shadow-surface sm:p-6">
      <ComicModal />
      <ComicFilters />
      {loading && <p className="mt-6 text-muted">Loading comics...</p>}
      {!loading && filteredCount === 0 && (
        <p className="mt-6 text-muted">No comics found.</p>
      )}
      {showPagination && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={filteredCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      <ComicCards />
      {showPagination && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={filteredCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </section>
  );
};

export const ComicViewer = () => {
  return (
    <ComicViewerProvider>
      <ComicViewerContent />
    </ComicViewerProvider>
  );
};
