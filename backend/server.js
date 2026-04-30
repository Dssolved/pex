require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { initWebSocket } = require("./ws/handler");

const authRouter = require("./routes/auth");
const stocksRouter = require("./routes/stocks");
const portfolioRouter = require("./routes/portfolio");
const tradesRouter = require("./routes/trades");

const PORT = process.env.PORT || 4000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "PEX backend is running",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/stocks", stocksRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/trades", tradesRouter);

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
