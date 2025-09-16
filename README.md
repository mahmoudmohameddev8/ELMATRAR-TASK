# Loyalty Transfers – API (Node + Mongo)

Minimal, production-ready Express API for point transfers with **holds**, **10-min expiry**, **auto-refunds**, and **JWT auth**.

## Stack
Express · Mongoose · JWT · Joi · In-process scheduler (every 30s)

## Requirements
- Node.js 18+
- MongoDB (Replica Set recommended for full ACID; works without it using safe conditional updates)

## Environment
Create `.env` in project root:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/ELMATARTASK
DB_NAME=almatarloyalty
TOKEN_SECRET=your_jwt_secret
BEARER_KEY=TEST__
SALT_ROUND=8
REGISTRATION_POINTS=500
```

## Install & Run
```bash
npm i
npm run dev   # or: node index.js
```
Server boot order in `index.js`: connect DB → start expire scheduler → mount routes.

## Data Models
**User**: `{ name, email (unique), password, points, pending }`  
**Transfer**: `{ sender, receiver, amount, status[pending|confirmed|expired], heldAt, expiresAt, refunded }`  
**Token** (optional allow-list): `{ token, user, isvalid }`

## Auth
- Register/Login returns JWT.
- Send token via either header:
  - `Authorization: Bearer <JWT>`
  - `token: TEST__<JWT>`

## Endpoints
### Auth
- `POST /auth/register` → body: `{ "username":"John", "email":"john@example.com", "password":"secret123" }`
- `POST /auth/login` → body: `{ "email":"john@example.com", "password":"secret123" }`

### Transactions
- `POST /transactions/makeTransfer`  
  Body: `{ "email":"receiver@example.com", "amount":150 }`  
  Blocks **self-transfer**. Creates **pending** with `expiresAt = now + 10m`; moves `points → pending`.
- `POST /transactions/confirmTransfer`  
  Body: `{ "transferId":"<id>" }`  
  If valid: `sender.pending → receiver.points` and status `confirmed`.  
  If expired: immediate **refund** and error `400`.
- `GET /transactions/myPoints` → returns `{ points, pending }`
- `GET /transactions/myTransactions`  
  Query: `type=all|sent|received`, `status`, `page`, `limit`, `sort=newest|oldest`  
  Returns items **without IDs**, includes sender/receiver `{ email, username }`.

## Scheduler
Runs every **30s**:
1. Marks overdue `pending` (by `expiresAt`) → `expired`  
2. Refunds once (`refunded=true`): `sender.pending → sender.points`



## Troubleshooting
- **JWT 401** → ensure headers and valid/active token
- **Refund delay** → scheduler interval is 30s (adjust `EVERY_MS` in `expire.worker.js`)
- **No transactions updated** → confirm DB connected; Replica Set recommended

---

### Quick Summary
- Transfer creates a **pending hold** for 10 minutes, then auto-refunds if unconfirmed.  
- Confirm within 10 minutes: moves from `pending` to receiver’s points.  
- Self-transfers are blocked.  
- Scheduler runs every 30s to expire and refund.
