export const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export const SUPPORTED_PROXY_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;

export type ProxyMethod = (typeof SUPPORTED_PROXY_METHODS)[number];
