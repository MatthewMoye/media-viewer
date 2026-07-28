import { useContext } from "react";
import { ComicViewerContext } from "./comic-viewer-context";

export const useComicViewer = () => {
  const context = useContext(ComicViewerContext);

  if (!context) {
    throw new Error("useComicViewer must be used within ComicViewerProvider");
  }

  return context;
};
