import type { Logger } from "@atlas/shared";
import type { Scenario, ScenarioContext } from "../types.js";

export type ScheduledScenario = Scenario & {
  offsetMs: number;
};

export type SchedulerHandle = {
  stop(): void;
};

export const startScheduler = (cfg: {
  logger: Logger;
  intervalMs: number;
  scenarios: ScheduledScenario[];
  context: ScenarioContext;
}): SchedulerHandle => {
  const timers: NodeJS.Timeout[] = [];
  const running = new Set<string>();

  const runScenario = async (scenario: ScheduledScenario) => {
    if (running.has(scenario.name)) {
      cfg.logger.warn("scenario_still_running", { scenario: scenario.name });
      return;
    }
    running.add(scenario.name);
    try {
      cfg.logger.info("scenario_start", { scenario: scenario.name });
      await scenario.run(cfg.context);
      cfg.logger.info("scenario_done", { scenario: scenario.name });
    } catch (err) {
      cfg.context.alerts.emit("http_error", {
        path: `scenario:${scenario.name}`,
        status: 0,
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      running.delete(scenario.name);
    }
  };

  for (const scenario of cfg.scenarios) {
    const startTimer = setTimeout(() => {
      void runScenario(scenario);
      timers.push(setInterval(() => void runScenario(scenario), cfg.intervalMs));
    }, scenario.offsetMs);
    timers.push(startTimer);
  }

  return {
    stop() {
      timers.forEach((timer) => clearTimeout(timer));
      timers.length = 0;
    }
  };
};
