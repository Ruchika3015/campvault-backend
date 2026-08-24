import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import userRouter from './routes/userRoute.js';
import collegeRouter from './routes/collegeRoute.js';
import jugaadRouter from './routes/jugaadRoute.js';
import proposalRouter from './routes/proposalRoute.js';
import conversationRouter from './routes/conversationRoute.js';
import notificationRouter from './routes/notificationRoute.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// ================================================================
// CORS
// ================================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true
  })
);

// ================================================================
// BODY PARSING
// ================================================================

app.use(express.json());

// ================================================================
// HEALTH CHECK
// ================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'CampusJugaad core operational.'
  });
});

// ================================================================
// API ROUTES
// ================================================================

app.use('/api/v1/users', userRouter);
app.use('/api/v1/colleges', collegeRouter);
app.use('/api/v1/jugaads', jugaadRouter);
app.use('/api/v1/proposals', proposalRouter);
app.use('/api/v1/conversations', conversationRouter);
app.use('/api/v1/notifications', notificationRouter);

// ================================================================
// ERROR HANDLER
// ================================================================

app.use(errorHandler);

export default app;