type PrayerTimesResponse = {
  data?: {
    timings?: Record<string, string>;
    date?: { readable?: string };
  };
};

export async function fetchPrayerTimes(params: {
  lat: number;
  lng: number;
  date?: string; // DD-MM-YYYY (AlAdhan)
  method?: number;
}): Promise<{ dateLabel: string; timings: Record<string, string> } | null> {
  const { lat, lng, date, method = 2 } = params;
  const url = date
    ? `https://api.aladhan.com/v1/timings/${encodeURIComponent(date)}?latitude=${lat}&longitude=${lng}&method=${method}`
    : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as PrayerTimesResponse;
    const timings = json.data?.timings;
    const dateLabel = json.data?.date?.readable ?? 'Today';
    if (!timings) return null;

    // Keep only the main ones
    const keep = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const filtered: Record<string, string> = {};
    for (const k of keep) if (timings[k]) filtered[k] = timings[k];

    return { dateLabel, timings: filtered };
  } catch {
    return null;
  }
}
