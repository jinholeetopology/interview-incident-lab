import type { ScheduledScenario } from "../runtime/scheduler.js";
import { browseCatalogScenario } from "./browseCatalog.js";
import { cancellationScenario } from "./cancellations.js";
import { orderBurstScenario } from "./orderBurst.js";
import { paymentRetryStormScenario } from "./paymentRetryStorm.js";
import { priceLookupScenario } from "./priceLookup.js";
import { priceRuleMutationScenario } from "./priceRuleMutation.js";
import { settlementReportScenario } from "./settlementReport.js";

export const buildScenarioSchedule = (cycleIntervalMs: number): ScheduledScenario[] => {
  const step = Math.floor(cycleIntervalMs / 7);
  return [
    { ...browseCatalogScenario, offsetMs: 0 },
    { ...priceLookupScenario, offsetMs: step },
    { ...orderBurstScenario, offsetMs: step * 2 },
    { ...priceRuleMutationScenario, offsetMs: step * 3 },
    { ...paymentRetryStormScenario, offsetMs: step * 4 },
    { ...cancellationScenario, offsetMs: step * 5 },
    { ...settlementReportScenario, offsetMs: step * 6 }
  ];
};
