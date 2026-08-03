import type { ButtonHTMLAttributes, ReactNode } from "react";

type ModalActionButtonVariant = "surface" | "accent";

type ModalActionButtonProps = {
  children: ReactNode;
  variant?: ModalActionButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const SURFACE_CLASS =
  "rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition";

const ACCENT_CLASS =
  "rounded-full bg-accent px-3 py-2 text-xs font-semibold text-primary transition";

const ModalActionButton = ({
  children,
  className,
  variant = "surface",
  ...rest
}: ModalActionButtonProps) => {
  const baseClass = variant === "accent" ? ACCENT_CLASS : SURFACE_CLASS;
  const mergedClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <button type="button" className={mergedClass} {...rest}>
      {children}
    </button>
  );
};

export default ModalActionButton;
