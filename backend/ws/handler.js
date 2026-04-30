const { WebSocketServer, WebSocket } = require('ws');
const { verifyToken } = require('../utils/jwt');

let wss = null;

function getTokenFromProtocolHeader(header) {
  if (!header) return null;
  return String(header).split(',')[0].trim();
}

function initWebSocket(server) {
  wss = new WebSocketServer({
    server,
    verifyClient(info, done) {
      const token = getTokenFromProtocolHeader(info.req.headers['sec-websocket-protocol']);

      try {
        info.req.user = verifyToken(token);
        done(true);
      } catch (err) {
        done(false, 401, 'Unauthorized');
      }
    },
  });

  wss.on('connection', (ws, req) => {
    ws.user = req.user;

    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message);
    });
  });

  console.log('[WS] WebSocket server initialized');
}

function broadcastTickerUpdate(ticker, price) {
  broadcastAll({
    type: 'TICKER_UPDATE',
    payload: {
      ticker,
      price,
    },
  });
}

function broadcastAll(payload) {
  if (!wss) return;

  const data = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = { initWebSocket, broadcastTickerUpdate };
