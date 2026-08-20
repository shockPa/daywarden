interface DoodleProps {
  className?: string;
  variant?: "loop" | "arch-loop" | "curl" | "squiggle";
}

function Doodle({ className = "", variant = "loop" }: DoodleProps) {
  const paths = {
    loop: "M8 34C18 33 27 27 30 17C32 10 29 6 25 9C20 13 20 24 25 29C31 35 42 34 50 28",

    "arch-loop":
      "M5 29C16 21 27 19 37 23C44 26 47 32 43 35C39 38 34 34 37 29C41 22 50 20 60 23C67 25 72 28 76 27",

    curl: "M6 29C16 21 27 18 35 21C43 24 44 31 39 35C34 38 29 35 30 30C31 24 39 21 47 24C56 28 63 31 72 26",

    squiggle:
      "M5 28C11 21 17 20 22 25C27 30 31 31 36 25C41 19 47 20 52 25C57 30 63 31 69 24",
  };

  return (
    <svg
      className={className}
      viewBox="0 0 80 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={paths[variant]}
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Doodle;
