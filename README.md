# Synthetic Insurance Lab

A standalone dashboard for exploring synthetic insurance profiles and testing eligibility responses.

## Setup

```bash
cd apps/synthea-dashboard
npm install
```

## Development

```bash
# From the project root:
npm run synthea-dashboard:dev

# Or from the dashboard directory:
npm run dev
```

The dev server runs on port 5174 and proxies `/api` requests to the Neural Hub backend (port 8787).

## Build

```bash
npm run build
```

## Requirements

- Neural Hub backend must be running on port 8787
- Backend must have `SYNTHETIC_INSURANCE_ENABLED=true` in `.env`
- Backend must have `SYNTHETIC_INSURANCE_DATA_DIR=server/data` in `.env`

## Features

- **Overview**: Metrics, payer distribution, status distribution, benefit scenarios
- **Patient Explorer**: Searchable, filterable, paginated table of all 222 synthetic profiles
- **Profile Details**: Demographics, synthetic benefits, provenance, copy test details
- **Eligibility Test Console**: Submit real eligibility requests to the backend API

## Authentication

The dashboard uses the Neural Hub backend's session auth. Log in at http://localhost:8787 first, then the dashboard will use the session cookie.

All profile and eligibility endpoints require `integrations:manage` permission (admin role).
