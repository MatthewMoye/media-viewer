import { useComicViewer } from "../context/use-comic-viewer";
import { SearchInput } from "../../common/search-input";

export const ComicSearchFilter = () => {
  const { searchTerm, setSearchTerm } = useComicViewer();

  return (
    <SearchInput
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search comics"
      ariaLabel="Search comics"
    />
  );
};
