# SocialWorkerAI Wiki

## Overview

SocialWorkerAI is an AI-human crisis monitoring platform built for therapists and social workers. It combines an embeddable chatbot widget, a real-time monitoring dashboard, and a Node.js backend that integrates with AI assistants and notification services.

## Key Features

- Crisis-aware chatbot widget for client-facing support
- Admin dashboard for monitoring sessions and crises
- Real-time communication via Socket.io
- Multi-channel notifications (Twilio SMS/voice, SendGrid email)
- AES-256-CBC encryption at rest and JWT-based authentication
- Docker-ready deployment for production environments

## Architecture

```
[End User — Chatbot Widget]
       ↕  WebSocket (real-time, encrypted)
[Node.js Backend Server (Docker Container)]
       ↕  REST API (secured endpoints)
[Launch Lemonade API — Social Worker AI Agent]
       ↕
[Twilio — SMS + Voice Call Notifications]
[SendGrid — Email Notifications]

[Therapist / 60 Watts Admin — Dashboard]
       ↕  WebSocket (authenticated, same server)
[Node.js Backend]
       ↕
[MySQL Database (SPanel)]
```

## Project Structure

```
chatbot/     # Embeddable widget for therapist websites (React + Vite)
dashboard/   # Admin monitoring panel (React + Vite)
server/      # Node.js backend (Express + Socket.io)
```

## Getting Started

1. **Configure environment**

   ```bash
   cp .env.example .env
   # Fill in required values
   ```

2. **Install dependencies**

   ```bash
   npm install --ignore-scripts
   ```

3. **Initialize MySQL**

   ```bash
   mysql -u <user> -p <database> < server/models/schema.sql
   ```

4. **Run in development**

   ```bash
   npm run dev
   ```

   - Server: `http://localhost:3000`
   - Chatbot widget: `http://localhost:5173`
   - Dashboard: `http://localhost:5174`

## Development Commands

```bash
npm run dev       # Run server + chatbot + dashboard
npm run lint      # Run ESLint across workspaces
npm run format    # Run Prettier on JS/JSON/CSS/MD
```

## Deployment

```bash
docker-compose up -d
```

This runs the Node.js backend in a Docker container with a health check. The chatbot widget and dashboard build artifacts are served by the backend.

## Embedding the Chatbot Widget

```html
<script>
  window.__CHATBOT_SESSION_ID__ = "<session-id>";
</script>
<script src="https://your-domain.com/widget.js"></script>
```

Create a session by calling `POST /api/chat/session` with a therapist JWT, then pass the returned `sessionId` to the widget.

## Environment Variables

All configuration lives in `.env`. Required values include:

- **Server:** `PORT`, `NODE_ENV`
- **Database:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **AI:** `LEMONADE_API_URL`, `LEMONADE_API_KEY`, `LEMONADE_ASSISTANT_ID`, `ANTHROPIC_API_KEY`
- **Notifications:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- **Security:** `JWT_SECRET`, `JWT_EXPIRY`, `ENCRYPTION_KEY`

## Security Notes

- Chat messages are encrypted at rest using AES-256-CBC.
- JWT authentication protects the dashboard and API endpoints.
- Rate limiting and HTTP security headers are enforced by the backend.

## Troubleshooting

- **Widget not loading:** Verify the backend is reachable and serving `widget.js`.
- **Missing notifications:** Confirm Twilio and SendGrid credentials are set in `.env`.
- **Database errors:** Ensure the schema in `server/models/schema.sql` is applied to your MySQL instance.
