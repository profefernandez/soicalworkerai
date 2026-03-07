# Social Worker AI

**The first human-AI crisis response team for any chatbot.**

Companies embed our chatbot widget on their websites for customer service, coaching, support — anything. Social Worker AI silently monitors every conversation for crisis signals. When triggered, an autonomous crisis protocol activates: a trained AI social worker takes over the conversation, a team of specialized AI agents locates the user and coordinates communications, and a licensed social worker (LMSW) monitors in real-time — ready to personally intervene and initiate a welfare check if the situation is dire.

**Built by [60 Watts of Clarity](https://60wattsofclarity.com)** | Founded by Jason Fernandez, MA, LMSW

## How It Works

```
Normal Operation:
  End User <---> Chatbot Widget <---> AI (customer service, coaching, etc.)
                                        |
                              [Silent crisis monitoring]

Crisis Detected:
  End User <---> Social Worker AI Agent (takes over immediately)
                        |
              Dashboard AI Team activates:
              ├── Search Agent --- locates the user
              ├── Comms Agent ---- live updates to LMSW + company owner
              └── Audit Agent ---- logs every interaction
                        |
              Jason (LMSW) monitors via Comms Agent
                        |
              If dire: Jason enters chat directly -> welfare check
```

## Architecture

```
social-worker-ai/
├── chatbot/       # Embeddable widget — deploys on any website via <script> tag
├── dashboard/     # Crisis command center — 3D session constellation, real-time ops
├── server/        # Backend — crisis detection, protocol activation, encrypted messaging
├── Dockerfile     # Multi-stage production build
└── docker-compose.yml
```

| Component | Stack |
|-----------|-------|
| Widget | React 18, Socket.io, GSAP, Tailwind CSS |
| Dashboard | React 18, React Three Fiber, GSAP, Tailwind CSS |
| Server | Node.js 20, Express, Socket.io, MySQL 8 |
| AI | Launch Lemonade API (regular + crisis agents) |
| Alerts | Twilio (SMS + voice), SendGrid (email) |

## Quick Start

```bash
# Clone and configure
git clone https://github.com/profefernandez/social-worker-ai.git
cd social-worker-ai
cp .env.example .env    # Fill in all required values

# Install
npm install --ignore-scripts

# Database
mysql -u <user> -p <database> < server/models/schema.sql

# Development
npm run dev
# Server:    http://localhost:3000
# Chatbot:   http://localhost:5173
# Dashboard: http://localhost:5174

# Production
docker-compose up -d
```

## Embedding the Widget

Add to any website. The chatbot handles normal conversations; Social Worker AI activates only during crisis.

```html
<script>
  window.__CHATBOT_SESSION_ID__ = "<session-id>";
</script>
<script src="https://your-domain.com/widget.js"></script>
```

Create sessions via `POST /api/chat/session` (requires JWT). Pass the returned `sessionId` to the widget.

## Security

- AES-256-CBC encryption on all messages at rest
- JWT authentication with bcrypt password hashing
- Rate limiting on all public endpoints
- Helmet security headers
- Crisis session access restricted to authorized personnel only
- Immutable audit trail — every crisis interaction logged
- Input validation and parameterized queries throughout

## Crisis Detection

22 crisis keywords + 4 regex patterns monitor every message. When triggered:

1. Session flagged as crisis-active
2. Social Worker AI agent takes over the conversation
3. Dashboard AI team (Search, Comms, Audit) activates
4. SMS, voice call, and email alerts sent to LMSW + company owner
5. LMSW monitors and can personally intervene

## Environment Variables

See `.env.example` for all required configuration values.

## License

Apache-2.0
