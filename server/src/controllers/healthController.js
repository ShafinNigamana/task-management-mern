import { getMongoHealthStatus } from '../config/mongo.js';
import { getMySQLHealthStatus } from '../config/mysql.js';

export const getHealthStatus = async (req, res) => {
  const [mongo, mysql] = await Promise.all([getMongoHealthStatus(), getMySQLHealthStatus()]);

  const hasFailure = mongo !== 'ok' || mysql !== 'ok';

  res.status(hasFailure ? 503 : 200).json({
    status: hasFailure ? 'error' : 'ok',
    db: {
      mongo: mongo === 'ok' ? 'connected' : 'disconnected',
      mysql: mysql === 'ok' ? 'connected' : 'disconnected'
    }
  });
};
