import { useComicViewer } from "../context/use-comic-viewer";
import { ChoiceFilter } from "./choice-filter";

export const TagFilter = () => {
  const {
    allTags,
    visibleTags,
    tagSearch,
    selectedTag,
    setTagSearch,
    setSelectedTag,
  } = useComicViewer();

  return (
    <ChoiceFilter
      legend="Tag"
      searchValue={tagSearch}
      searchPlaceholder={`Search ${allTags.length} tags…`}
      searchAriaLabel="Search tags"
      options={visibleTags}
      selectedValue={selectedTag}
      emptyMessage="No tags match."
      onSearchChange={setTagSearch}
      onSelect={setSelectedTag}
    />
  );
};
