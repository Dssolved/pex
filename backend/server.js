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

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN_PREVIEW,
].filter(Boolean);

const allowedOriginPatterns = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/i];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some((pattern) => pattern.test(origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
