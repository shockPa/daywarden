import type { EntryTypeDefinition } from "../types/entryType";

export const builtInEntryTypes: EntryTypeDefinition[] = [
  {
    id: "note",
    name: "Note",
    builtIn: true,

    fields: [
      {
        id: "note",
        name: "Note",
        type: "text",
        placeholder: "What did you do today?",
        includeInSummary: false,
        summaryMode: "none",
      },
    ],
  },

  {
    id: "work",
    name: "Work",
    builtIn: true,

    fields: [
      {
        id: "work-time",
        name: "Work",
        type: "time-range",
        includeInSummary: true,
        summaryMode: "duration-from-range",
      },

      {
        id: "actual-work",
        name: "Actual work",
        type: "duration",
        includeInSummary: true,
        summaryMode: "sum",
      },

      {
        id: "note",
        name: "Note",
        type: "text",
        placeholder: "What did you work on?",
        includeInSummary: false,
        summaryMode: "none",
      },
    ],
  },

  {
    id: "shopping-list",
    name: "Shopping List",
    builtIn: true,

    fields: [
      {
        id: "items",
        name: "Items",
        type: "list",
        placeholder: "One item per line",
        includeInSummary: false,
        summaryMode: "none",
      },
    ],
  },

  {
    id: "workout",
    name: "Workout",
    builtIn: true,

    fields: [
      {
        id: "duration",
        name: "Duration",
        type: "duration",
        includeInSummary: true,
        summaryMode: "sum",
      },

      {
        id: "pain",
        name: "Pain",
        type: "scale",
        min: 0,
        max: 100,
        includeInSummary: true,
        summaryMode: "average",
        colorDirection: "higher-is-worse",
      },

      {
        id: "motivation",
        name: "Motivation",
        type: "scale",
        min: 0,
        max: 100,
        includeInSummary: true,
        summaryMode: "average",
        colorDirection: "higher-is-better",
      },

      {
        id: "intensity",
        name: "Intensity",
        type: "scale",
        min: 0,
        max: 100,
        includeInSummary: true,
        summaryMode: "average",
        colorDirection: "neutral",
      },

      {
        id: "note",
        name: "Note",
        type: "text",
        placeholder: "How did the workout go?",
        includeInSummary: false,
        summaryMode: "none",
      },
    ],
  },

  {
    id: "headache",
    name: "Headache",
    builtIn: true,

    fields: [
      {
        id: "pain",
        name: "Pain",
        type: "scale",
        min: 0,
        max: 100,
        includeInSummary: true,
        summaryMode: "average",
        colorDirection: "higher-is-worse",
      },

      {
        id: "duration",
        name: "Duration",
        type: "duration",
        includeInSummary: true,
        summaryMode: "sum",
      },

      {
        id: "note",
        name: "Note",
        type: "text",
        placeholder: "Anything worth noting?",
        includeInSummary: false,
        summaryMode: "none",
      },
    ],
  },
];
