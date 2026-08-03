const PaginationControls = ({
  currentPage,
  totalPages,
  startIndex,
  totalItems,
  pageSize,
  isLoading = false,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  totalItems: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-surface bg-surface-80 px-4 py-3 text-center text-sm text-primary sm:flex-row sm:justify-between sm:rounded-full sm:text-left">
      <div className="w-full text-center sm:w-auto sm:text-left">
        Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
      </div>
      {isLoading && <span className="text-sm font-semibold text-primary">(Loading...)</span>}
      <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:flex-nowrap">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={isLoading || currentPage === 1}
          className="rounded-full border border-surface bg-surface-strong px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="rounded-full bg-accent px-3 py-1.5 text-center text-sm font-semibold text-primary">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={isLoading || currentPage === totalPages}
          className="rounded-full border border-surface bg-surface-strong px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
