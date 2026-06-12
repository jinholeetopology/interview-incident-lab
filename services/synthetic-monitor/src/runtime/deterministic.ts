import { createHash } from "node:crypto";

export const deterministicUuid = (label: string): string => {
  const hex = createHash("sha256").update(`synthetic-monitor:${label}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}`,
    hex.slice(20, 32)
  ].join("-");
};

export const isoDate = (date = new Date()): string => date.toISOString().slice(0, 10);
