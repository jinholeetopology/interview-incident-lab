export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

export const addSeconds = (date: Date, seconds: number): Date =>
  new Date(date.getTime() + seconds * 1_000);
