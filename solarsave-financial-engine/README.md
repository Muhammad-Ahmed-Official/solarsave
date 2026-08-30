# SolarSave Financial Engine

This package contains the backend financial-analysis module developed for SolarSave. It is intentionally separated from the frontend so it can be integrated into the team's latest repository without overwriting current UI work.

## What it does

The engine accepts a US state, estimated first-year solar generation, and installation cost. It then:

1. Pulls the latest residential electricity price for the selected state from the U.S. Energy Information Administration (EIA).
2. Pulls the latest available U.S. 10-year Treasury yield from FRED series `DGS10`.
3. Builds a 25-year solar-project cash-flow forecast.
4. Applies annual module degradation and electricity-price escalation.
5. Calculates NPV, IRR, ROI, simple payback, lifetime savings, and lifetime net profit.

The frontend should remain responsible for geocoding, FortyGuard irradiance retrieval, and turning irradiance into `annualGenerationKwh`. The financial engine begins after annual solar production and installation cost are known.

## Required input

`POST /api/analysis`

```json
{
  "stateCode": "CA",
  "annualGenerationKwh": 12000,
  "installationCost": 20000
}
```

`stateCode` may also be a full US state name such as `California`.

Optional fields:

```json
{
  "projectYears": 25,
  "annualDegradation": 0.005,
  "electricityInflation": 0.025,
  "annualMaintenanceCost": 0,
  "maintenanceInflation": 0.025,
  "incentives": 0,
  "riskPremium": 0.02
}
```

## Default assumptions

- Forecast horizon: 25 years
- Annual module degradation: 0.5%
- Annual electricity-price escalation: 2.5%
- Annual maintenance cost: $0 unless supplied
- Maintenance inflation: 2.5%
- Incentives: $0 unless supplied
- Project risk premium: 2.0%

The discount rate is:

`discount rate = latest US 10Y Treasury yield + project risk premium`

IRR is solved independently from the discount rate using the project cash flows.

## Main equations

Year-t production:

`E_t = E_1 * (1 - d)^(t-1)`

Year-t electricity price:

`P_t = P_1 * (1 + g)^(t-1)`

Gross savings:

`GrossSavings_t = E_t * P_t`

Net project cash flow:

`CF_t = GrossSavings_t - Maintenance_t`

NPV:

`NPV = sum(CF_t / (1+r)^t)` including the negative installation cost at year 0.

IRR solves:

`0 = sum(CF_t / (1+IRR)^t)`

## API endpoints

### `GET /api/analysis/electricity/:state`

Examples:

- `/api/analysis/electricity/CA`
- `/api/analysis/electricity/California`

Returns the latest EIA residential electricity price.

### `GET /api/analysis/treasury/10y`

Returns the latest valid DGS10 observation from FRED.

### `POST /api/analysis`

Runs the full financial analysis.

Response contains:

- `location`
- `electricity`
- `treasury`
- `assumptions`
- `metrics`
- `annualCashFlows`

Key metrics returned:

- `netInstallationCost`
- `discountRate`
- `npv`
- `irr`
- `roi`
- `paybackYears`
- `lifetimeGrossSavings`
- `lifetimeOperatingSavings`
- `lifetimeNetProfit`
- `financiallyAttractive`

Rates such as `irr`, `roi`, and `discountRate` are returned as decimals. Example: `0.226234` means `22.6234%`.

## Integration into the current team backend

Copy these files into the equivalent server paths:

- `server/src/types/finance.ts`
- `server/src/services/eia.service.ts`
- `server/src/services/treasury.service.ts`
- `server/src/services/finance.service.ts`
- `server/src/routes/analysis.routes.ts`

Then mount the router in the team's current Express entrypoint. Do not replace their whole `index.ts`; only add the route import/mount shown in `integration/index-snippet.ts`.

The server must have `express.json()` enabled before the analysis route.

The runtime must provide `EIA_API_KEY`. FRED's CSV endpoint used here does not require a FRED API key.

Node 18+ is required because the services use native `fetch`.

## Frontend contract

The frontend only needs to send:

```json
{
  "stateCode": "California",
  "annualGenerationKwh": 12000,
  "installationCost": 20000
}
```

Suggested source of each field:

- `stateCode`: geocoder result (`CA` or `California`)
- `annualGenerationKwh`: FortyGuard irradiance -> solar production model
- `installationCost`: system capacity x installed cost per kW, or the team's current cost model

The backend should be treated as the source of truth for financial metrics once integrated.

## Tested snapshot

The module was locally tested successfully with the following live upstream values at the time of testing:

- California EIA residential price: 34.74 cents/kWh, period 2026-06
- U.S. 10Y Treasury: 4.64%, dated 2026-08-25

For:

- annual generation = 12,000 kWh
- installation cost = $20,000
- default assumptions

it returned approximately:

- discount rate: 6.64%
- NPV: $40,227.29
- IRR: 22.6234%
- ROI: 566.5749%
- payback: 4.63 years
- lifetime net profit: $113,314.97

These upstream values are live and will change over time.

## Notes for the team lead

1. This module does not depend on the frontend implementation.
2. It does not need Redis, BullMQ, PostgreSQL, or a database for the calculations.
3. EIA responses are cached in memory for 12 hours.
4. Treasury responses are cached in memory for 6 hours.
5. The current 2.5% electricity-price escalation is an explicit assumption, not an EIA forecast.
6. A later enhancement could estimate state-specific historical electricity-price growth from EIA history.
7. The route name uses `stateCode` for compatibility, but the service accepts either a two-letter state code or full US state name.
