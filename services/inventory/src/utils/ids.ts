import { randomUUID } from "node:crypto";

export type IdGenerator = () => string;

export const uuid: IdGenerator = () => randomUUID();
