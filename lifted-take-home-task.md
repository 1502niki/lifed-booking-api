# Take-Home Task: Immigration Advisor Booking API

## Overview

Lifted connects care workers with immigration advisors (IAs) for compliance consultations. Your task is to build a small API (REST/GQL/tRPC) that manages availability and bookings across a team of IAs.

Spend **up to two hours** on the task. We don't expect a production-ready system — we expect something you can run locally and talk us through. Spend your time on the things you think matter most, and be ready to tell us what you'd do differently with more time.

---

## Seed Data

We've provided a JSON file containing availability for two immigration advisors — **Sofia** and **Rajan** — across two weeks. Treat this data as if it were ingested from an external source — you don't need to build an ingestion mechanism, but think about what that would look like

```json
{
  "advisors": [
    {
      "id": "ia-001",
      "name": "Sofia Andersson",
      "availability": [
        { "start": "2025-03-10T09:00:00Z", "end": "2025-03-10T10:50:00Z" },
        { "start": "2025-03-11T14:00:00Z", "end": "2025-03-11T14:20:00Z" },
        { "start": "2025-03-12T10:00:00Z", "end": "2025-03-12T11:30:00Z" },
        { "start": "2025-03-13T09:00:00Z", "end": "2025-03-13T10:00:00Z" },
        { "start": "2025-03-14T11:00:00Z", "end": "2025-03-14T12:30:00Z" },
        { "start": "2025-03-18T14:00:00Z", "end": "2025-03-18T15:30:00Z" },
        { "start": "2025-03-19T09:00:00Z", "end": "2025-03-19T10:00:00Z" },
        { "start": "2025-03-20T10:00:00Z", "end": "2025-03-20T11:30:00Z" },
        { "start": "2025-03-21T09:00:00Z", "end": "2025-03-21T10:00:00Z" }
      ]
    },
    {
      "id": "ia-002",
      "name": "Rajan Patel",
      "availability": [
        { "start": "2025-03-10T09:00:00Z", "end": "2025-03-10T09:30:00Z" },
        { "start": "2025-03-10T09:33:00Z", "end": "2025-03-10T11:30:00Z" },
        { "start": "2025-03-11T14:00:00Z", "end": "2025-03-11T15:00:00Z" },
        { "start": "2025-03-12T09:00:00Z", "end": "2025-03-12T10:00:00Z" },
        { "start": "2025-03-13T09:00:00Z", "end": "2025-03-13T10:30:00Z" },
        { "start": "2025-03-14T11:00:00Z", "end": "2025-03-14T12:00:00Z" },
        { "start": "2025-03-17T09:00:00Z", "end": "2025-03-17T10:30:00Z" },
        { "start": "2025-03-18T14:00:00Z", "end": "2025-03-18T14:25:00Z" },
        { "start": "2025-03-19T09:00:00Z", "end": "2025-03-19T10:30:00Z" },
        { "start": "2025-03-20T11:00:00Z", "end": "2025-03-20T12:00:00Z" },
        { "start": "2025-03-21T09:00:00Z", "end": "2025-03-21T10:00:00Z" }
      ]
    }
  ]
}
```

---

## Requirements

### 1. Availability 

An endpoint/mutation to return all bookable slots derived from the seed data windows, excluding any slots that are currently held or confirmed. **Strech** Think of ways to enhance this fetch to make it more useful.

### 2. Create a booking request

An endpoint/mutation for a candidate to request a booking by providing their name and **visa type**. Visa type determines the appointment duration:

| Visa Type | Label              | Duration                         |
| --------- | ------------------ | -------------------------------- |
| `A`       | Skilled Worker     | 30 minutes.                      |
| `B`       | Family / Dependent | 60 minutes                       |

The slot is immediately placed **on hold** for **10 minutes**. During this window:

- No other candidate can request or book any held slot
- The assigned IA receives the request to confirm

If the hold expires without confirmation, all held slots are automatically released back into the pool.

### 3. Booking confirmation

An endpoint/mutation for the IA to confirm a pending booking within the 10-minute window. The slot becomes **confirmed** and is permanently removed from availability.

### 4. Bookings

An endpoint/mutation to return all bookings. **Strech** Think of ways to enhance this fetch to make it more useful.

---

## Stretch Goals

### Waitlist

If no eligible slot is available at the time of request, the candidate can be added to a waitlist rather than receiving an outright rejection.

When a hold expires or a confirmed booking is cancelled, the system should automatically check the waitlist and offer the newly available slot to the first eligible candidate in the queue. That candidate then has their own 10-minute window to confirm.

### Advisor break requirements

In practice, IAs need a short break between consecutive appointments. When calculating available slots from a window, apply the following buffer after each confirmed booking before the next slot can begin:

- **5 minutes** after a Type A (30-minute) call
- **10 minutes** after a Type B (60-minute) call

This means the Availbiilty endpoint/mutation must account for existing confirmed bookings — not just raw window data — when determining what's actually bookable.

---

## Guidelines

- **Node.js** — use whatever framework and libraries you like
- **No UI required** — API only; we'll test it with curl or Postman
- **No hosting required** — it should run locally with a simple setup step
- Tests are not explicitly required, but we'll notice if you've written them
- Commit your work to a repo and share the link before our call

---

## README

Your repo should include a README covering:

- **How to run** — setup steps, environment variables, how to seed the data
- **Tech choices** — why you chose the libraries and approach you did
- **Challenges & trade-offs** — what was hard, what you cut corners on, and what you'd do differently with more time

The README is part of the assessment. Clear, honest documentation tells us as much as the code does.
