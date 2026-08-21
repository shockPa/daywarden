import type { ReactNode } from "react";

export interface ActivityIconOption {
  id: string;
  label: string;
  body: ReactNode;
}

/**
 * Artwork for a shared 24x24 SVG wrapper:
 *   viewBox="0 0 24 24"
 *   fill="none"
 *   stroke="currentColor"
 *   strokeWidth="1.7"
 *   strokeLinecap="round"
 *   strokeLinejoin="round"
 *
 * Main contours inherit 1.7. Secondary construction lines generally use
 * 1.35-1.5. Fine details / atmosphere use 1.0-1.2 and reduced opacity.
 */
export const activityIconOptions: ActivityIconOption[] = [
  {
    id: "note",
    label: "Note",
    body: (
      <>
        {/* folded paper silhouette */}
        <path d="M6.2 3.3h8.3l3.3 3.3v13.1c0 .6-.5 1-1 1H7.2c-.6 0-1-.4-1-1Z" />
        <path d="M14.5 3.3v3.4h3.3" strokeWidth="1.4" />
        {/* written structure */}
        <path
          d="M9 10h6.1M9 13h6.1M9 16h4.2"
          strokeWidth="1.15"
          opacity="0.62"
        />
        {/* tiny editorial accent */}
        <path
          d="M4.2 7.2 3.1 6.5M4.2 11H2.8"
          strokeWidth="1.05"
          opacity="0.2"
        />
      </>
    ),
  },
  {
    id: "briefcase",
    label: "Work",
    body: (
      <>
        <path d="M4.2 8.5h15.6c.7 0 1.2.5 1.2 1.2v8.5c0 .7-.5 1.2-1.2 1.2H4.2c-.7 0-1.2-.5-1.2-1.2V9.7c0-.7.5-1.2 1.2-1.2Z" />
        <path
          d="M8.7 8.5V6.8c0-1.2.9-2.1 2.1-2.1h2.4c1.2 0 2.1.9 2.1 2.1v1.7"
          strokeWidth="1.45"
        />
        <path
          d="M3.2 12.3c2.5 1.2 5.5 1.8 8.8 1.8s6.3-.6 8.8-1.8"
          strokeWidth="1.35"
          opacity="0.72"
        />
        <rect
          x="10.6"
          y="12.8"
          width="2.8"
          height="2.4"
          rx="0.65"
          strokeWidth="1.15"
        />
        <path d="M7.2 19.4v1M16.8 19.4v1" strokeWidth="1.05" opacity="0.25" />
      </>
    ),
  },
  {
    id: "shopping",
    label: "Shopping",
    body: (
      <>
        {/* structured basket rather than generic cart icon */}
        <path d="M5 8.2h14l-1.2 8.2c-.1.8-.8 1.4-1.6 1.4H7.8c-.8 0-1.5-.6-1.6-1.4Z" />
        <path d="M8.2 8.2 10.5 4.6M15.8 8.2l-2.3-3.6" strokeWidth="1.4" />
        <path
          d="M8.2 11.1v3.8M12 11.1v3.8M15.8 11.1v3.8"
          strokeWidth="1.05"
          opacity="0.45"
        />
        <path d="M6.1 11.1h11.8" strokeWidth="1.15" opacity="0.58" />
        <path d="M4 19.7h4M16 19.7h4" strokeWidth="1.05" opacity="0.18" />
      </>
    ),
  },
  {
    id: "workout",
    label: "Workout",
    body: (
      <>
        <path
          d="M4.8 8.2 3.6 7M19.2 8.2 20.4 7"
          strokeWidth="1.1"
          opacity="0.28"
        />
        <path d="M4 12H2.5M20 12h1.5" strokeWidth="1.1" opacity="0.18" />
        <path d="M7.6 12h8.8" strokeWidth="1.7" />
        <rect x="5.8" y="8.8" width="2.1" height="6.4" rx="0.7" />
        <rect x="16.1" y="8.8" width="2.1" height="6.4" rx="0.7" />
        <rect
          x="3.8"
          y="7.6"
          width="2.2"
          height="8.8"
          rx="0.8"
          strokeWidth="1.45"
        />
        <rect
          x="18"
          y="7.6"
          width="2.2"
          height="8.8"
          rx="0.8"
          strokeWidth="1.45"
        />
        <path d="M4.9 9.3v5.4M19.1 9.3v5.4" strokeWidth="1.05" opacity="0.45" />
        <path
          d="M10 10.9v2.2M11.35 10.9v2.2M12.65 10.9v2.2M14 10.9v2.2"
          strokeWidth="1.05"
          opacity="0.5"
        />
        <path
          d="M6.3 18.6 8.2 17.5M17.7 18.6l-1.9-1.1"
          strokeWidth="1.1"
          opacity="0.22"
        />
      </>
    ),
  },
  {
    id: "headache",
    label: "Headache",
    body: (
      <>
        <path d="M14.9 5.1C12.8 4.2 10.2 4.5 8.5 6 6.9 7.4 6.2 9.4 6.4 11.4c.1 1.4.7 2.4 1.4 3.3l-.6 2.4c-.1.6.3 1.1.9 1.1h2c.3 0 .5.2.5.5v1.5" />
        <path
          d="M14.9 5.1c1.5.8 2.4 2.3 2.5 3.9.1 1.2-.3 2.3-.9 3l1 1c.3.3.1.8-.3.9l-1 .2-.2 1c-.2 1.2-1 1.9-2.2 1.9h-1.3"
          strokeWidth="1.45"
        />
        <path d="M14.3 11.4h.9" strokeWidth="1.05" opacity="0.55" />
        <circle cx="10.7" cy="9.1" r="1.15" strokeWidth="1.35" />
        <circle cx="10.7" cy="9.1" r="2.55" strokeWidth="1.1" opacity="0.38" />
        <path
          d="M10.7 5.1V3.7M7.6 6.1l-1-1M14 6.1l1-1M6.6 9.1H5.1"
          strokeWidth="1.1"
          opacity="0.26"
        />
        <path
          d="M8.8 7.2c.5-.6 1.1-.9 1.9-.9"
          strokeWidth="1.05"
          opacity="0.45"
        />
      </>
    ),
  },
  {
    id: "walk",
    label: "Walk",
    body: (
      <>
        {/* relaxed walking shoe, grounded rather than speedy */}
        <path d="M4.2 14.8c1.6-.5 2.8-1.6 3.6-3.4l1.6-3.6c.3-.7 1.1-.9 1.7-.4l3.1 2.6c1.3 1.1 2.7 1.8 4.3 2.1l1.4.3c1 .2 1.7 1 1.7 2 0 1.2-.9 2-2.4 2.2-4.2.5-9.3.5-14.7.2-1.2-.1-1.8-.6-1.8-1.2 0-.4.5-.7 1.5-.8Z" />
        <path
          d="M5.1 14.7c4.5.5 9.6.5 15.8-.2"
          strokeWidth="1.35"
          opacity="0.72"
        />
        <path
          d="m10.1 9 2 1.7M9.2 10.9l2 1.5M12 10.8l1.4-1.3"
          strokeWidth="1.05"
          opacity="0.58"
        />
        <path
          d="M6.1 19.4c1.2-.4 2.4-.4 3.7 0M14.7 19.5c1.4-.5 2.6-.5 3.8-.1"
          strokeWidth="1.05"
          opacity="0.2"
        />
      </>
    ),
  },
  {
    id: "run",
    label: "Run",
    body: (
      <>
        {/* athletic shoe with a lifted heel and a little motion */}
        <g transform="rotate(-8 12 12)">
          <path d="M4 14.8c1.7-.5 3-1.6 3.7-3.3l1.5-3.8c.3-.8 1.2-1 1.8-.4l3.4 2.9c1.1.9 2.4 1.5 3.8 1.8l1.6.3c1.1.2 1.8 1 1.8 2 0 1.3-1 2.1-2.5 2.3-4.2.5-9.1.4-14.6.1-1.2-.1-1.9-.6-1.9-1.2 0-.3.5-.6 1.4-.7Z" />
          <path
            d="M5 14.7c4.8.5 10.1.4 15.9-.3"
            strokeWidth="1.35"
            opacity="0.72"
          />
          <path
            d="m9.8 9 2.1 1.7M9.1 10.9l2.1 1.6M12 10.8l1.5-1.4"
            strokeWidth="1.05"
            opacity="0.58"
          />
        </g>
        <path
          d="M2.8 10.1h2M2 12.7h2.4M3.1 15.3h1.6"
          strokeWidth="1.05"
          opacity="0.24"
        />
      </>
    ),
  },
  {
    id: "bicycle",
    label: "Bicycle",
    body: (
      <>
        <circle cx="6.2" cy="16.8" r="3.65" />
        <circle cx="18" cy="16.8" r="3.65" />
        <path
          d="m6.2 16.8 3.4-6.2h4.5l3.9 6.2M9.6 10.6l3.2 6.2H6.2M12.8 16.8l2.3-6.2"
          strokeWidth="1.45"
        />
        <path d="M8.5 8.2h3M14.5 8.5h2.7" strokeWidth="1.2" />
        <circle cx="12.8" cy="16.8" r="0.8" strokeWidth="1.1" opacity="0.65" />
        <path d="M3.4 21h4.2M16 21h4" strokeWidth="1.05" opacity="0.18" />
      </>
    ),
  },
  {
    id: "heart",
    label: "Heart",
    body: (
      <>
        {/* anatomical-ish but still geometric heart */}
        <path d="M12 20.1S4.3 15.7 4.3 9.9c0-2.8 1.9-4.8 4.4-4.8 1.5 0 2.7.7 3.3 1.8.6-1.1 1.8-1.8 3.3-1.8 2.5 0 4.4 2 4.4 4.8 0 5.8-7.7 10.2-7.7 10.2Z" />
        <path d="M12 7v3.2M9.7 9.5H14" strokeWidth="1.15" opacity="0.42" />
        <path
          d="M6.2 4.3 5.3 3.4M17.8 4.3l.9-.9"
          strokeWidth="1.05"
          opacity="0.2"
        />
      </>
    ),
  },
  {
    id: "moon",
    label: "Moon",
    body: (
      <>
        <path d="M18.7 15.8A8.1 8.1 0 0 1 8.4 5.1a8.1 8.1 0 1 0 10.3 10.7Z" />
        <path
          d="M16.7 5.1v1.8M15.8 6h1.8M20 8.1v1.3M19.35 8.75h1.3"
          strokeWidth="1.05"
          opacity="0.36"
        />
        <path d="M5.3 19.1c1 .5 2 .8 3.1.9" strokeWidth="1.05" opacity="0.18" />
      </>
    ),
  },
  {
    id: "bed",
    label: "Sleep",
    body: (
      <>
        <path d="M3.5 19.5V9.2M20.5 19.5v-6c0-1.5-1.2-2.7-2.7-2.7H8.3v8.7" />
        <path d="M3.5 15.2h17" strokeWidth="1.45" />
        <path
          d="M6.3 10.8V8.6c0-.8.6-1.4 1.4-1.4h3c1.3 0 2.3 1 2.3 2.3v1.3"
          strokeWidth="1.35"
        />
        <path
          d="M5.1 19.5v1.2M18.9 19.5v1.2"
          strokeWidth="1.05"
          opacity="0.32"
        />
        <path d="M16.4 6.1h2.8l-2.8 3h2.8" strokeWidth="1.05" opacity="0.28" />
      </>
    ),
  },
  {
    id: "book",
    label: "Book",
    body: (
      <>
        <path d="M3.8 5.4h5.4c1.6 0 2.8.8 2.8 2.2v12.2c-.6-1.2-1.7-1.9-3.4-1.9H3.8Z" />
        <path d="M20.2 5.4h-5.4c-1.6 0-2.8.8-2.8 2.2v12.2c.6-1.2 1.7-1.9 3.4-1.9h4.8Z" />
        <path
          d="M6.4 9h3M6.4 12h3M14.7 9h3M14.7 12h3"
          strokeWidth="1.05"
          opacity="0.42"
        />
        <path d="M12 7.6v12.2" strokeWidth="1.2" opacity="0.62" />
      </>
    ),
  },
  {
    id: "computer",
    label: "Computer",
    body: (
      <>
        <rect x="3.1" y="4.3" width="17.8" height="12.3" rx="1.8" />
        <path d="M3.4 13.6h17.2" strokeWidth="1.2" opacity="0.42" />
        <path
          d="M9 20.1h6M10.3 16.7l-.7 3.4M13.7 16.7l.7 3.4"
          strokeWidth="1.4"
        />
        {/* subtle UI construction */}
        <path
          d="M6.2 7.1h4.3M6.2 9.4h2.7M14.7 7.2h2.8v2.7h-2.8Z"
          strokeWidth="1.05"
          opacity="0.34"
        />
      </>
    ),
  },
  {
    id: "phone",
    label: "Phone",
    body: (
      <>
        <rect x="7.1" y="2.6" width="9.8" height="18.8" rx="2.1" />
        <path d="M10.2 5.2h3.6" strokeWidth="1.1" opacity="0.55" />
        <path d="M8.2 7.2h7.6v10.5H8.2" strokeWidth="1.05" opacity="0.32" />
        <circle cx="12" cy="19.4" r="0.65" strokeWidth="1.05" />
        <path
          d="M18.8 7.4 20 6.5M18.9 10.1h1.5"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
  {
    id: "coffee",
    label: "Coffee",
    body: (
      <>
        <path d="M5 9.3h11.5v5.2c0 2.7-2.1 4.8-4.8 4.8H9.8A4.8 4.8 0 0 1 5 14.5Z" />
        <path d="M16.5 10.4h1.3a2.9 2.9 0 0 1 0 5.8h-1.7" strokeWidth="1.45" />
        <path
          d="M7.9 5.1c0 1.1 1 1.3 1 2.4M11.7 4c0 1.3 1.1 1.6 1.1 3"
          strokeWidth="1.15"
          opacity="0.6"
        />
        <path d="M5.8 20.7h11.4" strokeWidth="1.05" opacity="0.2" />
        <path d="M7.2 12.1h7.1" strokeWidth="1.05" opacity="0.28" />
      </>
    ),
  },
  {
    id: "food",
    label: "Food",
    body: (
      <>
        {/* apple with faceted interior detail */}
        <path d="M12 7.5c-1.1-1.2-2.6-1.8-4.1-1.4-2.4.6-3.5 3.2-2.8 6.4.8 3.7 3.5 7 5.5 7 .7 0 1-.4 1.4-.4s.7.4 1.4.4c2 0 4.7-3.3 5.5-7 .7-3.2-.4-5.8-2.8-6.4-1.5-.4-3 .2-4.1 1.4Z" />
        <path d="M12 7.5c0-2.1.8-3.6 2.5-4.6" strokeWidth="1.4" />
        <path
          d="M13.7 4.4c1.7-.4 3 .1 3.7 1.2-1.6.7-2.9.6-4-.2"
          strokeWidth="1.15"
          opacity="0.58"
        />
        <path
          d="M8.2 10.2c-.5 1.2-.5 2.5-.1 3.7"
          strokeWidth="1.05"
          opacity="0.28"
        />
      </>
    ),
  },
  {
    id: "water",
    label: "Water",
    body: (
      <>
        <path d="M7.1 4.2h9.8l-1.2 14.6c-.1 1.1-1 1.9-2.1 1.9h-3.2c-1.1 0-2-.8-2.1-1.9Z" />
        <path
          d="M7.7 11.2c2.4.8 4.6-.7 8.6 0"
          strokeWidth="1.3"
          opacity="0.7"
        />
        <path
          d="M9 14.3c1.8.5 3.8-.5 6.7.1"
          strokeWidth="1.05"
          opacity="0.34"
        />
        <path
          d="M18.3 6.2c.8.7 1.2 1.5 1.2 2.3M5.5 17.3c-.6.5-1 .9-1.4 1.5"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
  {
    id: "diamond",
    label: "Diamond",
    body: (
      <>
        <path d="M6.2 5.4h11.6l3 4.5L12 20.2 3.2 9.9Z" />
        <path
          d="m6.2 5.4 2.4 4.5L12 5.4l3.4 4.5 2.4-4.5M3.2 9.9h17.6M8.6 9.9 12 20.2l3.4-10.3"
          strokeWidth="1.3"
          opacity="0.72"
        />
        <path
          d="M12 2.6v1.2M20.4 13.6h1.2M2.4 13.6h1.2"
          strokeWidth="1.05"
          opacity="0.22"
        />
      </>
    ),
  },
  {
    id: "medication",
    label: "Medication",
    body: (
      <>
        <g transform="rotate(-42 12 12)">
          <rect x="8" y="3.8" width="8" height="16.4" rx="4" />
          <path d="M8 12h8" strokeWidth="1.45" />
          <path
            d="M10.2 6.4h3.6M10.2 17.6h3.6"
            strokeWidth="1.05"
            opacity="0.35"
          />
        </g>
        <path
          d="M4.1 7.1 3 6M19.9 17l1.1 1.1"
          strokeWidth="1.05"
          opacity="0.2"
        />
      </>
    ),
  },
  {
    id: "home",
    label: "Home",
    body: (
      <>
        <path d="m3.3 11.2 8.7-7.3 8.7 7.3" />
        <path d="M5.7 9.6v10.2h12.6V9.6" />
        <path d="M9.5 19.8v-5.7h5v5.7" strokeWidth="1.4" />
        <path
          d="M8.3 11.4h2.4v2.3H8.3ZM14.1 11.4h2.1"
          strokeWidth="1.05"
          opacity="0.38"
        />
        <path d="M3.5 21.3h4M16.6 21.3h3.9" strokeWidth="1.05" opacity="0.18" />
      </>
    ),
  },
  {
    id: "people",
    label: "People",
    body: (
      <>
        <circle cx="9.2" cy="8.2" r="2.6" />
        <circle cx="16.4" cy="9.3" r="2.05" strokeWidth="1.45" />
        <path d="M4.2 19c.1-3.2 2.1-5.3 5-5.3s4.9 2.1 5 5.3" />
        <path
          d="M13.3 14.7c.8-.8 1.8-1.2 3.1-1.2 2.3 0 3.9 1.7 4 4.2"
          strokeWidth="1.4"
        />
        <path
          d="M6.1 5.1 5.2 4.2M18.7 6.2l1-.8"
          strokeWidth="1.05"
          opacity="0.2"
        />
        <path
          d="M3.4 20.6h11.7M16.5 19.3h4.6"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
  {
    id: "money",
    label: "Money",
    body: (
      <>
        <rect x="3.1" y="5.7" width="17.8" height="12.6" rx="1.8" />
        <circle cx="12" cy="12" r="3.1" strokeWidth="1.45" />
        <path
          d="M5.5 8.2c1.3 0 2.2-.7 2.4-1.5M18.5 15.8c-1.3 0-2.2.7-2.4 1.5"
          strokeWidth="1.05"
          opacity="0.45"
        />
        <path
          d="M12 9.7v4.6M13.3 10.4c-.4-.4-.8-.6-1.4-.6-.8 0-1.3.4-1.3 1s.5.9 1.4 1.1c.9.2 1.4.5 1.4 1.2s-.6 1.1-1.5 1.1c-.6 0-1.1-.2-1.5-.6"
          strokeWidth="1.0"
          opacity="0.56"
        />
      </>
    ),
  },
  {
    id: "time",
    label: "Time",
    body: (
      <>
        <circle cx="12" cy="12.4" r="7.8" />
        <path d="M12 7.3v5.1l3.7 2.1" strokeWidth="1.45" />
        <path
          d="M12 2.4v1.2M21.2 12.4H20M4 12.4H2.8M18.5 5.9l-.8.8"
          strokeWidth="1.05"
          opacity="0.3"
        />
        <path
          d="M8.5 20.9c1.1.4 2.3.6 3.5.6"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
  {
    id: "star",
    label: "Star",
    body: (
      <>
        <path d="m12 3.2 2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9Z" />
        <path
          d="M12 6.2v7.2M9.4 9.1 12 13.4l2.6-4.3"
          strokeWidth="1.05"
          opacity="0.34"
        />
        <path
          d="M20.2 4.3v1.5M19.45 5.05h1.5"
          strokeWidth="1.05"
          opacity="0.22"
        />
      </>
    ),
  },
  {
    id: "check",
    label: "Check",
    body: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m7.8 12.1 2.7 2.8 5.9-6.1" />
        <path
          d="M5.5 5.8 4.4 4.7M19.6 7.1l1.2-.8M19.6 17.2l1.1.7"
          strokeWidth="1.05"
          opacity="0.2"
        />
        <path
          d="M8.4 18.9c1.1.5 2.3.7 3.6.7"
          strokeWidth="1.05"
          opacity="0.25"
        />
      </>
    ),
  },
  {
    id: "mood",
    label: "Mood",
    body: (
      <>
        <circle cx="12" cy="12" r="8.1" />
        <path
          d="M8.6 10.1c.4-.5.9-.8 1.5-.8M13.9 9.3c.6 0 1.1.3 1.5.8"
          strokeWidth="1.15"
        />
        <path
          d="M8.6 14.1c.9 1.4 2 2.1 3.4 2.1s2.5-.7 3.4-2.1"
          strokeWidth="1.45"
        />
        {/* geometric cheek / expression construction */}
        <path d="M6.5 12.7h1M16.5 12.7h1" strokeWidth="1.05" opacity="0.28" />
        <path
          d="M5.3 5.5 4.2 4.4M18.7 5.5l1.1-1.1"
          strokeWidth="1.05"
          opacity="0.2"
        />
      </>
    ),
  },
  {
    id: "meditation",
    label: "Meditation",
    body: (
      <>
        <path
          d="M7.7 6.15A6.3 6.3 0 0 1 12 4.45a6.3 6.3 0 0 1 4.3 1.7"
          strokeWidth="1.1"
          opacity="0.28"
        />
        <circle cx="12" cy="7.2" r="1.55" />
        <path d="M11.3 8.65v1M12.7 8.65v1" strokeWidth="1.1" opacity="0.65" />
        <path d="M8.75 11.2Q12 8.95 15.25 11.2" />
        <path d="M10.35 10.45 12 15.1l1.65-4.65" />
        <path d="M9.1 11.15 7.2 14.45 10 15.85M14.9 11.15l1.9 3.3-2.8 1.4" />
        <path d="M10 15.85Q12 17.05 14 15.85" strokeWidth="1.25" />
        <path
          d="M11.15 16.25Q12 15.55 12.85 16.25"
          strokeWidth="1.05"
          opacity="0.65"
        />
        <path d="M12 16.7c-2.3 0-4.3.85-5.85 2.75M12 16.7c2.3 0 4.3.85 5.85 2.75" />
        <path
          d="M6.15 19.45Q8.6 20.5 12 18.25M17.85 19.45Q15.4 20.5 12 18.25"
          strokeWidth="1.45"
        />
        <path
          d="M12 21.05c-1.35-.65-2.3-1.5-2.75-2.5 1.15.15 2.1.65 2.75 1.45.65-.8 1.6-1.3 2.75-1.45-.45 1-1.4 1.85-2.75 2.5Z"
          strokeWidth="1.2"
        />
        <path d="M8.15 21.2h7.7" strokeWidth="1.05" opacity="0.25" />
      </>
    ),
  },
  {
    id: "work",
    label: "Work",
    body: (
      <>
        {/* desk monitor with deliberately restrained workspace detail */}
        <rect x="3.5" y="4.4" width="17" height="11.6" rx="1.7" />
        <path d="M8.3 20h7.4M10 16l-.8 4M14 16l.8 4" strokeWidth="1.4" />
        <path
          d="M6.4 7.2h4.3M6.4 9.6h7.1M15.9 7.2h1.7v2.4h-1.7"
          strokeWidth="1.05"
          opacity="0.38"
        />
        <path d="M2.6 18.2h3M18.5 18.2h2.9" strokeWidth="1.05" opacity="0.18" />
      </>
    ),
  },
  {
    id: "sleep",
    label: "Sleep",
    body: (
      <>
        {/* crescent remains the hero, with very restrained night detail */}
        <path d="M17.7 15.7A7.6 7.6 0 0 1 8.2 5.6a7.7 7.7 0 1 0 9.5 10.1Z" />
        <path
          d="M17.6 5.1h2.8l-2.8 3h2.8M15.8 8.7H18l-2.2 2.4H18"
          strokeWidth="1.1"
          opacity="0.42"
        />
        <path
          d="M5.4 19.3c1 .5 2.1.8 3.2.9M18.1 18.8l1.2.5"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
  {
    id: "journal",
    label: "Journal",
    body: (
      <>
        <g transform="rotate(-5 11.5 12)">
          <path d="M5.1 3.4h11c1.1 0 1.9.8 1.9 1.9v14.1c0 .7-.6 1.2-1.2 1.2H5.1Z" />
          <path d="M7.5 3.4v17.2" strokeWidth="1.4" opacity="0.72" />
          <path
            d="M10.1 7.3h5.3M10.1 10.2h4.4M10.1 13.1h5.3M10.1 16h3.6"
            strokeWidth="1.05"
            opacity="0.48"
          />
          <path
            d="M14.8 3.4v5l-1.6-1-1.6 1v-5"
            strokeWidth="1.15"
            opacity="0.65"
          />
        </g>
        <path
          d="M18.6 17.3 21 19.7M19.8 16.1l2.4 2.4"
          strokeWidth="1.15"
          opacity="0.28"
        />
      </>
    ),
  },
  {
    id: "yoga",
    label: "Yoga",
    body: (
      <>
        {/* standing tree pose: distinct from seated meditation */}
        <circle cx="12" cy="5.2" r="1.55" />
        <path d="M12 6.8v6.2" />
        <path d="M12 9.2 8.3 7.3M12 9.2l3.7-1.9" strokeWidth="1.45" />
        <path d="M8.3 7.3 6.5 5.5M15.7 7.3l1.8-1.8" strokeWidth="1.25" />
        <path d="M12 13v7.5" />
        <path d="M12 13.4c-1.4 1.5-2.4 2.8-2.9 4l2.9 1.2" strokeWidth="1.45" />
        <path d="M12 13.4c1.4 1.5 2.4 2.8 2.9 4L12 18.6" strokeWidth="1.45" />
        <path d="M7.7 21h8.6" strokeWidth="1.05" opacity="0.28" />
        <path
          d="M5 10.2 3.9 11.3M19 10.2l1.1 1.1"
          strokeWidth="1.05"
          opacity="0.18"
        />
      </>
    ),
  },
];
