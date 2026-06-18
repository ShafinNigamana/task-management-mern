import dns from 'node:dns';

import mongoose from 'mongoose';
import Team from '../models/Team.js';
import User from '../models/User.js';

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

const runMigrations = async () => {
  try {
    const unownedTeamsCount = await Team.countDocuments({
      $or: [
        { managerId: { $exists: false } },
        { managerId: null }
      ]
    });

    if (unownedTeamsCount > 0) {
      console.log(`Found ${unownedTeamsCount} unowned teams. Running migration...`);
      const defaultManager = await User.findOne({ role: 'manager' });
      if (defaultManager) {
        const result = await Team.updateMany(
          {
            $or: [
              { managerId: { $exists: false } },
              { managerId: null }
            ]
          },
          { $set: { managerId: defaultManager._id } }
        );
        console.log(`Successfully migrated ${result.modifiedCount} teams to default manager (${defaultManager.email})`);
      } else {
        console.warn('Migration warning: No user with role of "manager" found in database to assign team ownership.');
      }
    }
  } catch (err) {
    console.error('Failed to execute team ownership database migrations:', err.message);
  }
};

const connectMongoDB = async () => {
  try {
    const { servers, source } = applyDnsServers();

    if (source !== 'system') {
      console.log(`MongoDB DNS servers: ${servers.join(', ')}`);
    }

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);

    console.log('MongoDB connected successfully');
    
    // Trigger unowned teams migration
    runMigrations();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    process.exit(1);
  }
};

const getMongoHealthStatus = () => (mongoose.connection.readyState === 1 ? 'ok' : 'error');

export { getMongoHealthStatus };
export default connectMongoDB;