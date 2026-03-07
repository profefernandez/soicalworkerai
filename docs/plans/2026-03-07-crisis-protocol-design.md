# Crisis Protocol & Agent Orchestration — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete crisis intervention system — 5 hot-swappable Launch Lemonade agents, real-time crisis protocol activation, 3D crisis command center dashboard, and end-user chatbot crisis UI.

**Architecture:** Event-driven agent orchestration over WebSocket. Server routes messages to the correct Launch Lemonade assistant based on session state. Crisis activation triggers parallel agent calls + Twilio/SendGrid notifications. Dashboard streams agent outputs in real-time.

**Tech Stack:** Node.js/Express, Socket.io, MySQL, Launch Lemonade API, Twilio, SendGrid, React 18, React Three Fiber, GSAP, Tailwind CSS

---

## 1. Server — Agent Orchestration

### 1.1 Environment Variables (5 hot-swappable agents)

```
LEMONADE_AGENT_CHATBOT_ID=<regular chatbot assistant>
LEMONADE_AGENT_SOCIAL_WORKER_ID=<Social Worker AI crisis agent>
LEMONADE_AGENT_SEARCH_ID=<Search agent>
LEMONADE_AGENT_COMMS_ID=<Comms agent>
LEMONADE_AGENT_AUDIT_ID=<Audit agent>
```

Any ID can be changed without code changes. Server reads from env on each call.

### 1.2 Agent Orchestrator Service

New file: `server/services/agentOrchestrator.js`

Refactors existing `lemonade.js` into a multi-agent router. Single function `callAgent(role, input, conversationId)` that:
- Resolves the correct assistant ID from env by role
- Calls Launch Lemonade API
- Returns the response

Agent roles: `chatbot`, `social_worker`, `search`, `comms`, `audit`

### 1.3 Crisis Protocol Activation

When `detectCrisis()` returns true and session is not already crisis-active:

1. DB: `sessions.crisis_active = 1`, `sessions.active_agent_id = SOCIAL_WORKER_ID`
2. Fire in parallel:
   - Social Worker AI agent: receives conversation context, responds to end user
   - Search Agent: receives session metadata, begins locating user
   - Comms Agent: receives crisis summary, sends first update
   - Audit Agent: receives trigger details, logs activation
   - Twilio SMS + voice call to Jason
   - SendGrid email to Jason + company owner
3. WebSocket events emitted (see 1.5)

### 1.4 Responder Chain

Only one responder active at a time. Sequential handoff:

```
Regular AI (chatbot) → Social Worker AI → Jason (human)
```

- Normal: messages route to `LEMONADE_AGENT_CHATBOT_ID`
- Crisis activated: messages route to `LEMONADE_AGENT_SOCIAL_WORKER_ID`
- Jason enters: messages go directly to Jason, Social Worker AI stops
- Crisis ends: revert to `LEMONADE_AGENT_CHATBOT_ID`

### 1.5 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `crisis:activated` | server → dashboard | sessionId, triggers, timestamp |
| `agent:joined` | server → chatbot + dashboard | sessionId, agentName |
| `agent:output` | server → dashboard | sessionId, agentRole (search/comms/audit), content, timestamp |
| `crisis:ended` | server → chatbot + dashboard | sessionId, endedBy, timestamp |
| `admin:takeover` | dashboard → server | sessionId |

### 1.6 Crisis Protocol End

Only two actors can end it:
- Jason: `POST /api/admin/sessions/:sessionId/end-crisis` (admin-only)
- Social Worker AI: via specific response signal from the agent

On end:
- DB: `crisis_active = 0`, `active_agent_id = NULL`
- WebSocket: `crisis:ended` to widget + dashboard
- Audit Agent: logs protocol end
- Session reverts to regular chatbot agent

### 1.7 DB Schema Changes

```sql
-- Add active agent tracking to sessions
ALTER TABLE sessions ADD COLUMN active_agent_id VARCHAR(255) DEFAULT NULL;

-- Expand sender types in messages
ALTER TABLE messages MODIFY COLUMN sender ENUM('client', 'ai', 'social_worker_ai', 'admin') NOT NULL;
```

---

## 2. Chatbot Widget UI

### 2.1 Permanent Safety Banner

Always visible at top of chat (normal and crisis mode):

```
911 | 988 Suicide & Crisis Lifeline | help@60wattsofclarity.com | XXX-XXX-XXXX | Free Resource Guide
```

- Normal mode: subtle, muted styling
- Crisis mode: intensified ember/coral styling

### 2.2 Message Sender Types (4 distinct styles)

| Sender | Label | Style |
|--------|-------|-------|
| `client` | (none) | Amber tint, right-aligned |
| `ai` | "AI Assistant" | Frosted glass |
| `social_worker_ai` | "Social Worker AI" | Copper accent, distinct from regular AI |
| `admin` | "Jason Fernandez, LMSW" | Admin style, clearly human |

### 2.3 Crisis Activation Flow (what end user sees)

1. System message: **"Social Worker AI has joined"**
2. Safety banner styling intensifies
3. Responses now come from Social Worker AI (copper styling)
4. Regular AI stops responding

### 2.4 Jason Enters

1. System message: **"Jason Fernandez, LMSW has joined the conversation"**
2. Social Worker AI stops responding
3. Jason's messages appear in admin styling

### 2.5 Crisis Ends

1. System message: **"Crisis protocol has ended"**
2. Chat reverts to regular AI assistant
3. Safety banner returns to subtle mode

---

## 3. Dashboard — 3D Crisis Command Center

### 3.1 Constellation View (existing, enhanced)

- All sessions as orbs — sage green (normal), pulsing coral (crisis)
- Click a crisis node → zooms in → opens Crisis Workspace

### 3.2 Crisis Workspace (new)

Multi-panel layout replacing current CrisisView:

| Panel | Position | Content | Data Source |
|-------|----------|---------|-------------|
| Chat Feed | Center | Live conversation, Jason's input field | WebSocket session events |
| Search Agent | Left | User info streaming in real-time | `agent:output` role=search |
| Comms Agent | Right top | Status updates to Jason + company owner | `agent:output` role=comms |
| Audit Log | Right bottom | Every action logged during crisis | `agent:output` role=audit |

### 3.3 Jason's Controls

- **"Enter Conversation"** button — sends `admin:takeover`, Social Worker AI stops, "Jason Fernandez, LMSW has joined" appears in chat
- **"End Protocol"** button — ends crisis, reverts session to normal
- Both require confirmation dialog

### 3.4 Real-time Streaming

All four panels update via WebSocket. No polling. Each `agent:output` event contains the agent role so the dashboard routes it to the correct panel.

---

## 4. End-to-End Data Flow

### Normal Conversation
```
End User → widget → WebSocket → server → Lemonade (CHATBOT agent) → server → widget
```

### Crisis Triggers
```
Server detects crisis keywords
  ├── DB: mark crisis-active, set active_agent to SOCIAL_WORKER_AI
  ├── Twilio: SMS + voice call to Jason
  ├── SendGrid: email to Jason + company owner
  ├── WebSocket → widget: "Social Worker AI has joined"
  ├── WebSocket → dashboard: crisis:activated
  └── Parallel Lemonade API calls:
       ├── Social Worker AI → responds to end user
       ├── Search Agent → streams to dashboard
       ├── Comms Agent → streams to dashboard
       └── Audit Agent → streams to dashboard
```

### Jason Enters
```
Jason clicks "Enter Conversation"
  ├── Server: set active_agent to ADMIN, stop Social Worker AI
  ├── WebSocket → widget: "Jason Fernandez, LMSW has joined"
  ├── Audit Agent: logs Jason's entry
  └── Jason types directly to end user
```

### Crisis Ends
```
Jason clicks "End Protocol"
  ├── DB: crisis_active = 0, active_agent = NULL
  ├── WebSocket → widget: "Crisis protocol has ended"
  ├── WebSocket → dashboard: crisis:ended
  ├── Audit Agent: logs protocol end
  └── Session reverts to regular chatbot
```

---

## 5. Parallel Implementation Workstreams

These can be built simultaneously by parallel agents:

| Workstream | Scope | Dependencies |
|------------|-------|-------------|
| **A: Agent Orchestrator** | `agentOrchestrator.js`, refactor `lemonade.js`, env vars, DB schema changes | None |
| **B: Crisis Protocol Server** | Socket handler rewrite, crisis activation/end, admin takeover, new WebSocket events, new REST endpoints | A |
| **C: Chatbot Widget UI** | Safety banner, 4 sender types, system messages, crisis UI states | B (WebSocket events) |
| **D: Dashboard Crisis Workspace** | Multi-panel crisis view, agent output panels, Jason's controls, real-time streaming | B (WebSocket events) |
| **E: Tests** | Agent orchestrator tests, crisis protocol tests, WebSocket event tests | A, B |

C and D can run in parallel once B is complete. A and E are prerequisites.
