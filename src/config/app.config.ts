import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  cache: {
    namespace: process.env.CACHE_NAMESPACE || 'taskflow',
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || `300`, 10) || 300,
  },
})); 