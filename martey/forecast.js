const CACHE_MS = 48 * 60 * 60 * 1000;
const PREFIX = "lm:v5:";
const mem = new Map();
const inflight = new Map();

function compass(deg) {
  const d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return d[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

function angDiff(a, b) {
  return Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));
}

function swellFactor(actual, preferred) {
  const d = angDiff(actual, preferred);
  if (d <= 25) return 1;
  if (d <= 45) return 0.85;
  if (d <= 70) return 0.6;
  if (d <= 100) return 0.35;
  return 0.15;
}

function windFeel(kts) {
  if (kts < 6) return "glassy";
  if (kts < 12) return "light";
  if (kts < 18) return "fresh";
  return "blown";
}

function windFactor(windDir, offDir, kts) {
  const d = angDiff(windDir, offDir);
  let align = d <= 40 ? 1 : d <= 70 ? 0.75 : d <= 110 ? 0.45 : 0.2;
  if (kts >= 18) align *= 0.55;
  else if (kts >= 12) align *= 0.8;
  return align;
}

function qualityFrom(score) {
  if (score >= 7.2) return "Epic";
  if (score >= 4.6) return "Good";
  if (score >= 2.4) return "Fair";
  return "Poor";
}

function scoreHour(h, spot) {
  const sf = swellFactor(h.swellDir, spot.swell);
  const wf = windFactor(h.windDir, spot.wind, h.windKts);
  const size = Math.min(h.waveH, 3.2);
  const period = Math.min(h.period, 16);
  const raw = size * (period / 10) * 3.2 * sf * wf;
  return Math.max(0, raw);
}

function peek(key) {
  if (mem.has(key)) return mem.get(key);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_MS) return null;
    mem.set(key, parsed);
    return parsed;
  } catch { return null; }
}

function save(key, data) {
  const pack = { at: Date.now(), data };
  mem.set(key, pack);
  try { localStorage.setItem(PREFIX + key, JSON.stringify(pack)); } catch { /* quota */ }
  return pack;
}

async function fetchPack(spot) {
  const marine = `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction&forecast_days=7&timezone=Indian%2FMaldives`;
  const wind = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&forecast_days=7&timezone=Indian%2FMaldives`;
  const [mRes, wRes] = await Promise.all([fetch(marine), fetch(wind)]);
  if (!mRes.ok || !wRes.ok) throw new Error("Swell feed missed.");
  const m = await mRes.json();
  const w = await wRes.json();
  const times = m.hourly?.time || [];
  const hours = times.map((t, i) => {
    const h = {
      t,
      waveH: m.hourly.wave_height?.[i] ?? 0,
      period: m.hourly.wave_period?.[i] ?? 0,
      waveDir: m.hourly.wave_direction?.[i] ?? 0,
      swellH: m.hourly.swell_wave_height?.[i] ?? 0,
      swellP: m.hourly.swell_wave_period?.[i] ?? 0,
      swellDir: m.hourly.swell_wave_direction?.[i] ?? 0,
      windKts: w.hourly.wind_speed_10m?.[i] ?? 0,
      windDir: w.hourly.wind_direction_10m?.[i] ?? 0
    };
    h.score = scoreHour(h, spot);
    h.label = qualityFrom(h.score);
    return h;
  });
  const now = Date.now();
  let idx = 0, best = Infinity;
  hours.forEach((h, i) => {
    const d = Math.abs(new Date(h.t).getTime() - now);
    if (d < best) { best = d; idx = i; }
  });
  return { current: hours[idx], hours, idx };
}

function loadSpot(spot, force) {
  const cached = !force ? peek(spot.id) : null;
  if (cached && !force) return Promise.resolve(cached);
  if (inflight.has(spot.id) && !force) return inflight.get(spot.id);
  const p = fetchPack(spot).then((data) => save(spot.id, data)).finally(() => inflight.delete(spot.id));
  inflight.set(spot.id, p);
  return p;
}

function bestWindows(hours) {
  const now = Date.now();
  const future = hours.filter((h) => new Date(h.t).getTime() >= now - 3600000);
  const picks = [];
  for (const h of future) {
    if (picks.length >= 3) break;
    if (h.label === "Epic" || h.label === "Good") {
      const last = picks[picks.length - 1];
      if (last && Math.abs(new Date(h.t) - new Date(last.t)) < 6 * 3600000) continue;
      picks.push(h);
    }
  }
  if (!picks.length) {
    const sorted = [...future].sort((a, b) => b.score - a.score);
    if (sorted[0]) picks.push(sorted[0]);
  }
  return picks;
}

function dayStrip(hours) {
  const days = [];
  for (const h of hours) {
    const d = h.t.slice(0, 10);
    let row = days.find((x) => x.d === d);
    if (!row) {
      row = { d, min: h.waveH, max: h.waveH, best: h };
      days.push(row);
    } else {
      row.min = Math.min(row.min, h.waveH);
      row.max = Math.max(row.max, h.waveH);
      if (h.score > row.best.score) row.best = h;
    }
  }
  return days.slice(0, 7);
}

window.LM_FX = { compass, windFeel, loadSpot, peek, bestWindows, dayStrip, angDiff };
