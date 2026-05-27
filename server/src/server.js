import dotenv from 'dotenv';

import app from './app.js';
import connectMongoDB from './config/mongo.js';
import { connectMySQL } from './config/mysql.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectMongoDB();
    await connectMySQL();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
  }
};

startServer();