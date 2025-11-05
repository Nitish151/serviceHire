# SlotSwapper - Peer-to-Peer Time-Slot Scheduling

A full-stack web application that allows users to create calendar events and swap time slots with other users through a marketplace system.

## 🎯 Design Choices

- **Next.js 14 (App Router)**: Modern React framework with server components and improved routing
- **Tailwind CSS**: Utility-first CSS for rapid UI development and consistent styling
- **Prisma ORM**: Type-safe database client with excellent TypeScript integration
- **JWT Authentication**: Stateless authentication for scalability
- **Monorepo Structure**: Separate frontend/backend for independent deployment

## 🛠 Tech Stack

**Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Axios  
**Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL  
**Deployment**: Vercel (Frontend), Render (Backend + DB)

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/Nitish151/serviceHire.git
cd serviceHire
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/slotswapper"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development' > .env

# Setup database
npx prisma generate
npx prisma migrate dev

# Start server
npm run dev
```
Backend runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env.local file
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' > .env.local

# Start frontend
npm run dev
```
Frontend runs on: `http://localhost:3000`

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/events` | Get user's events | ✅ |
| POST | `/api/events` | Create event | ✅ |
| PUT | `/api/events/:id` | Update event | ✅ |
| DELETE | `/api/events/:id` | Delete event | ✅ |
| GET | `/api/swappable-slots` | Browse marketplace | ✅ |
| POST | `/api/swap-request` | Request swap | ✅ |
| GET | `/api/swap-requests` | Get all requests | ✅ |
| POST | `/api/swap-response/:id` | Accept/reject swap | ✅ |

### Example Requests

**Signup:**
```bash
POST /api/auth/signup
Body: { "name": "John", "email": "john@example.com", "password": "pass123" }
Returns: { "token": "jwt-token", "user": { "id": "uuid", "name": "John", "email": "john@example.com" } }
```

**Login:**
```bash
POST /api/auth/login
Body: { "email": "john@example.com", "password": "pass123" }
Returns: { "token": "jwt-token", "user": { "id": "uuid", "name": "John", "email": "john@example.com" } }
```

**Get User's Events:**
```bash
GET /api/events
Headers: { "Authorization": "Bearer <token>" }
Returns: [{ "id": "uuid", "title": "Meeting", "startTime": "2025-11-10T10:00:00Z", "endTime": "2025-11-10T11:00:00Z", "status": "BUSY", "userId": "uuid" }]
```

**Create Event:**
```bash
POST /api/events
Headers: { "Authorization": "Bearer <token>" }
Body: { "title": "Meeting", "startTime": "2025-11-10T10:00:00Z", "endTime": "2025-11-10T11:00:00Z", "status": "BUSY" }
Returns: { "id": "uuid", "title": "Meeting", "startTime": "2025-11-10T10:00:00Z", "endTime": "2025-11-10T11:00:00Z", "status": "BUSY", "userId": "uuid" }
```

**Update Event:**
```bash
PUT /api/events/:id
Headers: { "Authorization": "Bearer <token>" }
Body: { "status": "SWAPPABLE" }
Returns: { "id": "uuid", "title": "Meeting", "status": "SWAPPABLE", ... }
```

**Delete Event:**
```bash
DELETE /api/events/:id
Headers: { "Authorization": "Bearer <token>" }
Returns: { "message": "Event deleted successfully" }
```

**Browse Swappable Slots:**
```bash
GET /api/swappable-slots
Headers: { "Authorization": "Bearer <token>" }
Returns: [{ "id": "uuid", "title": "Slot", "startTime": "...", "endTime": "...", "status": "SWAPPABLE", "user": { "name": "Other User" } }]
```

**Create Swap Request:**
```bash
POST /api/swap-request
Headers: { "Authorization": "Bearer <token>" }
Body: { "mySlotId": "uuid", "theirSlotId": "uuid" }
Returns: { "id": "uuid", "status": "PENDING", "requesterId": "uuid", "recipientId": "uuid", ... }
```

**Get Swap Requests:**
```bash
GET /api/swap-requests
Headers: { "Authorization": "Bearer <token>" }
Returns: { 
  "incoming": [{ "id": "uuid", "status": "PENDING", "requester": {...}, "mySlot": {...}, "theirSlot": {...} }],
  "outgoing": [{ "id": "uuid", "status": "PENDING", "recipient": {...}, "mySlot": {...}, "theirSlot": {...} }]
}
```

**Accept/Reject Swap:**
```bash
POST /api/swap-response/:id
Headers: { "Authorization": "Bearer <token>" }
Body: { "accepted": true }
Returns: { "message": "Swap request accepted", "swapRequest": {...} }
```

## 🌐 Live Deployment

- **Frontend**: https://service-hire.vercel.app
- **Backend API**: https://slotswapper-backend-sx7f.onrender.com/api

**⚠️ Testing Note**: To test swap functionality, open the app in **two different browsers** (e.g., Chrome and Firefox) and create two separate user accounts. Using the same browser with different tabs may cause authentication conflicts due to shared localStorage tokens.

## 💭 Assumptions & Challenges

### Assumptions
- Users can only swap "SWAPPABLE" events (not BUSY ones)
- One-to-one swaps (my slot for your slot)
- Accepted swaps are permanent (no undo)
- Each user manages their own calendar

### Challenges Faced
1. **Next.js Environment Variables**: `NEXT_PUBLIC_*` vars need special handling - used hardcoded fallback in `api.ts`
2. **CORS in Production**: Required regex pattern to match Vercel preview deployments
3. **Render Free Tier**: No shell access - used `prisma db push` instead of migrations
4. **Auth Context Bug**: Was using raw `axios` instead of configured API instance, causing relative URL issues

## 📁 Project Structure

```
serviceHire/
├── frontend/
│   └── src/
│       ├── app/         # Next.js pages (App Router)
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth context provider
│       └── utils/       # API client configuration
├── backend/
│   ├── src/
│   │   ├── routes/      # Express route handlers
│   │   ├── middleware/  # JWT auth middleware
│   │   └── server.ts    # Express app setup
│   └── prisma/
│       └── schema.prisma # Database schema
└── render.yaml          # Render deployment config
```

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Protected API routes with middleware
- CORS configured for specific origins
- SQL injection prevention via Prisma

---

Built with ❤️ using Next.js, Express, and PostgreSQL
