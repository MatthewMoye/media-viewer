type RandomizeButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export const RandomizeButton = ({
  onClick,
  label = "Randomize",
  className = "",
}: RandomizeButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border border-surface bg-surface-strong px-4 py-2 text-sm font-medium text-primary transition hover:border-accent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
};
