type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel,
}: SearchInputProps) => {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-surface bg-surface-80 px-4">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 shrink-0 text-muted"
      >
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="m16 16 4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="min-w-0 flex-1 bg-transparent py-3 text-sm text-primary outline-none placeholder:text-muted"
      />
      {value !== "" && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="rounded-full p-1 text-muted transition hover:bg-surface-strong hover:text-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="m7 7 10 10M17 7 7 17"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </label>
  );
};
