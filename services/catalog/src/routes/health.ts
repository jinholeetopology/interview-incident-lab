import type { CatalogDeps } from "../deps.js";

interface HealthCheck {
  name: string;
  check: () => Promise<void>;
}

export function catalogHealthChecks(deps: CatalogDeps): HealthCheck[] {
  return [
    {
      name: "db",
      check: async () => {
        await deps.db.query("select 1");
      }
    },
    {
      name: "redis",
      check: async () => {
        const key = "ready";
        await deps.cache.set(key, { ok: true }, 5);
        await deps.cache.del(key);
      }
    },
    {
      name: "payments",
      check: async () => {
        await deps.payments.checkReady();
      }
    }
  ];
}
