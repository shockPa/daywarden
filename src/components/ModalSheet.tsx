import { useEffect, type ReactNode } from "react";

import { createPortal } from "react-dom";

interface ModalSheetProps {
  open: boolean;

  onClose: () => void;

  children: ReactNode;

  tone?: "default" | "library";

  ariaLabel: string;
}

function ModalSheet({
  open,
  onClose,
  children,
  tone = "default",
  ariaLabel,
}: ModalSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="modal-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={[
          "modal-sheet",
          tone === "library" ? "modal-sheet-library" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          className="modal-sheet-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-sheet-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export default ModalSheet;
