
import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from 'config';

const redisClient = createClient({
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    connectTimeout: 5000,
      family: 4, // 👈 force IPv4
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

 const connectRedis = async () => {
 try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
}
export {connectRedis}

export default redisClient;

