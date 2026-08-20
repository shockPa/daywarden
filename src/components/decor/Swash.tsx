interface SwashProps {
  className?: string;
  variant?: "soft" | "short";
}

function Swash({ className = "", variant = "soft" }: SwashProps) {
  const path =
    variant === "short"
      ? "M5 14C27 8 53 7 75 11"
      : "M4 17C33 8 69 7 112 13C126 15 137 14 146 11";

  return (
    <svg
      className={className}
      viewBox="0 0 150 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Swash;
