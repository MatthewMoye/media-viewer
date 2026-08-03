import { SearchInput } from "../../common/search-input";

type ChoiceFilterProps<T extends string> = {
  legend: string;
  searchValue: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  options: [string, number][];
  selectedValue: T | null;
  emptyMessage: string;
  onSearchChange: (value: string) => void;
  onSelect: (value: T | null) => void;
  valueLabel?: (value: string) => string;
};

export const ChoiceFilter = <T extends string>({
  legend,
  searchValue,
  searchPlaceholder,
  searchAriaLabel,
  options,
  selectedValue,
  emptyMessage,
  onSearchChange,
  onSelect,
  valueLabel = (value) => value,
}: ChoiceFilterProps<T>) => {
  return (
    <fieldset className="w-full min-w-0 overflow-hidden">
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {legend}
      </legend>

      <div className="mb-3 w-full min-w-0">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          ariaLabel={searchAriaLabel}
        />
      </div>

      <div className="flex max-h-48 w-full min-w-0 flex-wrap gap-2 overflow-y-auto overflow-x-hidden">
        {!searchValue && (
          <button
            type="button"
            aria-pressed={selectedValue === null}
            onClick={() => onSelect(null)}
            className={`max-w-full rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedValue === null
                ? "bg-accent text-primary shadow-lg shadow-accent"
                : "bg-surface-strong text-primary hover:border-accent"
            }`}
          >
            All
          </button>
        )}
        {options.map(([option, count]) => {
          const optionValue = option as T;
          const isSelected = selectedValue === optionValue;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(optionValue)}
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? "bg-accent text-primary shadow-lg shadow-accent"
                  : "bg-surface-strong text-primary hover:border-accent"
              }`}
            >
              <span className="min-w-0 truncate">{valueLabel(option)}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isSelected ? "bg-white/20" : "bg-surface-80"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {options.length === 0 && <p className="text-sm text-muted">{emptyMessage}</p>}
      </div>
    </fieldset>
  );
};
