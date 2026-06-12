import { z } from 'zod';
import { SUPPORTED_PROXY_METHODS } from '../constants/http.js';

export const proxyMethodSchema = z.enum(SUPPORTED_PROXY_METHODS);
