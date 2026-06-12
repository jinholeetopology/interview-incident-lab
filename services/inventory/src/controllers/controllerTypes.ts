import type { Request } from "express";

export type RequestWithId = Request & {
  id?: string;
};
