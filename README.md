# PEX - Personal Exchange

Simple real-time trading project for the midterm criteria.

## Stack

- Backend: Node.js, Express, Mongoose, native `ws`
- Frontend: Next.js / React
- Database: MongoDB
- Styles: plain CSS modules

## What is implemented

- Register and login
- Each new user starts with `$10,000`
- Each user can create one unique stock ticker
- Only the stock owner can update their stock price
- If another user tries to update someone else's stock through API, backend returns `403 Forbidden`
- WebSocket uses native `ws`, not socket.io
- JWT is passed during WebSocket connection through `Sec-WebSocket-Protocol`
- Price update flow:
  1. frontend sends PATCH API request
  2. backend updates MongoDB
  3. backend broadcasts this exact WebSocket message:

```json
{ "type": "TICKER_UPDATE", "payload": { "ticker": "XYZ", "price": 155.2 } }
```

- Frontend recalculates virtual net worth by itself:

```txt
Wallet Balance + Shares Held * Current Price
```

The project does not store total net worth in MongoDB.

## 1. Requirements

Install:

- Node.js
- MongoDB

MongoDB can be local MongoDB Compass / Community Server, or MongoDB Atlas.

## 2. Backend setup

Open terminal in backend folder:

```bash
cd backend
npm install
```

Create `.env` or use the included one:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pex
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=change_this_secret_for_dev
```

Run backend:

```bash
npm run dev
```

Expected result:

```txt
[DB] MongoDB connected successfully
[WS] WebSocket server initialized
[Server] Listening on http://localhost:4000
```

## 3. Frontend setup

Open second terminal in frontend folder:

```bash
cd frontend
npm install
```

Use `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

Run frontend:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## 4. How to test

### Test 1 - create two users

Open normal browser window:

1. Register user `andrey`, password `1234`
2. Create ticker `AND`, name `Andrey Corp`, price `100`

Open incognito or another browser:

1. Register user `artem`, password `1234`
2. Create ticker `ART`, name `Artem Corp`, price `50`

### Test 2 - buy shares

In `andrey` browser:

1. Find `$ART`
2. Enter `10` shares
3. Click `Buy`

Wallet should decrease by `$500`.
Your holdings should show `10 ART`.
Virtual Net Worth should still be calculated on frontend.

### Test 3 - real-time price update

Keep both browsers open.

In `artem` browser:

1. Find own stock `$ART`
2. Enter new price `80`
3. Click `Update`

In `andrey` browser:

1. `$ART` price updates without page refresh
2. Virtual Net Worth changes automatically

This proves WebSocket broadcast works.

### Test 4 - owner protection

Use Postman or REST Client.
Login as `andrey`, copy token, then try to update `ART`:

```http
PATCH http://localhost:4000/api/stocks/ART/price
Authorization: Bearer ANDREY_TOKEN
Content-Type: application/json

{
  "price": 999
}
```

Expected result:

```txt
403 Forbidden
```

Because only `artem`, the owner of `$ART`, can change `$ART` price.

### Test 5 - WebSocket JWT handshake

In frontend code, WebSocket connects like this:

```js
new WebSocket(WS_URL, token)
```

The second argument becomes the `Sec-WebSocket-Protocol` header in the browser WebSocket handshake.
Backend reads this header and verifies JWT before accepting the socket.

## Main files

### Backend

- `backend/server.js` - starts Express and WebSocket server
- `backend/ws/handler.js` - WebSocket handshake and broadcast
- `backend/routes/auth.js` - register/login
- `backend/routes/stocks.js` - create stock and update price
- `backend/routes/trades.js` - buy/sell shares
- `backend/routes/portfolio.js` - wallet and holdings
- `backend/models/User.js`
- `backend/models/Stock.js`
- `backend/models/Holding.js`
- `backend/models/Trade.js`

### Frontend

- `frontend/app/login/page.js` - login/register page
- `frontend/app/market/page.js` - main market page
- `frontend/app/market/page.module.css` - market styles
- `frontend/app/login/page.module.css` - login styles
