import { activityIconOptions } from "./activityIconRegistry";

interface ActivityIconProps {
  iconId: string;
  className?: string;
}

function ActivityIcon({ iconId, className }: ActivityIconProps) {
  const definition = activityIconOptions.find((icon) => icon.id === iconId);

  if (!definition) {
    return null;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {definition.body}
    </svg>
  );
}

export default ActivityIcon;
