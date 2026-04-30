require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { initWebSocket } = require('./ws/handler');

const authRouter = require('./routes/auth');
const stocksRouter = require('./routes/stocks');
const portfolioRouter = require('./routes/portfolio');
const tradesRouter = require('./routes/trades');

const PORT = process.env.PORT || 4000;

connectDB();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/auth', authRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/trades', tradesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
