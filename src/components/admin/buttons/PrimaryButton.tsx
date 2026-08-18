import { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="
        inline-flex
        items-center
        justify-center
        rounded-xl
        bg-blue-900
        px-5
        py-3
        text-sm
        font-semibold
        text-white
        shadow-md
        transition-all
        duration-200
        hover:bg-blue-800
        hover:shadow-lg
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {children}
    </button>
  );
}