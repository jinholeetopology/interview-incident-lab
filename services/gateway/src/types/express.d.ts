declare global {
  namespace Express {
    interface Request {
      id?: string;
      auth?: {
        apiKey: string;
        keyHash: string;
      };
    }
  }
}

export {};
