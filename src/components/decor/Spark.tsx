interface SparkProps {
  className?: string;
  variant?: "three" | "five";
}

function Spark({ className = "", variant = "three" }: SparkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 38"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M24 14V3"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M14 18L7 10"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M34 18L41 10"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {variant === "five" && (
        <>
          <path
            d="M10 28L2 26"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <path
            d="M38 28L46 26"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export default Spark;
