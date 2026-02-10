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

function buildItinerary(input: { cityName: string; days: number; style: TripStyle }): Itinerary {
  const { cityName, days, style } = input;

  const templates: Record<TripStyle, ItineraryDay[]> = {
    classic: [
      {
        title: 'Day 1 — Iconic Madrid + easy prayer plan',
        bullets: [
          'Morning: Puerta del Sol → Plaza Mayor walk',
          'Midday: Dhuhr plan (nearest mosque / prayer space)',
          'Afternoon: Prado (or Royal Palace) + coffee break',
          'Evening: halal dinner + Maghrib/Isha nearby',
        ],
      },
      {
        title: 'Day 2 — Retiro + neighborhoods',
        bullets: [
          'Morning: Retiro Park (easy, family-friendly)',
          'Lunch: halal spot (choose by neighborhood)',
          'Afternoon: Gran Vía / shopping / chill street walk',
          'Evening: dessert + wrap-up',
        ],
      },
      {
        title: 'Day 3 — Flexible day (museum / day trip / repeat favorites)',
        bullets: [
          'Morning: pick one must-do',
          'Midday: prayer + lunch',
          'Afternoon: optional day trip or more city time',
          'Evening: last halal meal + pack',
        ],
      },
    ],
    foodie: [
      {
        title: 'Day 1 — Halal food crawl',
        bullets: ['Light breakfast', 'Lunch: halal restaurant #1', 'Snack stop', 'Dinner: halal restaurant #2'],
      },
      {
        title: 'Day 2 — Local favorites + sweets',
        bullets: ['Brunch: halal-friendly', 'Afternoon stroll', 'Dinner: top-rated halal spot'],
      },
      {
        title: 'Day 3 — Repeat best places',
        bullets: ['Revisit the best place', 'Gifts / sweets', 'Early night'],
      },
    ],
    family: [
      {
        title: 'Day 1 — Low-stress start',
        bullets: ['Morning: park time', 'Lunch: halal + kid-friendly', 'Afternoon: short activity', 'Early dinner + rest'],
      },
      {
        title: 'Day 2 — One big activity + breaks',
        bullets: ['Morning: one attraction', 'Dhuhr: prayer stop', 'Afternoon: snack + playground'],
      },
      {
        title: 'Day 3 — Flexible day',
        bullets: ['Easy walk', 'Halal lunch', 'Wrap-up'],
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [page, nav];
}

export default function App() {
  const [page, nav] = useHashRoute();

  const [days, setDays] = useState(2);
  const [style, setStyle] = useState<TripStyle>('classic');

  const itinerary = useMemo(
    () => buildItinerary({ cityName: madrid.city.name, days, style }),
    [days, style]
  );

  const [prayer, setPrayer] = useState<{ dateLabel: string; timings: Record<string, string> } | null>(null);

  useEffect(() => {
    const center = madrid.city.center;
    if (!center) return;
    fetchPrayerTimes({ lat: center.lat, lng: center.lng, method: 2 }).then(setPrayer);
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbarInner">
          <div className="logo" onClick={() => nav('home')} role="button" tabIndex={0}>
            <span className="logoMark" />
            <span className="logoText">HalalTrip</span>
          </div>

          <nav className="topnav">
            <button className={page === 'home' ? 'active' : ''} onClick={() => nav('home')}>
              Home
            </button>
            <button className={page === 'itinerary' ? 'active' : ''} onClick={() => nav('itinerary')}>
              Itinerary
            </button>
            <button className={page === 'places' ? 'active' : ''} onClick={() => nav('places')}>
              Places
            </button>
          </nav>

          <div className="topbarCta">
            <button className="btnPrimary" onClick={() => nav('itinerary')}>
              Generate itinerary
            </button>
          </div>
        </div>
      </header>

      {page === 'home' && (
        <LandingHome
          cityName={madrid.city.name}
          days={days}
          setDays={setDays}
          style={style}
          setStyle={setStyle}
          prayer={prayer}
          onGenerate={() => nav('itinerary')}
          onPlaces={() => nav('places')}
        />
      )}

      {page === 'itinerary' && <ItineraryPage itinerary={itinerary} onBack={() => nav('home')} onPlaces={() => nav('places')} />}

      {page === 'places' && <PlacesPage onBack={() => nav('home')} />}

      <footer className="footer">
        <div className="footerInner">
          <div>
            <div className="footerTitle">HalalTrip — Madrid (MVP)</div>
            <div className="small muted">
              Built as a lightweight MVP: no accounts, no database. Places are curated in JSON.
            </div>
          </div>
          <div className="small muted">Prayer times: AlAdhan API · Map links: Google Maps</div>
        </div>
      </footer>
    </div>
  );
}

function LandingHome(props: {
  cityName: string;
  days: number;
  setDays: (n: number) => void;
  style: TripStyle;
  setStyle: (s: TripStyle) => void;
  prayer: { dateLabel: string; timings: Record<string, string> } | null;
  onGenerate: () => void;
  onPlaces: () => void;
}) {
  const { cityName, days, setDays, style, setStyle, prayer, onGenerate, onPlaces } = props;

  return (
    <main>
      <section className="hero">
        <div className="heroInner">
          <div className="badge">New · Madrid launch</div>
          <h1 className="heroTitle">A modern halal-friendly travel planner for {cityName}.</h1>
          <p className="heroSubtitle">
            Generate a simple itinerary, find halal food & nearby prayer options, and open everything in Maps.
            Built to be fast, lightweight, and practical.
          </p>

          <div className="heroActions">
            <button className="btnPrimary" onClick={onGenerate}>
              Generate itinerary
            </button>
            <button className="btnGhost" onClick={onPlaces}>
              Browse places
            </button>
          </div>

          <div className="heroMeta">
            <div className="metaCard">
              <div className="metaLabel">No accounts</div>
              <div className="metaValue">Just use it.</div>
            </div>
            <div className="metaCard">
              <div className="metaLabel">No database</div>
              <div className="metaValue">Curated JSON.</div>
            </div>
            <div className="metaCard">
              <div className="metaLabel">Fast</div>
              <div className="metaValue">Mobile-first UI.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionInner split">
          <div className="panel">
            <h2 className="h2">Try it now</h2>
            <p className="muted">
              Choose your trip settings. We’ll generate a clean day-by-day plan you can follow.
            </p>

            <div className="formGrid">
              <label>
                Days
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value || 1))}
                />
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

            <div className="rowActions">
              <button className="btnPrimary" onClick={onGenerate}>
                Generate
              </button>
              <button className="btnGhost" onClick={onPlaces}>
                View places
              </button>
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
          </div>

          <div className="panel glass">
            <h2 className="h2">What you get</h2>
            <div className="featureList">
              <Feature title="Halal-first" text="Focus on halal food and prayer planning from the start." />
              <Feature title="Practical itinerary" text="A clean plan you can follow—no overcomplication." />
              <Feature title="Maps-ready" text="Open locations directly in Google Maps." />
              <Feature title="Built for speed" text="Lightweight MVP you can extend city by city." />
            </div>

            <div className="divider" />

            <h3 className="h3">Roadmap</h3>
            <ul className="checklist">
              <li>Real curated Madrid POIs (halal restaurants, mosques, prayer spaces)</li>
              <li>Sharable itinerary links</li>
              <li>More cities in Spain</li>
              <li>Community suggestions (no accounts)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="sectionInner">
          <h2 className="h2 center">How it works</h2>
          <div className="steps">
            <Step n="1" title="Pick days + style" text="Classic, foodie, or family." />
            <Step n="2" title="Get a day-by-day plan" text="A simple itinerary you can actually follow." />
            <Step n="3" title="Open maps and go" text="No accounts. No friction." />
          </div>

          <div className="cta">
            <div>
              <div className="ctaTitle">Start planning Madrid in 30 seconds.</div>
              <div className="muted">Generate your itinerary and use Places to find halal options nearby.</div>
            </div>
            <button className="btnPrimary" onClick={onGenerate}>
              Generate itinerary
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionInner">
          <h2 className="h2">FAQ</h2>
          <div className="faq">
            <details>
              <summary>Do I need to create an account?</summary>
              <p>No. This MVP is built to work instantly.</p>
            </details>
            <details>
              <summary>Where does the data come from?</summary>
              <p>
                Prayer times come from AlAdhan. Places are currently a small curated list in JSON and map links open in Google Maps.
              </p>
            </details>
            <details>
              <summary>Is this fully accurate?</summary>
              <p>
                It’s a fast MVP. Next step is to curate real Madrid places and continuously verify them.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature(props: { title: string; text: string }) {
  return (
    <div className="feature">
      <div className="featureTitle">{props.title}</div>
      <div className="muted">{props.text}</div>
    </div>
  );
}

function Step(props: { n: string; title: string; text: string }) {
  return (
    <div className="step">
      <div className="stepN">{props.n}</div>
      <div>
        <div className="stepTitle">{props.title}</div>
        <div className="muted">{props.text}</div>
      </div>
    </div>
  );
}

function ItineraryPage(props: { itinerary: Itinerary; onBack: () => void; onPlaces: () => void }) {
  const { itinerary, onBack, onPlaces } = props;

  return (
    <main className="section">
      <div className="sectionInner">
        <div className="panel">
          <div className="pageHeader">
            <div>
              <h1 className="h1">
                {itinerary.days}-day {itinerary.style} itinerary — {itinerary.cityName}
              </h1>
              <p className="muted">
                Template MVP. Next step: replace bullets with curated neighborhoods and real halal places.
              </p>
            </div>
            <div className="rowActions">
              <button className="btnGhost" onClick={onBack}>
                Back
              </button>
              <button className="btnPrimary" onClick={onPlaces}>
                Open places
              </button>
            </div>
          </div>

          <div className="itinerary">
            {itinerary.plan.map((day, idx) => (
              <div key={idx} className="day">
                <h2 className="dayTitle">{day.title}</h2>
                <ul className="dayList">
                  {day.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function PlacesPage(props: { onBack: () => void }) {
  const [filter, setFilter] = useState<PlaceCategory | 'all'>('all');

  const places = useMemo(() => {
    if (filter === 'all') return madrid.places;
    return madrid.places.filter((p) => p.category === filter);
  }, [filter]);

  return (
    <main className="section">
      <div className="sectionInner">
        <div className="panel">
          <div className="pageHeader">
            <div>
              <h1 className="h1">Places — Madrid</h1>
              <p className="muted">For MVP: we link out to Google Maps. No accounts or database required.</p>
            </div>
            <button className="btnGhost" onClick={props.onBack}>
              Back
            </button>
          </div>

          <div className="formGrid">
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
                  {p.address && <div className="small muted">{p.address}</div>}
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
        </div>
      </div>
    </main>
  );
}
