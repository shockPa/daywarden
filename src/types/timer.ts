export interface ActiveTimer {
  id: string;

  entryTypeId: string;
  entryTypeName: string;

  /*
   * The timer field this active
   * timer belongs to.
   */
  fieldId: string;

  startedAt: string;
}
