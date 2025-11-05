# SlotSwapper - Peer-to-Peer Time-Slot Scheduling

A full-stack web application for swapping calendar time slots between users.

## 🎯 What It Does

Swap scheduled time slots (work shifts, appointments, meetings) with other users through a marketplace system.

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **DevOps**: Docker & Docker Compose

## ✨ Key Features

- JWT authentication
- Event management (CRUD)
- Swap marketplace
- Request system with transaction safety
- Responsive UI

## 🚀 Quick Start (Local)

**Prerequisites**: Docker Desktop

```bash
# Clone and start
git clone https://github.com/Nitish151/serviceHire.git
cd serviceHire
docker compose up --build

# Access at http://localhost:3000
```

**Services**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: PostgreSQL on port 5432

## 🌐 Deploy to Production


## 📚 API Endpoints

**Base URL**: `http://localhost:5000/api`

### Auth
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login

### Events (Protected)
- `GET /events` - Get user's events
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Swaps (Protected)
- `GET /swappable-slots` - Browse marketplace
- `POST /swap-request` - Create swap request
- `GET /swap-requests` - Get requests (incoming/outgoing)
- `POST /swap-response/:requestId` - Accept/reject request


## 📁 Project Structure

```
serviceHire/
├── backend/          # Express API, Prisma ORM
├── frontend/         # Next.js 14, Tailwind CSS
└── docker-compose.yml
```

## 🎨 Architecture Highlights

- **Transaction Safety**: Prisma transactions ensure atomic swaps
- **Protected Routes**: JWT authentication with route guards
- **Type Safety**: Full TypeScript across stack
- **Responsive Design**: Tailwind CSS utility classes

---

Built with Next.js, Node.js, PostgreSQL & Docker
