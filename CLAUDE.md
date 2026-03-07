# Social Worker AI — CLAUDE.md

## What This Product Is

Social Worker AI is a **B2B embeddable chatbot with an autonomous crisis intervention system**. Companies purchase and embed the chatbot widget on their websites for any purpose — customer service, coaching, onboarding, support, etc. The chatbot handles normal conversations via AI.

**The differentiator:** Social Worker AI is the first human-AI crisis response team. Every conversation is silently monitored for crisis signals. When triggered, an autonomous protocol activates:

### Crisis Protocol Flow

1. **Detection** — The Social Worker AI agent silently monitors EVERY conversation in the background. It uses its trained judgment (not keyword matching) to determine when crisis protocol should activate. The server sends each user message to the Social Worker AI in parallel — its monitoring response is never shown to the end user.
2. **AI Takeover** — When the Social Worker AI agent signals crisis (via `[CRISIS_PROTOCOL]` in its response), it immediately takes over the conversation from the regular chatbot, engaging the person directly. This agent is trained as a social worker by Jason Fernandez, LMSW.
3. **Dashboard Team Activates** — Three specialized AI agents activate simultaneously, each trained as social workers:
   - **Search Agent** — Locates the user using any available information
   - **Comms Agent** — Sends live updates to Jason (the licensed social worker) AND the company owner
   - **Audit Agent** — Logs every interaction during the crisis in real-time
4. **Human Monitoring** — Jason monitors the situation through the Comms Agent, receiving live updates
5. **Human Intervention** — If Jason assesses the situation is dire, he personally enters the chat, takes over from the AI agent, and talks directly to the person to initiate a welfare check

### Key Concepts

- The chatbot is **industry-agnostic** — it can serve any company's needs
- Social Worker AI is NOT a therapy tool — it is a **safety layer** that protects end users during any AI conversation
- The regular chatbot AI and the Social Worker AI agent are **different entities** — the Social Worker AI only activates during crisis
- Companies buy this because no other chatbot product has a licensed-professional-backed crisis response system
- The dashboard is where Jason and the AI agent team operate during a crisis

## Identity

- **Product:** Social Worker AI — Embeddable Chatbot with Autonomous Crisis Intervention
- **Company:** 60 Watts of Clarity
- **Founder:** Jason Fernandez, MA, LMSW (licensed social worker, psychology professor 11+ years)
- **Repo:** social-worker-ai
- **License:** Apache-2.0

## Architecture

Monorepo with 3 workspaces:

```
social-worker-ai/
├── chatbot/       # Embeddable React widget (React 18 + Vite)
│                  # Deployed on customer websites via <script> tag
│                  # Handles normal AI conversations + crisis UI state
├── dashboard/     # Crisis command center (React 18 + Vite + R3F)
│                  # Where Jason + AI agent team operate during crisis
│                  # 3D session constellation, real-time comms, audit trail
├── server/        # Node.js backend (Express + Socket.io)
│                  # Crisis detection, protocol activation, message routing
│                  # Encrypted storage, notification dispatch
├── docs/plans/    # Design documents
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

### Stack

| Layer | Technology |
|-------|-----------|
| Chatbot Widget | React 18, Socket.io-client, GSAP, Tailwind CSS |
| Dashboard | React 18, React Three Fiber, drei, postprocessing, GSAP, Tailwind CSS |
| Server | Node.js 20, Express 4, Socket.io 4 |
| Database | MySQL 8+ (InnoDB, utf8mb4) |
| AI (regular chatbot) | Launch Lemonade API (primary), Anthropic Claude API (backup) |
| AI (crisis agent) | Social Worker AI via Launch Lemonade (trained by Jason) |
| Notifications | Twilio (SMS + voice), SendGrid (email) |
| Container | Docker (Node:20-alpine) |

### External Services

- **Launch Lemonade:** `https://sip.launchlemonade.app/api/1.1/wf/run_assistant`
- **Default Assistant ID:** `1772822866868x782078534383128200`
- **Twilio:** SMS + TwiML voice calls (crisis alerts to Jason + company owner)
- **SendGrid:** HTML email alerts (crisis notifications)

## Terminology — Get This Right

| Term | Meaning |
|------|---------|
| **Regular chatbot** | The AI that handles normal conversations. Industry-agnostic. |
| **Social Worker AI** | The crisis-trained AI agent that takes over when crisis is detected. Trained by Jason as a social worker. |
| **Company owner** | The business that purchased and embedded the chatbot. Gets notified during crisis. |
| **End user** | The person chatting with the widget on the company's website. |
| **Jason / LMSW** | The licensed social worker who monitors crises and can personally intervene. |
| **Search Agent** | Dashboard AI that locates the user during crisis. |
| **Comms Agent** | Dashboard AI that sends live updates to Jason and company owner. |
| **Audit Agent** | Dashboard AI that logs all crisis interactions. |
| **Welfare check** | When Jason determines the situation is dire and personally enters the chat. |
| **Crisis Protocol** | The full automated sequence from detection through agent activation. |

## Development Priorities (Strict Order)

1. **Security & HIPAA-awareness** — encryption, auth, audit trails, no plaintext in logs
2. **Reliability** — error handling, graceful degradation, crash resilience
3. **Code quality** — ESLint, Prettier, consistent patterns, testing
4. **Production readiness** — Docker, env config, deployment
5. **Feature completeness** — crisis detection, agent team, dashboard E2E

## Security Rules (Non-Negotiable)

### Encryption
- ALL chat messages: AES-256-CBC encrypted at rest
- Key derivation: ENCRYPTION_KEY env -> SHA-256 -> 32 bytes
- Random 16-byte IV per message, stored alongside ciphertext
- Decrypt ONLY on authenticated retrieval (company owner's session OR admin + crisis_active)
- NEVER log plaintext message content anywhere — audit logs store metadata only

### Authentication
- JWT with configurable expiry (default 24h), signed with JWT_SECRET
- bcrypt password hashing (minimum 10 salt rounds)
- Role-based access: 'therapist' (company owner — own sessions only), 'admin' (Jason/60 Watts — crisis sessions only)
- Socket auth: JWT in handshake for dashboard; chatbot widget is unauthenticated

### Database
- Use mysql2 with parameterized queries ALWAYS — never string concatenation
- Database user should have minimal privileges (no DROP, GRANT, ALTER in production)
- Use InnoDB engine, utf8mb4 charset on all tables
- Use TIMESTAMP not DATETIME for audit fields
- Foreign keys with ON DELETE constraints

### Rate Limiting
- Global API: 100 req/15min
- Auth endpoints: 20 req/15min
- Return 429 with meaningful (but not leaky) error

### Network
- Helmet security headers on all responses
- CORS restricted to ALLOWED_ORIGINS env (never wildcard in production)
- Twilio TwiML: XML-escape all dynamic content (prevent injection)
- SendGrid: HTML-escape all dynamic content (prevent XSS)
- Error responses MUST NOT leak system internals, stack traces, or PHI

### Audit Trail
- Immutable — no delete/update endpoints exist or should be created
- Log: actor (email or 'system'), action, detail (metadata only)
- Actions: crisis_activated, viewed, intercepted, listed_crisis_sessions, agent_search, agent_comms, agent_audit
- NEVER store plaintext message content in audit_log.detail

### Input Validation
- Validate all user input server-side (type, length, format)
- Sanitize before storage, escape before rendering
- Session IDs: validate UUID v4 format
- Email: validate format before registration
- Message length: enforce maximum

## Design System: "Ember Protocol"

**Design document:** `docs/plans/2026-03-06-social-worker-ai-design.md`

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Base (dark) | `#1A1614` | Page backgrounds — warm charcoal |
| Surface | `#2A2421` | Cards, panels, elevated surfaces |
| Accent primary | `#E8913A` | CTAs, crisis energy, key actions |
| Accent secondary | `#C4785C` | Secondary actions, warm copper glow |
| Safe state | `#7BA68C` | Non-crisis indicators |
| Crisis state | `#D94F4F` | Urgent alerts — deep coral |
| Text primary | `#F0EBE3` | Body text — warm white |
| Text secondary | `#A89B8C` | Labels, subdued text |
| Frosted glass | `rgba(42, 36, 33, 0.7)` + `backdrop-filter: blur(16px)` | Overlays |

### Typography

| Use | Font |
|-----|------|
| Headings | DM Serif Display |
| Body / UI | Space Grotesk |
| Mono / Data | JetBrains Mono |

### BANNED Design Patterns

DO NOT USE any of the following. These are generic AI-generated aesthetics:

- **Fonts:** Inter, Roboto, Arial, system-ui as primary font
- **Colors:** Purple gradients, pure white (#ffffff) backgrounds, generic blue-on-white
- **Layouts:** Flat uniform card grids, cookie-cutter dashboard tables
- **Components:** Bouncing dot loaders, generic progress bars, default shadcn without customization
- **Backgrounds:** Solid white, solid gray, flat single-color fills
- **Motion:** No animation at all, OR scattered uncoordinated micro-interactions
- **Overall:** Anything that looks like "default Tailwind" or "generic SaaS template"

### Required Design Patterns

- **Panels:** Frosted glass with warm tint (`backdrop-filter: blur(16px)`)
- **Buttons:** Ember gradient (`#E8913A` -> `#C4785C`), subtle glow on hover
- **Inputs:** Dark surface with warm border, amber focus ring
- **Status:** Sage green (safe) / pulsing coral (crisis) — animated, not flat badges
- **Transitions:** Orchestrated staggered reveals (GSAP `animation-delay`)
- **Dashboard:** 3D spatial constellation (React Three Fiber) — nodes for sessions, not tables

### Dashboard: Crisis Constellation (R3F)

- Non-crisis sessions: dim sage-green orbs, slowly drifting
- Crisis sessions: pulsing coral nodes with particle emission
- Click node -> zoom -> frosted-glass detail panels
- Crisis activation: particle burst, ripple wave, bloom intensifies

### Chatbot Widget: Reactive & Alive (GSAP)

- Normal mode: standard chat UI, company-branded
- Crisis mode: pulsing coral border, darkened background, "Crisis Protocol Active" banner
- Message colors: end user = amber tint, regular AI = frosted glass, Social Worker AI = copper accent, Jason (human) = distinct admin style

## Code Standards

### General
- ESLint + Prettier enforced (husky pre-commit hooks)
- No `console.log` in production code — use structured logging
- Meaningful variable names — no single letters except loop counters
- Error boundaries on all React component trees
- Graceful degradation: if a service (Twilio, SendGrid, Lemonade) fails, log + continue

### Server
- All routes: validate input -> process -> respond (no inline business logic)
- All DB queries: parameterized (mysql2 prepared statements)
- All async: try/catch with meaningful error handling
- Environment validation on startup — fail fast if required vars missing

### Frontend
- Components: functional with hooks only
- State: local state for UI, socket events for real-time data
- No inline styles — Tailwind utilities or CSS modules
- Accessibility: ARIA labels on interactive elements, keyboard navigation

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- No secrets in commits — .env is gitignored
- PR before merge to main

## Running the Project

```bash
# Install
npm install --ignore-scripts

# Database
mysql -u <user> -p <database> < server/models/schema.sql

# Development (all 3 services)
npm run dev
# Server: http://localhost:3000
# Chatbot: http://localhost:5173
# Dashboard: http://localhost:5174

# Production
docker-compose up -d
```

## Key Files

| Function | Path |
|----------|------|
| Crisis signal parsing | server/services/crisis.js |
| Crisis protocol activation | server/socket/handler.js (activateCrisisProtocol) |
| Notifications | server/services/{twilio,sendgrid,lemonade}.js |
| Database | server/config/db.js, server/models/schema.sql |
| Encryption | server/middleware/encryption.js |
| JWT Auth | server/middleware/auth.js |
| WebSocket & message routing | server/socket/handler.js |
| Chatbot consent gate | chatbot/src/components/ConsentGate.jsx |
| Chat interface | chatbot/src/components/ChatWindow.jsx |
| Dashboard pages | dashboard/src/pages/*.jsx |
| 3D Crisis Constellation | dashboard/src/components/CrisisConstellation.jsx |
| Server routes | server/routes/{auth,chat,admin}.js |
| Design doc | docs/plans/2026-03-06-social-worker-ai-design.md |
