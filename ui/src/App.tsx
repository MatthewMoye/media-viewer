import { useState } from "react";
import { MediaViewer } from "./components/media-viewer/media-viewer";
import { ComicViewer } from "./components/comic-viewer/comic-viewer";
import { Login } from "./components/auth/login";
import { useAuth } from "./components/auth/use-auth";
import { Header } from "./components/common/header";
import { readUrlSearchParam, writeUrlSearchParams } from "./utils/url-search-params";

function App() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-surface border-t-accent"></div>
          <p className="text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppContent /> : <Login />;
}

type ViewType = "media" | "comics";

function getInitialView(): ViewType {
  return readUrlSearchParam("view") === "comics" ? "comics" : "media";
}

function AppContent() {
  const [currentView, setCurrentViewState] = useState<ViewType>(getInitialView);

  const setCurrentView = (view: ViewType) => {
    setCurrentViewState(view);
    writeUrlSearchParams({ view });
  };

  return (
    <div className="min-h-screen bg-primary text-primary">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="mx-auto max-w-[90vw] py-8">
        {currentView === "media" && <MediaViewer />}
        {currentView === "comics" && <ComicViewer />}
      </main>
    </div>
  );
}

export default App;
