export type ScenarioState = {
  cycle: number;
  lastProductIds: string[];
  lastOrderIds: string[];
  lastPaymentIntentIds: string[];
  nextCustomerIndex: number;
};

export const createScenarioState = (): ScenarioState => ({
  cycle: 0,
  lastProductIds: [],
  lastOrderIds: [],
  lastPaymentIntentIds: [],
  nextCustomerIndex: 0
});
