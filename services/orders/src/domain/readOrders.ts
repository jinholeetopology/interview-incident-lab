import type { Cache } from "@atlas/shared";
import { orderCacheKey, orderTimelineCacheKey } from "../cacheKeys.js";
import type { OrderListFilter, OrderRepository } from "../repositories/orderRepository.js";
import type { ShipmentRepository, TimelineRepository } from "../repositories/index.js";
import type { Order, OrderTimeline } from "./models.js";
import type { ListResult, Page } from "./pagination.js";

export interface ReadOrderDeps {
  cache: Cache;
  orders: OrderRepository;
  shipments: ShipmentRepository;
  timelines: TimelineRepository;
}

export const getOrder = (
  deps: ReadOrderDeps,
  orderId: string
): Promise<Order> =>
  deps.cache.withCache(orderCacheKey(orderId), 30, () =>
    deps.orders.findByIdOrThrow(orderId)
  );

export const listOrders = (
  deps: Pick<ReadOrderDeps, "orders">,
  filter: OrderListFilter,
  page: Page
): Promise<ListResult<Order>> => deps.orders.list(filter, page);

export const getOrderTimeline = async (
  deps: ReadOrderDeps,
  orderId: string
): Promise<OrderTimeline> =>
  deps.cache.withCache(orderTimelineCacheKey(orderId), 15, async () => {
    const order = await deps.orders.findByIdOrThrow(orderId);
    const shipment = await deps.shipments.findByOrderId(orderId);
    return deps.timelines.assemble(order, shipment);
  });
