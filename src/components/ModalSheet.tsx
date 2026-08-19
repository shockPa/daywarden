import {
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

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
  const dialogRef =
    useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  function handleBackdropMouseDown(
    event: MouseEvent<HTMLDialogElement>,
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal-sheet-backdrop"
      aria-label={ariaLabel}
      onCancel={(event) => {
        /*
         * Keep React as the source of truth
         * for whether the modal is open.
         */
        event.preventDefault();

        onClose();
      }}
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        className={[
          "modal-sheet",
          tone === "library"
            ? "modal-sheet-library"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className="modal-sheet-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-sheet-body">
          {children}
        </div>
      </section>
    </dialog>,
    document.body,
  );
}

export default ModalSheet;
