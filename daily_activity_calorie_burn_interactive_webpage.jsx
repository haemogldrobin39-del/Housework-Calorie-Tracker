import React, { useMemo, useState } from "react";

// Daily Activity Calorie Calculator (single-file React component)
// Styling: TailwindCSS. No external state. Ready to drop into any React app.
// Author: ChatGPT

// ---------------------------
// Data: kcal/hour at 50kg, 60kg, 70kg
// ---------------------------
const ACTIVITIES = [
  { key: "sweeping", label: "Sweeping / Mopping", kcalByWeight: { 50: 165, 60: 198, 70: 231 } },
  { key: "vacuuming", label: "Vacuuming", kcalByWeight: { 50: 175, 60: 210, 70: 245 } },
  { key: "wash_clothes", label: "Washing clothes by hand", kcalByWeight: { 50: 175, 60: 210, 70: 245 } },
  { key: "wash_dishes", label: "Washing dishes", kcalByWeight: { 50: 115, 60: 138, 70: 161 } },
  { key: "ironing", label: "Ironing clothes", kcalByWeight: { 50: 90, 60: 108, 70: 126 } },
  { key: "cooking", label: "Cooking / food prep", kcalByWeight: { 50: 100, 60: 120, 70: 140 } },
  { key: "groceries_upstairs", label: "Carrying groceries (upstairs)", kcalByWeight: { 50: 225, 60: 270, 70: 315 } },
  { key: "making_beds", label: "Making beds / tidying rooms", kcalByWeight: { 50: 125, 60: 150, 70: 175 } },
  { key: "childcare_light", label: "Childcare (bathing, feeding, light)", kcalByWeight: { 50: 125, 60: 150, 70: 175 } },
  { key: "window_cleaning", label: "Window cleaning / heavy scrubbing", kcalByWeight: { 50: 175, 60: 210, 70: 245 } },
  { key: "gardening_light", label: "Gardening (light)", kcalByWeight: { 50: 175, 60: 210, 70: 245 } },
  { key: "gardening_vigorous", label: "Gardening (digging, vigorous)", kcalByWeight: { 50: 250, 60: 300, 70: 350 } },
];

const SEX_ACTIVITY_RANGES = {
  Women: {
    Sedentary: { daily: [1800, 2000], weekly: [12600, 14000] },
    Moderate: { daily: [2000, 2200], weekly: [14000, 15400] },
    High: { daily: [2400, 2600], weekly: [16800, 18200] },
  },
  Men: {
    Sedentary: { daily: [2000, 2200], weekly: [14000, 15400] },
    Moderate: { daily: [2400, 2700], weekly: [16800, 18900] },
    High: { daily: [2800, 3000], weekly: [19600, 21000] },
  },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Linear interpolation for kcal/hour vs body weight using the 50–60–70 kg anchors.
function kcalPerHourForWeight(weightKg, kcalByWeight) {
  const w = weightKg;
  const k50 = kcalByWeight[50];
  const k60 = kcalByWeight[60];
  const k70 = kcalByWeight[70];

  if (w <= 50) {
    // Extrapolate below 50 using 50–60 slope
    const slope = (k60 - k50) / 10;
    return k50 + slope * (w - 50);
  } else if (w <= 60) {
    const slope = (k60 - k50) / 10;
    return k50 + slope * (w - 50);
  } else if (w <= 70) {
    const slope = (k70 - k60) / 10;
    return k60 + slope * (w - 60);
  } else {
    // Extrapolate above 70 using 60–70 slope
    const slope = (k70 - k60) / 10;
    return k70 + slope * (w - 70);
  }
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-lg bg-white/90 dark:bg-zinc-900/70 backdrop-blur p-6 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {hint ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

export default function DailyActivityCalorieCalculator() {
  const [weight, setWeight] = useState(60);
  const [sex, setSex] = useState("Women");
  const [activityLevel, setActivityLevel] = useState("Sedentary");

  const [selections, setSelections] = useState(() => {
    // Map key -> { checked: boolean, minutes: number }
    const init = {};
    for (const a of ACTIVITIES) init[a.key] = { checked: false, minutes: 60 };
    return init;
  });

  const totals = useMemo(() => {
    let totalKcal = 0;
    const perActivity = [];

    for (const a of ACTIVITIES) {
      const s = selections[a.key];
      if (!s?.checked) continue;
      const kcalPerHour = kcalPerHourForWeight(Number(weight) || 0, a.kcalByWeight);
      const kcal = (kcalPerHour * (Number(s.minutes) || 0)) / 60;
      totalKcal += kcal;
      perActivity.push({ key: a.key, label: a.label, kcal: Math.max(0, kcal) });
    }

    return { totalKcal, perActivity };
  }, [selections, weight]);

  const baseline = SEX_ACTIVITY_RANGES[sex][activityLevel];

  function toggleActivity(key) {
    setSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked },
    }));
  }

  function setMinutes(key, minutes) {
    const m = clamp(Number(minutes) || 0, 0, 720);
    setSelections((prev) => ({ ...prev, [key]: { ...prev[key], minutes: m } }));
  }

  function resetAll() {
    setSelections(() => {
      const init = {};
      for (const a of ACTIVITIES) init[a.key] = { checked: false, minutes: 60 };
      return init;
    });
    setWeight(60);
    setSex("Women");
    setActivityLevel("Sedentary");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Daily Activity Calorie Burn</h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2">
            Tick the activities you performed today, enter minutes, and get an estimated total calories burned.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: inputs */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm mb-1">Body weight (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={30}
                    max={200}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Women</option>
                    <option>Men</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">General activity level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Sedentary</option>
                    <option>Moderate</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">Household & Gardening Activities</h2>
              <div className="space-y-3">
                {ACTIVITIES.map((a) => {
                  const sel = selections[a.key];
                  const kcalHour = kcalPerHourForWeight(Number(weight) || 0, a.kcalByWeight);
                  return (
                    <div key={a.key} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-7 flex items-center gap-3">
                        <input
                          id={`cb-${a.key}`}
                          type="checkbox"
                          checked={!!sel?.checked}
                          onChange={() => toggleActivity(a.key)}
                          className="size-5 rounded-md border-zinc-300 dark:border-zinc-700"
                        />
                        <label htmlFor={`cb-${a.key}`} className="text-sm sm:text-base cursor-pointer">
                          {a.label}
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-500">kcal/hr (at your weight)</div>
                        <div className="font-medium">{Math.round(kcalHour)}</div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-zinc-500 mb-1">Minutes</label>
                        <input
                          type="number"
                          min={0}
                          max={720}
                          disabled={!sel?.checked}
                          value={sel?.minutes ?? 0}
                          onChange={(e) => setMinutes(a.key, e.target.value)}
                          className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            sel?.checked ? "border-zinc-300 dark:border-zinc-700" : "border-zinc-200 dark:border-zinc-800 opacity-60"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={resetAll}
                  className="rounded-2xl px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
                >
                  Reset
                </button>
              </div>
            </Card>
          </div>

          {/* Right column: results */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-semibold mb-3">Your Results</h2>
              <div className="grid grid-cols-1 gap-4">
                <Stat label="Total calories burned (today)" value={`${Math.round(totals.totalKcal)} kcal`} />
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Estimated from selected activities and minutes, scaled to your body weight via linear interpolation of provided kcal/hr values.
                </div>
              </div>

              {totals.perActivity.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Breakdown</h3>
                  <ul className="space-y-1 text-sm">
                    {totals.perActivity.map((x) => (
                      <li key={x.key} className="flex justify-between gap-2">
                        <span className="truncate">{x.label}</span>
                        <span className="tabular-nums">{Math.round(x.kcal)} kcal</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">Reference daily burn ranges</h2>
              <div className="text-sm">
                <div className="mb-2">
                  <div className="text-zinc-500">
                    Selected: <span className="font-medium">{sex}</span> · <span className="font-medium">{activityLevel}</span>
                  </div>
                  <div className="mt-1">
                    Daily: <span className="font-medium">{baseline.daily[0]}–{baseline.daily[1]} kcal</span>
                  </div>
                  <div>
                    Weekly: <span className="font-medium">{baseline.weekly[0]}–{baseline.weekly[1]} kcal</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  These broad ranges are from your provided table (sex × general activity). They are general lifestyle energy-use bands, not tailored metabolism measurements.
                </p>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">How this calculator works</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li>
                  For each activity you tick, we scale the per-hour calories to your body weight using linear interpolation from the 50–60–70 kg anchors you provided, then multiply by minutes/60.
                </li>
                <li>
                  Totals are summed across all selected activities to estimate your additional daily calorie burn from household/gardening tasks.
                </li>
                <li>
                  This does <em>not</em> include resting metabolic rate or structured exercise unless listed.
                </li>
              </ul>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">References</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  Captain Calculator — Cleaning Calorie Calculator: <a className="underline" href="https://captaincalculator.com/health/calorie/cleaning/" target="_blank" rel="noreferrer">https://captaincalculator.com/health/calorie/cleaning/</a>
                </li>
                <li>
                  Ainsworth BE, Haskell WL, Herrmann SD, et al. (2011). Compendium of Physical Activities: 2nd update of codes & MET values. <em>Med Sci Sports Exerc</em> 43(8):1575–1581.
                </li>
                <li>
                  Brooks GA, Fahey TD, Baldwin KM. (2003). <em>Exercise Physiology: Human Bioenergetics and Its Applications</em>. 4th ed. McGraw‑Hill.
                </li>
                <li>
                  Sujatha K, Anuradha S, Anitha M. (2000). Energy expenditure pattern of rural women of reproductive age. <em>Indian J Med Res</em> 112:73–77.
                </li>
                <li>
                  World Health Organization. (2004). <em>Human energy requirements</em>. FAO/WHO/UNU Expert Consultation.
                </li>
              </ul>
            </Card>
          </div>
        </div>

        <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
          Inspired by the simple, clear UX of calculator.net. This tool is for education only and not medical advice.
        </footer>
      </div>
    </div>
  );
}
