export type ExampleReport = {
  title: string;
  subtitle: string;
  sunlightHours: string;
  roofSpace: string;
  savings: string;
  accent: string;
  warm: string;
};

export type HomeStep = {
  step: string;
  title: string;
  body: string;
};

export const EXAMPLE_REPORTS: ExampleReport[] = [
  {
    title: "Lagos, NG",
    subtitle: "Urban roofs with strong solar exposure",
    sunlightHours: "1,820 hours",
    roofSpace: "1,540 sq ft",
    savings: "₦1.8m / year",
    accent: "#f4a62a",
    warm: "#ffe5a4",
  },
  {
    title: "Abuja, NG",
    subtitle: "Stable sunlight and broad rooftop coverage",
    sunlightHours: "1,760 hours",
    roofSpace: "1,210 sq ft",
    savings: "₦1.5m / year",
    accent: "#f0c94d",
    warm: "#fff0c4",
  },
  {
    title: "Port Harcourt, NG",
    subtitle: "Coastal homes with high tariff pressure",
    sunlightHours: "1,690 hours",
    roofSpace: "1,330 sq ft",
    savings: "₦1.4m / year",
    accent: "#97bf73",
    warm: "#d8f0c4",
  },
];

export const FINE_TUNE_POINTS = [
  {
    label: "Average monthly bill",
    value: "₦120k",
    note: "Adjust the starting point to reflect current spend.",
  },
  {
    label: "Recommended size",
    value: "5.8 kW",
    note: "Sized from roof potential and annual demand.",
  },
  {
    label: "Estimated savings",
    value: "₦1.6m",
    note: "Illustrative annual cost reduction from clean energy.",
  },
];

export const HOME_STEPS: HomeStep[] = [
  {
    step: "01",
    title: "Enter an address",
    body: "Start with a state, city, or street so the estimate can anchor to the right roof and local solar resource.",
  },
  {
    step: "02",
    title: "Measure GHI and roof fit",
    body: "Use location-based solar irradiance, roof area, and practical constraints to shape the result.",
  },
  {
    step: "03",
    title: "Compare tariffs over time",
    body: "See how normal electricity costs compound against a more stable solar path over 1, 5, and 10 years.",
  },
];

export const TARIFF_YEARS = [1, 2, 3, 5, 7, 10];

export const TARIFF_SERIES = TARIFF_YEARS.map((year) => ({
  year,
  grid: Math.pow(1.18, year - 1),
  solar: Math.pow(1.03, year - 1),
}));
