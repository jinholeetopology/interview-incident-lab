export interface ProxyPathMapping {
  upstreamPath: string;
  apiPrefix: string;
}

export const stripProxyPrefix = (originalUrl: string, apiPrefix: string): ProxyPathMapping => {
  const queryStart = originalUrl.indexOf('?');
  const pathPart = queryStart === -1 ? originalUrl : originalUrl.slice(0, queryStart);
  const queryPart = queryStart === -1 ? '' : originalUrl.slice(queryStart);
  const normalizedPrefix = apiPrefix.endsWith('/') ? apiPrefix.slice(0, -1) : apiPrefix;

  if (pathPart !== normalizedPrefix && !pathPart.startsWith(`${normalizedPrefix}/`)) {
    throw new Error(`Path ${pathPart} does not match gateway prefix ${normalizedPrefix}`);
  }

  const stripped = pathPart.slice(normalizedPrefix.length);
  const upstreamPath = stripped.length === 0 ? '/' : stripped;

  return {
    apiPrefix: normalizedPrefix,
    upstreamPath: `${upstreamPath}${queryPart}`
  };
};
