import { useEffect, useMemo, useState } from 'react';
import madridRaw from './data/madrid.json';
import type { CityData, PlaceCategory } from './lib/types';
import { fetchPrayerTimes } from './lib/prayerTimes';
import './styles.css';

const madrid = madridRaw as CityData;

type Page = 'home' | 'itinerary' | 'places';

type TripStyle = 'classic' | 'foodie' | 'family';

type ItineraryDay = {
  title: string;
  bullets: string[];
};

type Itinerary = {
  cityName: string;
  days: number;
  style: TripStyle;
  plan: ItineraryDay[];
};

function buildItinerary(input: {
  cityName: string;
  days: number;
  style: TripStyle;
}): Itinerary {
  const { cityName, days, style } = input;

  const templates: Record<TripStyle, ItineraryDay[]> = {
    classic: [
      {
        title: 'Day 1 — Old Town + essentials',
        bullets: [
          'Morning: walk a central neighborhood (Puerta del Sol / Plaza Mayor)',
          'Dhuhr: find nearest mosque / prayer space',
          'Afternoon: museum or landmark (Prado / Royal Palace)',
          'Evening: halal dinner nearby + Maghrib/Isha plan',
        ],
      },
      {
        title: 'Day 2 — Parks + neighborhoods',
        bullets: [
          'Morning: Retiro Park / scenic walk',
          'Lunch: halal spot',
          'Afternoon: shopping street / local neighborhood',
          'Evening: optional viewpoint + halal dessert',
        ],
      },
      {
        title: 'Day 3 — Flexible / day trip',
        bullets: [
          'Morning: choose 1 must-do activity',
          'Midday: pray + lunch',
          'Afternoon: optional day trip or more sightseeing',
          'Evening: wrap-up + last halal meal',
        ],
      },
    ],
    foodie: [
      {
        title: 'Day 1 — Halal food crawl',
        bullets: [
          'Morning: coffee + light breakfast',
          'Lunch: halal restaurant #1',
          'Afternoon: market / pastry stop',
          'Dinner: halal restaurant #2',
        ],
      },
      {
        title: 'Day 2 — Hidden gems',
        bullets: [
          'Brunch: halal-friendly option',
          'Afternoon: walk + snacks',
          'Dinner: top-rated halal spot',
        ],
      },
      {
        title: 'Day 3 — Repeat favorites',
        bullets: [
          'Revisit the best place',
          'Bring back gifts / sweets',
          'Early night for travel next day',
        ],
      },
    ],
    family: [
      {
        title: 'Day 1 — Easy walking + parks',
        bullets: [
          'Morning: park time',
          'Lunch: halal + kid-friendly',
          'Afternoon: short activity',
          'Evening: early dinner + rest',
        ],
      },
      {
        title: 'Day 2 — Museum/attraction + breaks',
        bullets: [
          'Morning: one attraction',
          'Dhuhr: prayer stop',
          'Afternoon: snack + playground',
        ],
      },
      {
        title: 'Day 3 — Flexible low-stress day',
        bullets: [
          'Souvenir street',
          'Halal lunch',
          'Short walk + finish',
        ],
      },
    ],
  };

  const base = templates[style];
  const plan = Array.from({ length: days }, (_, i) => base[Math.min(i, base.length - 1)]);

  return { cityName, days, style, plan };
}

function useHashRoute(): [Page, (p: Page) => void] {
  const get = (): Page => {
    const h = (window.location.hash || '#home').replace('#', '');
    if (h === 'itinerary' || h === 'places' || h === 'home') return h;
    return 'home';
  };
  const [page, setPage] = useState<Page>(get);
  useEffect(() => {
    const onHash = () => setPage(get());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = (p: Page) => {
    window.location.hash = p;
  };
  return [page, nav];
}

export default function App() {
  const [page, nav] = useHashRoute();

  const [days, setDays] = useState(2);
  const [style, setStyle] = useState<TripStyle>('classic');

  const itinerary = useMemo(() => buildItinerary({ cityName: madrid.city.name, days, style }), [days, style]);

  const [prayer, setPrayer] = useState<{ dateLabel: string; timings: Record<string, string> } | null>(null);

  useEffect(() => {
    const center = madrid.city.center;
    if (!center) return;
    fetchPrayerTimes({ lat: center.lat, lng: center.lng, method: 2 }).then(setPrayer);
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div>
          <div className="brand">HalalTrip</div>
          <div className="muted">MVP — {madrid.city.name}</div>
        </div>
        <nav className="nav">
          <button className={page === 'home' ? 'active' : ''} onClick={() => nav('home')}>Home</button>
          <button className={page === 'itinerary' ? 'active' : ''} onClick={() => nav('itinerary')}>Itinerary</button>
          <button className={page === 'places' ? 'active' : ''} onClick={() => nav('places')}>Places</button>
        </nav>
      </header>

      {page === 'home' && (
        <section className="card">
          <h1>Madrid halal-friendly itinerary generator</h1>
          <p className="muted">
            Zero-account, zero-database MVP. Curated places live in a small JSON file.
          </p>

          <div className="grid">
            <label>
              Days
              <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(Number(e.target.value || 1))} />
            </label>
            <label>
              Style
              <select value={style} onChange={(e) => setStyle(e.target.value as TripStyle)}>
                <option value="classic">Classic</option>
                <option value="foodie">Foodie</option>
                <option value="family">Family</option>
              </select>
            </label>
          </div>

          {prayer && (
            <div className="prayer">
              <div className="prayerTitle">Prayer times — {prayer.dateLabel} (Madrid)</div>
              <div className="prayerGrid">
                {Object.entries(prayer.timings).map(([k, v]) => (
                  <div key={k} className="pill">
                    <span className="pillKey">{k}</span>
                    <span className="pillVal">{v}</span>
                  </div>
                ))}
              </div>
              <div className="small muted">Source: AlAdhan API</div>
            </div>
          )}

          <div className="actions">
            <button className="primary" onClick={() => nav('itinerary')}>Generate itinerary</button>
            <button onClick={() => nav('places')}>Browse places</button>
          </div>
        </section>
      )}

      {page === 'itinerary' && (
        <section className="card">
          <h1>
            {itinerary.days}-day {itinerary.style} itinerary — {itinerary.cityName}
          </h1>
          <p className="muted">This is a template. Next step: swap bullets with real curated neighborhoods + halal spots.</p>

          <div className="itinerary">
            {itinerary.plan.map((day, idx) => (
              <div key={idx} className="day">
                <h2>{day.title}</h2>
                <ul>
                  {day.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="actions">
            <button onClick={() => nav('home')}>Back</button>
            <button className="primary" onClick={() => nav('places')}>Open places</button>
          </div>
        </section>
      )}

      {page === 'places' && (
        <PlacesPage />
      )}

      <footer className="footer">
        <div className="small muted">
          MVP running locally. Next: add real Madrid POIs + share links.
        </div>
      </footer>
    </div>
  );
}

function PlacesPage() {
  const [filter, setFilter] = useState<PlaceCategory | 'all'>('all');

  const places = useMemo(() => {
    if (filter === 'all') return madrid.places;
    return madrid.places.filter((p) => p.category === filter);
  }, [filter]);

  return (
    <section className="card">
      <h1>Places — Madrid</h1>
      <p className="muted">For MVP: just link out to Google Maps. No database required.</p>

      <div className="grid">
        <label>
          Category
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="halal_restaurant">Halal restaurants</option>
            <option value="mosque">Mosques</option>
            <option value="prayer_space">Prayer spaces</option>
            <option value="activity">Activities</option>
            <option value="hotel">Hotels</option>
          </select>
        </label>
      </div>

      <div className="list">
        {places.map((p) => (
          <div key={p.id} className="listItem">
            <div>
              <div className="listTitle">{p.name}</div>
              <div className="small muted">{p.address ?? ''}</div>
              <div className="small muted">{p.category}</div>
            </div>
            <div>
              {p.mapUrl ? (
                <a className="linkBtn" href={p.mapUrl} target="_blank" rel="noreferrer">
                  Open map
                </a>
              ) : (
                <span className="small muted">No map</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <a className="linkBtn" href={"#home"}>Back</a>
      </div>
    </section>
  );
}
