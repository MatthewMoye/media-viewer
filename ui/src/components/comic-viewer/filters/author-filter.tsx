import { useComicViewer } from "../context/use-comic-viewer";
import { ChoiceFilter } from "./choice-filter";

export const AuthorFilter = () => {
  const {
    allAuthors,
    visibleAuthors,
    authorSearch,
    selectedAuthor,
    setAuthorSearch,
    setSelectedAuthor,
  } = useComicViewer();

  return (
    <ChoiceFilter
      legend="Author"
      searchValue={authorSearch}
      searchPlaceholder={`Search ${allAuthors.length} authors...`}
      searchAriaLabel="Search authors"
      options={visibleAuthors}
      selectedValue={selectedAuthor}
      emptyMessage="No authors match."
      onSearchChange={setAuthorSearch}
      onSelect={setSelectedAuthor}
    />
  );
};
