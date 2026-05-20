import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Task Management API running',
  });
});

export default app;