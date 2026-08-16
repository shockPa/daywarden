import type { EntryTypeSummary } from "../utils/summary";

interface PeriodSummaryProps {
  summaries: EntryTypeSummary[];
}

function PeriodSummary({ summaries }: PeriodSummaryProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="period-summary">
      <h3>Summary</h3>

      <div className="period-summary-groups">
        {summaries.map((summary) => (
          <section className="period-summary-group" key={summary.entryTypeId}>
            <div className="period-summary-title">
              <strong>{summary.entryTypeName}</strong>

              <span>
                {summary.entryCount}{" "}
                {summary.entryCount === 1 ? "entry" : "entries"}
              </span>
            </div>

            {summary.fields.length > 0 && (
              <div className="period-summary-fields">
                {summary.fields.map((field) => (
                  <div className="summary-row" key={field.fieldId}>
                    <span>{field.fieldName}</span>

                    <strong>{field.displayValue}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

export default PeriodSummary;
