# Lifted Immigration Advisor Booking API

A REST API for managing care worker consultations with immigration advisors. Built with Node.js, TypeScript, and Express.

---

## How to Run

### Prerequisites
- Node.js 18+

### Setup
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

The server starts on `http://localhost:3000`.

> Seed data is loaded automatically at start. No manual seeding step needed — Sofia and Rajan's availability windows are loaded from `src/data/seed.ts` when the server starts.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled output |

---

## API Reference

### Availability
```
GET /availability?visaType=A
```

| Param | Required | Description |
|-------|----------|-------------|
| `visaType` | ✅ | `A` (Skilled Worker, 30 min) or `B` (Family/Dependent, 60 min) |
| `advisorId` | | Filter to specific advisor (`ia-001` or `ia-002`) |

### Bookings
```
POST /bookings                  Create a booking request
GET  /bookings                  List all bookings
GET  /bookings/:id              Get single booking
POST /bookings/:id/confirm      IA confirms a held booking
POST /bookings/:id/cancel       Cancel a booking
```

**Create booking body:**
```json
{
  "candidateName": "Ali Khan",
  "visaType": "A",
  "advisorPreference": "ia-001"
}
```

**Confirm booking body:**
```json
{
  "advisorId": "ia-001"
}
```

**List bookings query params:**

| Param | Description |
|-------|-------------|
| `status` | `held`, `confirmed`, `cancelled`, `expired` |
| `advisorId` | Filter by advisor |
| `visaType` | `A` or `B` |

```
GET /bookings?status=confirmed    Filter bookings by status (held, confirmed, cancelled, expired)
GET /bookings?advisorId=ia-001    Filter bookings by advisor
GET /bookings?visaType=B          Filter bookings by visa type (A or B)
```

### Waitlist
```
GET    /waitlist        View current queue
```

---

## Tech Choices

**Express** — it is lightweight and flexible and gives just enough structure to build a clean API without forcing unnecessary complexity on a small project like this.

**TypeScript** — strict typing across the entire codebase. Union types for `VisaType` and `BookingStatus` mean the compiler catches invalid states before they reach runtime.

**REST API** — simple, predictable endpoints that map directly to the resources in this system (bookings, availability, waitlist). Every endpoint has a clear HTTP verb and URL that any developer can understand immediately without additional tooling or schema definitions.

**In-memory store** — a plain module-level object shared across the process. Node.js module caching makes it a singleton and every file that imports `store` gets the same object in memory. Zero setup, no migrations, full state is introspectable in a debugger. The store is isolated behind its own module so swapping it for a database would only touch `store.ts` — the service layer wouldn't change.

**uuid** — generates unique booking IDs. No meaningful alternative for an in-memory setup.

**`setTimeout` for hold expiry** — sufficient for a single-process local setup. The callback checks current booking status before expiring, so a confirmed booking is never accidentally expired.

**Round robin slot assignment** — bookings are distributed evenly between advisors using a rotating index stored in the in-memory store. If the next advisor in rotation has no available slots, the system falls back to the next available advisor automatically.

---

## Slot Calculation Algorithm

The core of the system lives in `getAvailableSlots` in `slotService.ts`.

For each advisor and each availability window:
1. Start `slotStart` at the beginning of the window
2. Check if `slotStart` overlaps with any active booking or its break buffer
3. If blocked — jump `slotStart` to `bookingEndTime + breakBuffer` and try again
4. If free — push the slot and advance `slotStart` by `durationMinutes`
5. Stop when the remaining window is too small to fit another slot

Break buffers are applied per booking type — 5 minutes after a Type A call, 10 minutes after a Type B call. This means slots always start at clean boundaries after existing appointments.

---

## Challenges and Trade-offs

**Hold expiry across restarts**
`setTimeout` callbacks die when the process restarts. Any held bookings at the time of restart would stay in `held` status forever with no timer to expire them. In production I would use a job queue like BullMQ or a database-level TTL to handle expiry reliably across restarts and multiple instances.

**Race conditions**
In a single-process setup JavaScript's event loop provides natural serialisation — two requests cannot truly run simultaneously. In a multi-process production deployment, two requests could find the same slot free and both create bookings. The fix is a database transaction with a unique constraint on `(advisorId, startTime)` with status in `('held', 'confirmed')`.

**In-memory storage**
State is lost on every restart. Acceptable for a local demo, not for production. The service layer is deliberately storage-agnostic — `bookingService` and `slotService` call functions and never touch the store directly in a way that would be hard to swap. Replacing `store.ts` with a repository pattern backed by PostgreSQL would not require changes to any service file.

**No authentication**
The IA passes their `advisorId` in the confirm request body as a stand-in for real auth. In production this would come from a JWT token — I would add an auth middleware that extracts the advisor identity from `req.user` before it reaches the route handler.

**What I would add with more time**
- Proper JWT authentication with advisor and candidate roles
- PostgreSQL for persistent storage
- BullMQ/Database TTL for reliable hold expiry across restarts
- Idempotency keys on booking creation to prevent duplicate requests
- Pagination on `GET /bookings`
- A `DELETE /waitlist/:id ` withdraw from waitlist
