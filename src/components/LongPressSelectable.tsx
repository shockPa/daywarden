import {
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

interface LongPressSelectableProps {
  selected: boolean;

  selectionMode: boolean;

  disabled?: boolean;

  onEnterSelection: () => void;

  onToggleSelection: () => void;

  children: ReactNode;
}

const LONG_PRESS_MS = 550;

function LongPressSelectable({
  selected,
  selectionMode,
  disabled = false,
  onEnterSelection,
  onToggleSelection,
  children,
}: LongPressSelectableProps) {
  const timerRef = useRef<number | null>(null);

  const longPressTriggered = useRef(false);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);

      timerRef.current = null;
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || selectionMode) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Element &&
      target.closest("button, input, select, textarea, a")
    ) {
      return;
    }

    longPressTriggered.current = false;

    timerRef.current = window.setTimeout(() => {
      longPressTriggered.current = true;

      onEnterSelection();
    }, LONG_PRESS_MS);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (longPressTriggered.current) {
      event.preventDefault();

      event.stopPropagation();

      longPressTriggered.current = false;

      return;
    }

    if (selectionMode) {
      event.preventDefault();

      event.stopPropagation();

      onToggleSelection();
    }
  }

  return (
    <div
      className={[
        "long-press-selectable",

        selected ? "selected" : "",

        selectionMode ? "selection-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}

export default LongPressSelectable;
