import { useEffect, useState } from "react";
import "./App.css";

import type { ActivityType, DaywardenEntry } from "./types/entry";

import { addEntry, getEntries } from "./data/entryStorage";

const activityOptions: {
  value: ActivityType;
  label: string;
}[] = [
  { value: "work", label: "Work" },
  { value: "workout", label: "Workout" },
  { value: "light-movement", label: "Light movement" },
  { value: "break", label: "Break" },
];

function App() {
  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<ActivityType[]>([]);

  const [pain, setPain] = useState(0);
  const [painLocation, setPainLocation] = useState("");

  const [motivation, setMotivation] = useState(50);
  const [intensity, setIntensity] = useState(50);

  const [entries, setEntries] = useState<DaywardenEntry[]>([]);

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  useEffect(() => {
    async function loadEntries() {
      const savedEntries = await getEntries();
      setEntries(savedEntries);
    }

    loadEntries();
  }, []);

  function toggleActivity(activity: ActivityType) {
    setActivities((currentActivities) => {
      if (currentActivities.includes(activity)) {
        return currentActivities.filter((item) => item !== activity);
      }

      return [...currentActivities, activity];
    });
  }

  async function handleSave() {
    const entry: DaywardenEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),

      note: note.trim(),
      activities,

      pain,
      painLocation: painLocation.trim(),

      motivation,
      intensity,

      tags: [],
      bookmarked: false,
    };

    const updatedEntries = await addEntry(entry);

    setEntries(updatedEntries);

    setNote("");
    setActivities([]);
    setPain(0);
    setPainLocation("");
    setMotivation(50);
    setIntensity(50);
  }

  const todaysEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);

    return entryDate.toDateString() === new Date().toDateString();
  });

  return (
    <main className="app">
      <header className="header">
        <p className="app-name">Daywarden</p>
        <p className="date">{today}</p>
        <h1>What did you do today?</h1>
      </header>

      <section className="card">
        <textarea
          className="note"
          placeholder="Write something..."
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <h2>Activity</h2>

        <div className="activities">
          {activityOptions.map((activity) => {
            const selected = activities.includes(activity.value);

            return (
              <button
                key={activity.value}
                type="button"
                className={selected ? "selected" : ""}
                onClick={() => toggleActivity(activity.value)}
              >
                {activity.label}
              </button>
            );
          })}
        </div>

        <div className="measurement">
          <div className="measurement-heading">
            <label htmlFor="pain">Pain</label>
            <strong>{pain}</strong>
          </div>

          <input
            id="pain"
            type="range"
            min="0"
            max="100"
            value={pain}
            onChange={(event) => setPain(Number(event.target.value))}
          />

          <input
            className="text-input"
            type="text"
            placeholder="Where is the pain? (optional)"
            value={painLocation}
            onChange={(event) => setPainLocation(event.target.value)}
          />
        </div>

        <div className="measurement">
          <div className="measurement-heading">
            <label htmlFor="motivation">Motivation</label>
            <strong>{motivation}</strong>
          </div>

          <input
            id="motivation"
            type="range"
            min="0"
            max="100"
            value={motivation}
            onChange={(event) => setMotivation(Number(event.target.value))}
          />
        </div>

        <div className="measurement">
          <div className="measurement-heading">
            <label htmlFor="intensity">Intensity</label>
            <strong>{intensity}</strong>
          </div>

          <input
            id="intensity"
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
          />
        </div>

        <button className="save" type="button" onClick={handleSave}>
          Save entry
        </button>
      </section>

      <section className="today-entries">
        <h2>Today</h2>

        {todaysEntries.length === 0 ? (
          <p className="empty-state">Nothing recorded yet today.</p>
        ) : (
          todaysEntries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              <div className="entry-time">
                {new Intl.DateTimeFormat("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(entry.createdAt))}
              </div>

              {entry.activities.length > 0 && (
                <div className="entry-activities">
                  {entry.activities
                    .map((activity) => {
                      return (
                        activityOptions.find(
                          (option) => option.value === activity,
                        )?.label ?? activity
                      );
                    })
                    .join(" · ")}
                </div>
              )}

              {entry.note && <p className="entry-note">{entry.note}</p>}

              <div className="entry-metrics">
                <span>Pain {entry.pain}</span>
                <span>Motivation {entry.motivation}</span>
                <span>Intensity {entry.intensity}</span>
              </div>

              {entry.painLocation && (
                <p className="pain-location">
                  Pain location: {entry.painLocation}
                </p>
              )}
            </article>
          ))
        )}
      </section>

      <nav className="navigation">
        <button className="nav-active">Today</button>
        <button>Calendar</button>
        <button>Log</button>
        <button>Search</button>
      </nav>
    </main>
  );
}

export default App;
