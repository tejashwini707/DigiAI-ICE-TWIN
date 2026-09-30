# Antarctic Station Digital Twin

Built for SIH 2026 — **Digital Platform for efficient remote management of Indian Antarctic Research Stations** (Ministry of Earth Sciences).

A live digital twin of Maitri and Bharati stations: infrastructure, energy, logistics and environmental monitoring in one command console, with an **offline-first sync layer** so the system stays usable when satellite connectivity drops — which, per the problem statement's own framing, is exactly when it matters most.

## What's actually here

- **Live SVG digital twin** of each station — zones (power plant, generator shed, fuel depot, living quarters, lab, comms tower, medical bay, storage, water plant) color-coded nominal/warning/critical/offline from real threshold logic on the backend, not hardcoded colors.
- **Simulated but realistic telemetry** — temperature, wind, power load, generator health, battery, fuel flow, water level — generated server-side every 15s within Antarctic-realistic ranges, charted live.
- **Resource & logistics tracking** with depletion projections ("42,000L diesel → 47 days remaining at current draw").
- **Personnel roster** with shift status, health status, and a one-tap SOS that is prioritized in the offline queue.
- **Incident log to HQ**, idempotent against duplicate sync (safe to retry).
- **Offline-first sync** — every write (SOS, incident, resource update) queues in IndexedDB when disconnected and flushes automatically the moment connectivity returns. A "Simulate disconnect" control lets you demo this live: the twin's aurora border visibly freezes, writes queue, then flow and sync resume in front of the judges.

## Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth
- Frontend: React (Vite), Tailwind v4, Recharts, IndexedDB (via `idb`)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB Atlas connection string, and JWT_SECRET
npm run seed     # populates Maitri + Bharati with realistic demo data
npm run dev      # starts on http://localhost:5000, telemetry simulator auto-starts
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:5000/api, adjust if needed
npm run dev             # starts on http://localhost:5173
```

### 3. Log in

Use one of the seeded accounts (password for all: `password123`):

| Email | Role |
|---|---|
| hq@moes.gov.in | HQ Admin (sees both stations) |
| maitri@moes.gov.in | Maitri Station Commander |
| bharati@moes.gov.in | Bharati Station Commander |

## Demo script (for judges)

1. **Open the dashboard.** Point out the live SVG twin — explain each zone reflects real backend state, not a static image.
2. **Click a zone** (e.g. Generator Shed) — show the live readings panel populate underneath.
3. **Point at the telemetry cards** — live charts updating every ~10-15s.
4. **Hit "Simulate disconnect."** Narrate: this is what actually happens during a polar storm or satellite window loss. Show the twin border freeze (aurora → dashed frost) and the connectivity bar turn red.
5. **While disconnected, raise an SOS** on a crew member, or log an incident. Point out it still works instantly — it's queued locally, not lost.
6. **Hit "Restore connection."** Watch the queued items sync automatically and the twin come back to life. This is your differentiator — say explicitly: *"most teams' dashboards would just break here."*
7. **Close on resources** — show the diesel depletion projection as a concrete operational decision-support example.

## Notes on scope / assumptions made

The official PS text is thin ("Develop a Digital Twin framework... integrating infrastructure, energy, logistics and environmental monitoring for efficient remote management") — these are the interpretive calls made, worth stating up front to evaluators:

- **Digital twin** = a live visual representation (SVG schematic) driven by real backend state, not a full 3D/BIM model — justified because the value for remote management is situational awareness at HQ, not spatial modeling.
- **Telemetry is simulated** within researched, realistic ranges for East Antarctic coastal stations — be upfront about this if asked; the architecture is what's being demonstrated, and it accepts real sensor input via the same `/api/telemetry/:code` endpoint with no changes needed.
- **Offline-first sync** was treated as core to "efficient remote management," not an add-on, since connectivity loss is when management actually gets hard — this is explicitly called out as an opportunity in the evaluator notes for this PS.
