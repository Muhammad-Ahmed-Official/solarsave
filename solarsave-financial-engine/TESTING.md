# Quick test commands

Assuming the server runs on port 4000:

## Electricity price

```bash
curl http://localhost:4000/api/analysis/electricity/CA
```

or:

```bash
curl http://localhost:4000/api/analysis/electricity/California
```

## Treasury

```bash
curl http://localhost:4000/api/analysis/treasury/10y
```

## Full analysis

```bash
curl -X POST http://localhost:4000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "stateCode": "CA",
    "annualGenerationKwh": 12000,
    "installationCost": 20000
  }'
```

## Build check

From the server directory:

```bash
npm run build
```
