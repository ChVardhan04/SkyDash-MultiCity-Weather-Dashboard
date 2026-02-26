#  SkyDash - Multi-City Weather Dashboard

 A production-quality, full-stack weather dashboard with AI-powered insights


---

##  Project Overview

SkyDash is a multi-user weather dashboard application where each user gets a fully isolated, personalized experience. Users can track weather across multiple cities, mark favorites, get AI-generated insights, and visualize data through multiple views.


---

##  Chosen Tech Stack

### Frontend: Next.js 14 + Tailwind CSS
**Why Next.js:** App Router provides excellent DX with server/client component separation, built-in routing, and image optimization. Tailwind enables rapid, consistent UI development without a design system bottleneck.

### Backend: Node.js + Express
**Why Express:** Lightweight, explicit, and widely understood. For this domain (REST API, auth, third-party proxying) Express is appropriately minimal. FastAPI or NestJS would be overkill for the feature set required.

### Database: MongoDB + Mongoose
**Why MongoDB:** User and city data is document-oriented and schema-flexible. There's no relational complexity requiring joins-each user's cities are a simple embedded query. Mongoose provides validation, virtual fields, and middleware hooks that streamline the data layer.

### AI: OpenAI GPT-4o mini (LangChain-style agentic architecture)
**Why GPT-4o mini over LangChain framework:** I implemented the agentic loop manually rather than using LangChain to avoid unnecessary abstraction overhead. The agent uses OpenAI's native function calling API with a custom tool execution loop-this gives full control, is easier to debug, and avoids LangChain's version instability. The architecture is functionally equivalent to LangChain's AgentExecutor.

### Trade-offs
- MongoDB over PostgreSQL: Slightly weaker consistency guarantees, but no joins needed and horizontal scaling is simpler
- Manual agent loop vs LangChain: More code to write, but fully transparent and debuggable
- No Redis cache: Simple in-memory cache used instead; acceptable for this scale, but Redis would be needed in production for multi-instance deployments

---

##  Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- No weather API key needed! (uses Open-Meteo & Nominatim - both 100% free)
- OpenAI API key (optional, for AI features)

### Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your values

npm run dev
# Server starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000

npm run dev
# App starts on http://localhost:3000
```

### Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weather-dashboard
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
# No weather API key needed - Open-Meteo is free with no registration
OPENAI_API_KEY=<your-key>        # Optional for AI features
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

##  Architecture

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│  Next.js 14 (App Router)                    │
│  - /login, /register, /dashboard            │
│  - AuthContext (JWT management)             │
│  - API client with interceptors             │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│                  BACKEND                     │
│  Express API Server                         │
│  ┌──────────┬───────────┬────────────────┐  │
│  │  /auth   │  /cities  │   /weather     │  │
│  │  /ai     │           │                │  │
│  └──────────┴───────────┴────────────────┘  │
│  ┌─────────────────────────────────────────┐ │
│  │  Middleware: auth, rate-limit, helmet   │ │
│  └─────────────────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Weather Service │  │    AI Service    │  │
│  │  (OWM API +      │  │  (Agentic loop   │  │
│  │   in-mem cache)  │  │   with tools)    │  │
│  └──────────────────┘  └──────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │      MongoDB         │
        │  Users  │  Cities    │
        └─────────────────────┘
```

---

##  Authentication & Authorization

**Approach:** JWT (JSON Web Tokens) with Bearer token authentication.

- Passwords hashed with bcrypt (cost factor 12)
- JWTs signed with HS256, expire in 7 days
- Every protected route validates token via `protect` middleware
- **Data isolation enforced at DB query level:** every city query includes `user: req.user._id` - even if a user discovers another user's city ID, they cannot access or modify it
- Rate limiting (100 req/15min) prevents brute-force attacks
- Helmet.js sets security headers

**Why not sessions?** JWTs are stateless and work naturally with Next.js API calls without cookie complexity.

---

##  AI Agent Design

The AI agent (`SkyMind`) is implemented as an agentic loop using OpenAI's function calling API:

```
User Message
     ↓
System Prompt (includes all city weather data in context)
     ↓
GPT-4o mini with tool definitions
     ↓
If tool_calls → execute tools → append results → loop back
If no tool_calls → return final response
     ↓
Response to user
```

**Tools available to the agent:**
1. `analyze_weather_comparison` - Compare cities by temperature, wind, ideal travel conditions
2. `get_activity_recommendation` - Suggest activities based on weather conditions
3. `check_extreme_conditions` - Alert on dangerous weather patterns

**Why this design:** The agentic loop allows the model to reason step-by-step and use tools when needed rather than hallucinating answers. The tools are deterministic and operate on real data already fetched, so no additional API calls are made during the agent loop.

**City-level insights:** A separate endpoint generates single-sentence insights for individual city cards, cached for 1 hour to minimize API costs.

---

##  Creative Custom Feature: Weather Intelligence Dashboard

**What it is:** A "Stats" view (accessible via the dashboard view switcher) that provides:
- Hottest/coolest/windiest/most humid city across your tracked network
- Network-wide average temperature and humidity
- Visual temperature comparison bar chart
- Automatic extreme weather alerts (heat > 35°C, frost, high winds, thunderstorms)
- Weather condition breakdown (how many cities are clear vs rainy vs cloudy)

**Problem it solves:** When you're tracking 10+ cities, the grid of cards becomes information-dense. The Stats view gives you a bird's-eye summary - useful for travelers deciding where to go, or remote workers deciding which office city to visit.

**Why this is interesting:** It transforms the dashboard from a collection of widgets into an actual decision-support tool.

---

##  Key Design Decisions & Trade-offs

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Caching | In-memory (10min TTL) | Redis | Simpler; single instance acceptable |
| City uniqueness | lat/lon composite index | Name match | More accurate; handles cities with same name |
| Token refresh | None (7d expiry) | Refresh tokens | Simpler; acceptable security trade-off |
| AI context | Full city weather in prompt | Vector search | Dataset small enough for direct inclusion |
| Map view | SVG + CSS | Leaflet/Mapbox | No external map API key needed |

---

##  Known Limitations

- AI chat requires an OpenAI API key - gracefully degrades without one
- In-memory cache clears on server restart (would use Redis in production)
- Map view is approximate (projection is equirectangular, not Mercator)
- No email verification on registration
- Weather data for cities is fetched individually, not via WebSocket (polling every 10min)

---

##  Deployment Guide

### Recommended: Railway (Backend) + Vercel (Frontend)

**Backend on Railway:**
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Railway auto-detects Node.js and runs `npm start`
```

**Frontend on Vercel:**
```bash
# Connect GitHub repo to Vercel
# Set NEXT_PUBLIC_API_URL to your Railway backend URL
# Vercel auto-detects Next.js
```

**MongoDB:** Use MongoDB Atlas free tier (M0) - connect via MONGODB_URI.

### Docker (Self-hosted)
```bash
docker-compose up --build
```

---

##  Project Structure

```
weather-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic (weather, AI)
│   │   └── index.js        # Entry point
│   └── package.json
└── frontend/
    ├── app/                # Next.js App Router pages
    ├── components/         # React components
    │   ├── ai/            # AI chat
    │   ├── layout/        # Navbar
    │   └── weather/       # Cards, modals, views
    ├── lib/               # API client, auth context, utils
    └── package.json
```
