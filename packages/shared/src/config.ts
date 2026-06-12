type ConfigField<T> = {
  env: string;
  required?: boolean;
  default?: string;
  parse?: (raw: string) => T;
};

export const defineConfig = <T>(spec: {
  [K in keyof T]: ConfigField<T[K]>;
}): T => {
  const config: Partial<T> = {};

  for (const key of Object.keys(spec) as Array<keyof T>) {
    const field = spec[key];
    const raw = process.env[field.env] ?? field.default;

    if (raw === undefined || raw === "") {
      if (field.required) {
        throw new Error(`Missing required environment variable: ${field.env}`);
      }
      continue;
    }

    config[key] = field.parse ? field.parse(raw) : (raw as T[keyof T]);
  }

  return config as T;
};
