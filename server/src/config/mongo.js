import dns from 'node:dns';

import mongoose from 'mongoose';

const DEFAULT_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

const parseDnsServers = (value) =>
  value
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

const applyDnsServers = () => {
  const configuredServers = parseDnsServers(process.env.MONGODB_DNS_SERVERS);

  if (configuredServers?.length) {
    dns.setServers(configuredServers);
    return { servers: configuredServers, source: 'env' };
  }

  if (process.env.NODE_ENV !== 'production') {
    dns.setServers(DEFAULT_DNS_SERVERS);
    return { servers: DEFAULT_DNS_SERVERS, source: 'fallback' };
  }

  return { servers: dns.getServers(), source: 'system' };
};

const connectMongoDB = async () => {
  try {
    const { servers, source } = applyDnsServers();

    if (source !== 'system') {
      console.log(`MongoDB DNS servers: ${servers.join(', ')}`);
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    process.exit(1);
  }
};

const getMongoHealthStatus = () => (mongoose.connection.readyState === 1 ? 'ok' : 'error');

export { getMongoHealthStatus };
export default connectMongoDB;