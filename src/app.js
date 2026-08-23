import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/userRoute.js';
import collegeRouter from './routes/collegeRoute.js';
import jugaadRouter from './routes/jugaadRoute.js';
import proposalRouter from './routes/proposalRoute.js';
import conversationRouter from './routes/conversationRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import { errorHandler } from './middleware/errorHandler.js';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'CampusJugaad core operational.' });
});

// Mount Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/colleges', collegeRouter);
app.use('/api/v1/jugaads', jugaadRouter);
app.use('/api/v1/proposals', proposalRouter);
app.use('/api/v1/conversations', conversationRouter);
app.use('/api/v1/notifications', notificationRouter);

// Error Handling Middleware
app.use(errorHandler);


export default app;

