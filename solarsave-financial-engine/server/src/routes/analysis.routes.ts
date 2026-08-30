import { Router } from "express";

import {
  getResidentialElectricityPrice,
} from "../services/eia.service";
import {
  getLatestTenYearTreasury,
} from "../services/treasury.service";
import {
  runSolarAnalysis,
} from "../services/finance.service";
import {
  SolarAnalysisInput,
} from "../types/finance";

const router = Router();

router.get("/electricity/:stateCode", async (req, res) => {
  try {
    const electricity = await getResidentialElectricityPrice(
      req.params?.stateCode
    );

    res.json(electricity);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve electricity price";

    res.status(502).json({ error: message });
  }
});

router.get("/treasury/10y", async (_req, res) => {
  try {
    const treasury = await getLatestTenYearTreasury();
    res.json(treasury);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve Treasury rate";

    res.status(502).json({ error: message });
  }
});

router.post("/", async (req, res) => {
  try {
    const input = req.body as SolarAnalysisInput;

    if (!input?.stateCode) {
      res.status(400).json({ error: "stateCode is required" });
      return;
    }

    const annualGenerationKwh = Number(input.annualGenerationKwh);
    const installationCost = Number(input.installationCost);

    if (!Number.isFinite(annualGenerationKwh)) {
      res.status(400).json({
        error: "annualGenerationKwh is required",
      });
      return;
    }

    if (!Number.isFinite(installationCost)) {
      res.status(400).json({
        error: "installationCost is required",
      });
      return;
    }

    const [electricity, treasury] = await Promise.all([
      getResidentialElectricityPrice(input.stateCode),
      getLatestTenYearTreasury(),
    ]);

    const result = runSolarAnalysis(
      {
        ...input,
        annualGenerationKwh,
        installationCost,
      },
      electricity,
      treasury
    );

    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete analysis";

    const status = error instanceof RangeError ? 400 : 500;

    res.status(status).json({ error: message });
  }
});

export default router;
