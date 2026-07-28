import { useMediaViewer } from "../context/use-media-viewer";
import { SearchInput } from "../../common/search-input";

export const SearchFilter = () => {
  const { searchTerm, setSearchTerm } = useMediaViewer();

  return (
    <SearchInput
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search media"
      ariaLabel="Search media"
    />
  );
};

