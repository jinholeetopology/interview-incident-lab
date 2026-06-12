import { randomUUID } from "node:crypto";
import { invalidateOrderCache } from "./cacheInvalidation.js";
import { compensateOrderFailure } from "./compensation.js";
import { isErrorCode, orderError, orderValidationError } from "./errors.js";
import { paymentIdempotencyKey } from "./idempotencyKeys.js";
import { calculateSubtotal, priceLines } from "./priceLines.js";
import type {
  CompensationState,
  PlaceOrderDeps,
  PlaceOrderInput,
  PlaceOrderResult
} from "./placeOrderTypes.js";
import type { RequestContext } from "../requestContext.js";
import type { Order } from "./models.js";

export const placeOrder = async (
  deps: PlaceOrderDeps,
  input: PlaceOrderInput,
  ctx: RequestContext
): Promise<PlaceOrderResult> => {
  const customer = await deps.customers.findById(input.customerId);
  if (!customer) {
    throw orderValidationError("CUSTOMER_NOT_FOUND", "Customer was not found", {
      customerId: input.customerId
    });
  }

  const pricedLines = await priceLines(deps.catalog, customer, input.lines, {
    ...ctx,
    customerId: customer.id
  });
  const subtotalCents = calculateSubtotal(pricedLines);
  const totalCents = subtotalCents;
  const orderId = randomUUID();
  const orderCtx = { ...ctx, orderId, customerId: customer.id };

  await deps.orders.createPending({
    id: orderId,
    customerId: customer.id,
    currency: customer.currency,
    subtotalCents,
    totalCents,
    items: pricedLines
  });
  await invalidateOrderCache(deps.cache, orderId);

  const compensation: CompensationState = { orderId, ctx: orderCtx };
  let confirmedOrder: Order | null = null;

  try {
    const reservation = await deps.inventory.createReservation(
      {
        orderId,
        lines: pricedLines.map((line) => ({
          productId: line.productId,
          qty: line.qty
        }))
      },
      orderCtx
    );
    compensation.reservationId = reservation.id;
    await deps.orders.markReserved(orderId, reservation.id);
    await invalidateOrderCache(deps.cache, orderId);

    const paymentKey = paymentIdempotencyKey(orderId);
    const intent = await deps.payments.createIntent(
      {
        orderId,
        amountCents: totalCents,
        currency: customer.currency,
        idempotencyKey: paymentKey
      },
      orderCtx
    );
    compensation.paymentIntentId = intent.id;
    await deps.orders.attachPaymentIntent(orderId, intent.id);
    await invalidateOrderCache(deps.cache, orderId);

    await deps.payments.captureIntent(intent.id, { idempotencyKey: paymentKey }, orderCtx);
    await deps.inventory.commitReservation(reservation.id, orderCtx);
    confirmedOrder = await deps.orders.markConfirmed(orderId);
  } catch (err) {
    if (isErrorCode(err, "INSUFFICIENT_STOCK")) {
      await deps.orders.markFailed(orderId);
      await invalidateOrderCache(deps.cache, orderId);
      throw err;
    }

    let compensationError: unknown;
    try {
      await compensateOrderFailure(deps, compensation);
    } catch (compErr) {
      compensationError = compErr;
      deps.logger.error("order compensation failed", {
        ...orderCtx,
        error: compErr instanceof Error ? compErr.message : String(compErr)
      });
    } finally {
      await deps.orders.markFailed(orderId);
      await invalidateOrderCache(deps.cache, orderId);
    }

    if (compensationError) {
      throw compensationError;
    }
    throw err;
  }

  await invalidateOrderCache(deps.cache, orderId);
  if (!confirmedOrder) {
    throw orderError("ORDER_CONFIRMATION_MISSING", "Order confirmation was not recorded", 500, {
      orderId
    });
  }
  return { order: confirmedOrder };
};
