import type { NextFunction, Request, Response } from "express";
import type { InventoryDeps } from "../deps.js";
import { requestContext } from "./requestContext.js";
import {
  createReservationBodySchema,
  reservationIdParamsSchema
} from "./reservationSchemas.js";
import { reservationResponse } from "./responseMappers.js";
import { parseRequest } from "./validation.js";

export const createReservation = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = parseRequest(createReservationBodySchema, req.body);
    deps.logger.info("reservation create requested", {
      ...requestContext(req),
      orderId: body.orderId,
      lineCount: body.lines.length
    });
    const reservation = await deps.reservationService.createReservation(body);
    res.status(201).json(reservationResponse(reservation));
  } catch (err) {
    next(err);
  }
};

export const commitReservation = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = parseRequest(reservationIdParamsSchema, req.params);
    deps.logger.info("reservation commit requested", {
      ...requestContext(req),
      reservationId: params.id
    });
    const reservation = await deps.reservationService.commitReservation(params.id);
    res.json(reservationResponse(reservation));
  } catch (err) {
    next(err);
  }
};

export const releaseReservation = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = parseRequest(reservationIdParamsSchema, req.params);
    deps.logger.info("reservation release requested", {
      ...requestContext(req),
      reservationId: params.id
    });
    const reservation = await deps.reservationService.releaseReservation(params.id);
    res.json(reservationResponse(reservation));
  } catch (err) {
    next(err);
  }
};
