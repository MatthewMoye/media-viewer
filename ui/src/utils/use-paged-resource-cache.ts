import { useEffect, useRef, useState } from "react";

type UsePagedResourceCacheOptions<T> = {
  requestSignature: string;
  currentPage: number;
  fetchPage: (page: number, signal: AbortSignal) => Promise<T>;
  applyResponse: (data: T) => void;
  getTotalPages: (data: T) => number;
  onError?: (error: unknown) => void;
  maxEntries?: number;
};

export const usePagedResourceCache = <T>({
  requestSignature,
  currentPage,
  fetchPage,
  applyResponse,
  getTotalPages,
  onError,
  maxEntries = 12,
}: UsePagedResourceCacheOptions<T>) => {
  const responseCacheRef = useRef(new Map<string, T>());
  const fetchPageRef = useRef(fetchPage);
  const applyResponseRef = useRef(applyResponse);
  const getTotalPagesRef = useRef(getTotalPages);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
    applyResponseRef.current = applyResponse;
    getTotalPagesRef.current = getTotalPages;
    onErrorRef.current = onError;
  }, [fetchPage, applyResponse, getTotalPages, onError]);

  useEffect(() => {
    responseCacheRef.current.clear();
  }, [requestSignature]);

  useEffect(() => {
    const controller = new AbortController();
    const currentKey = `${requestSignature}|${currentPage}`;

    const fetchAndCache = async (page: number, shouldApply: boolean) => {
      const data = await fetchPageRef.current(page, controller.signal);
      responseCacheRef.current.set(`${requestSignature}|${page}`, data);

      while (responseCacheRef.current.size > maxEntries) {
        const oldestKey = responseCacheRef.current.keys().next().value;

        if (!oldestKey) {
          break;
        }

        responseCacheRef.current.delete(oldestKey);
      }

      if (shouldApply && !controller.signal.aborted) {
        applyResponseRef.current(data);
      }

      return data;
    };

    const prefetchAdjacentPages = (totalPages: number) => {
      if (currentPage > 1) {
        const previousKey = `${requestSignature}|${currentPage - 1}`;

        if (!responseCacheRef.current.has(previousKey)) {
          void fetchAndCache(currentPage - 1, false).catch(() => {});
        }
      }

      if (currentPage < totalPages) {
        const nextKey = `${requestSignature}|${currentPage + 1}`;

        if (!responseCacheRef.current.has(nextKey)) {
          void fetchAndCache(currentPage + 1, false).catch(() => {});
        }
      }
    };

    const loadCurrentPage = async () => {
      const cached = responseCacheRef.current.get(currentKey);

      if (cached) {
        applyResponseRef.current(cached);
        setLoading(false);
        prefetchAdjacentPages(getTotalPagesRef.current(cached));
        return;
      }

      setLoading(true);

      try {
        const data = await fetchAndCache(currentPage, true);

        if (controller.signal.aborted) {
          return;
        }

        prefetchAdjacentPages(getTotalPagesRef.current(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        onErrorRef.current?.(error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCurrentPage();

    return () => {
      controller.abort();
    };
  }, [
    currentPage,
    requestSignature,
    maxEntries,
  ]);

  return {
    loading,
  };
};
