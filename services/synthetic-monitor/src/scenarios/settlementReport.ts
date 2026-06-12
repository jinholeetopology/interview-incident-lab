import { alertOnHttpError } from "../invariants/http.js";
import { isoDate } from "../runtime/deterministic.js";
import type { Scenario } from "../types.js";

export const settlementReportScenario: Scenario = {
  name: "settlement-report",
  async run(ctx) {
    const report = await ctx.client.get(`/api/settlement/reports/daily?date=${isoDate()}`);
    alertOnHttpError(ctx.alerts, report);
    ctx.state.cycle += 1;
  }
};
