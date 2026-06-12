import { randomUUID } from "node:crypto";
import type { CatalogClient } from "../clients/catalogClient.js";
import { orderValidationError } from "./errors.js";
import type { Customer } from "./models.js";
import type {
  PlaceOrderLineInput,
  PricedOrderLine
} from "./placeOrderTypes.js";
import type { RequestContext } from "../requestContext.js";

export interface MaterializedOrderLine extends PricedOrderLine {
  id: string;
}

export const validateOrderLines = (lines: PlaceOrderLineInput[]): void => {
  if (lines.length === 0) {
    throw orderValidationError("ORDER_LINES_REQUIRED", "At least one order line is required");
  }

  const seen = new Set<string>();
  for (const line of lines) {
    if (line.qty < 1) {
      throw orderValidationError("ORDER_LINE_QTY_INVALID", "Order line qty must be at least 1", {
        productId: line.productId,
        qty: line.qty
      });
    }
    if (seen.has(line.productId)) {
      throw orderValidationError(
        "DUPLICATE_ORDER_LINE",
        "Duplicate product lines must be merged by the caller",
        { productId: line.productId }
      );
    }
    seen.add(line.productId);
  }
};

export const priceLines = async (
  catalog: CatalogClient,
  customer: Customer,
  lines: PlaceOrderLineInput[],
  ctx: RequestContext
): Promise<MaterializedOrderLine[]> => {
  validateOrderLines(lines);

  const priced: MaterializedOrderLine[] = [];
  for (const line of lines) {
    await catalog.getProduct(line.productId, { ...ctx, productId: line.productId });
    const price = await catalog.getPrice(
      line.productId,
      {
        customerTier: customer.tier,
        currency: customer.currency,
        qty: line.qty
      },
      { ...ctx, productId: line.productId }
    );

    priced.push({
      id: randomUUID(),
      productId: line.productId,
      qty: line.qty,
      unitPriceCents: price.unitPriceCents,
      lineTotalCents: price.unitPriceCents * line.qty
    });
  }

  return priced;
};

export const calculateSubtotal = (lines: PricedOrderLine[]): number =>
  lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
