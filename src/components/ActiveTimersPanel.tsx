import type { ActiveTimer } from "../types/timer";

interface ActiveTimersPanelProps {
  timers: ActiveTimer[];

  onStop: (timer: ActiveTimer) => void;

  onStopAll: () => void;
}

function formatStartTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",

    minute: "2-digit",
  }).format(new Date(value));
}

function ActiveTimersPanel({
  timers,
  onStop,
  onStopAll,
}: ActiveTimersPanelProps) {
  if (timers.length === 0) {
    return null;
  }

  return (
    <section className="active-timers">
      <div className="active-timers-heading">
        <strong>
          {timers.length === 1
            ? "Timer running"
            : `${timers.length} timers running`}
        </strong>

        {timers.length > 1 && (
          <button type="button" className="stop-all-timers" onClick={onStopAll}>
            Stop timers
          </button>
        )}
      </div>

      <div className="active-timer-list">
        {timers.map((timer) => (
          <div key={timer.id} className="active-timer-row">
            <div>
              <strong>⏱ {timer.entryTypeName}</strong>

              <span>Started {formatStartTime(timer.startedAt)}</span>
            </div>

            <button type="button" onClick={() => onStop(timer)}>
              Stop
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ActiveTimersPanel;
