import { useAuth } from "../auth/use-auth";

type ViewType = "media" | "comics";

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const Header = ({ currentView, onViewChange }: HeaderProps) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="border-b border-surface bg-primary text-primary">
      <div className="mx-auto flex max-w-[90vw] items-center justify-between px-4 py-4">
        <div className="text-lg font-semibold hidden sm:inline">Media Viewer</div>
        <div className="sm:hidden">MV</div>
        <div className="flex gap-4">
          <button
            onClick={() => onViewChange("media")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              currentView === "media"
                ? "bg-accent text-primary"
                : "bg-surface text-primary hover:bg-muted"
            }`}
          >
            <span className="hidden sm:inline">🖼️</span>
            <span className="sm:hidden">Media</span>
            <span className="hidden sm:inline">Media</span>
          </button>
          <button
            onClick={() => onViewChange("comics")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              currentView === "comics"
                ? "bg-accent text-primary"
                : "bg-surface text-primary hover:bg-muted"
            }`}
          >
            {/* Icon for mobile, text for desktop */}
            <span className="hidden sm:inline">📖</span>
            <span className="sm:hidden">Comics</span>
            <span className="hidden sm:inline">Comics</span>
          </button>
        </div>

        {/* Right: Logout Button */}
        <button
          onClick={handleLogout}
          className="rounded-lg bg-surface px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">🚪</span>
        </button>
      </div>
    </header>
  );
};
