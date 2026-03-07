# Crisis Protocol & Agent Orchestration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete crisis intervention system with 5 hot-swappable Launch Lemonade agents, real-time crisis protocol, 3D crisis command center, and chatbot crisis UI.

**Architecture:** Server routes messages to the correct Launch Lemonade assistant based on session state. Crisis detection triggers parallel agent calls + notifications. Dashboard streams agent outputs via WebSocket. Sequential responder chain: Regular AI → Social Worker AI → Jason.

**Tech Stack:** Node.js 20, Express 4, Socket.io 4, MySQL 8, Launch Lemonade API, Twilio, SendGrid, React 18, React Three Fiber 8, GSAP, Tailwind CSS

**Design doc:** `docs/plans/2026-03-07-crisis-protocol-design.md`

---

## Workstream A: Agent Orchestrator (server foundation)

### Task 1: Add agent env vars to config

**Files:**
- Modify: `server/utils/validateEnv.js`
- Modify: `.env.example`

**Step 1: Update `.env.example` with new agent IDs**

Add to `.env.example`:

```env
# Agent IDs (Launch Lemonade assistants — hot-swappable)
LEMONADE_AGENT_CHATBOT_ID=
LEMONADE_AGENT_SOCIAL_WORKER_ID=
LEMONADE_AGENT_SEARCH_ID=
LEMONADE_AGENT_COMMS_ID=
LEMONADE_AGENT_AUDIT_ID=
```

**Step 2: Update `validateEnv.js`**

Replace `LEMONADE_ASSISTANT_ID` with individual agent IDs in the required list. Keep `LEMONADE_API_KEY` and `LEMONADE_API_URL`.

Replace the `REQUIRED_ENV` array with:

```javascript
const REQUIRED_ENV = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'JWT_EXPIRY', 'ENCRYPTION_KEY',
  'LEMONADE_API_KEY', 'LEMONADE_API_URL',
  'LEMONADE_AGENT_CHATBOT_ID',
  'LEMONADE_AGENT_SOCIAL_WORKER_ID',
  'LEMONADE_AGENT_SEARCH_ID',
  'LEMONADE_AGENT_COMMS_ID',
  'LEMONADE_AGENT_AUDIT_ID',
];
```

**Step 3: Update env validation test**

In `server/__tests__/env-validation.test.js`, update the test that checks missing vars to include the new agent env vars.

**Step 4: Run tests**

Run: `cd server && npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add server/utils/validateEnv.js .env.example server/__tests__/env-validation.test.js
git commit -m "feat: add 5 agent environment variables for hot-swappable Lemonade assistants"
```

---

### Task 2: Build agent orchestrator service

**Files:**
- Create: `server/services/agentOrchestrator.js`
- Create: `server/__tests__/agentOrchestrator.test.js`

**Step 1: Write the failing tests**

```javascript
// server/__tests__/agentOrchestrator.test.js
const { resolveAgentId, AGENT_ROLES } = require('../services/agentOrchestrator');

describe('agentOrchestrator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONADE_API_KEY: 'test-key',
      LEMONADE_API_URL: 'https://test.api/run_assistant',
      LEMONADE_AGENT_CHATBOT_ID: 'chatbot-123',
      LEMONADE_AGENT_SOCIAL_WORKER_ID: 'sw-456',
      LEMONADE_AGENT_SEARCH_ID: 'search-789',
      LEMONADE_AGENT_COMMS_ID: 'comms-101',
      LEMONADE_AGENT_AUDIT_ID: 'audit-202',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('AGENT_ROLES', () => {
    test('defines all 5 agent roles', () => {
      expect(AGENT_ROLES).toEqual({
        CHATBOT: 'chatbot',
        SOCIAL_WORKER: 'social_worker',
        SEARCH: 'search',
        COMMS: 'comms',
        AUDIT: 'audit',
      });
    });
  });

  describe('resolveAgentId', () => {
    test('resolves chatbot agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.CHATBOT)).toBe('chatbot-123');
    });

    test('resolves social worker agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.SOCIAL_WORKER)).toBe('sw-456');
    });

    test('resolves search agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.SEARCH)).toBe('search-789');
    });

    test('resolves comms agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.COMMS)).toBe('comms-101');
    });

    test('resolves audit agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.AUDIT)).toBe('audit-202');
    });

    test('throws for unknown role', () => {
      expect(() => resolveAgentId('unknown')).toThrow('Unknown agent role');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npm test`
Expected: FAIL — cannot find module `../services/agentOrchestrator`

**Step 3: Write the implementation**

```javascript
// server/services/agentOrchestrator.js
const axios = require('axios');

const AGENT_ROLES = {
  CHATBOT: 'chatbot',
  SOCIAL_WORKER: 'social_worker',
  SEARCH: 'search',
  COMMS: 'comms',
  AUDIT: 'audit',
};

const ROLE_TO_ENV = {
  [AGENT_ROLES.CHATBOT]: 'LEMONADE_AGENT_CHATBOT_ID',
  [AGENT_ROLES.SOCIAL_WORKER]: 'LEMONADE_AGENT_SOCIAL_WORKER_ID',
  [AGENT_ROLES.SEARCH]: 'LEMONADE_AGENT_SEARCH_ID',
  [AGENT_ROLES.COMMS]: 'LEMONADE_AGENT_COMMS_ID',
  [AGENT_ROLES.AUDIT]: 'LEMONADE_AGENT_AUDIT_ID',
};

function resolveAgentId(role) {
  const envKey = ROLE_TO_ENV[role];
  if (!envKey) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return process.env[envKey];
}

/**
 * Call a Launch Lemonade agent by role.
 * @param {string} role — one of AGENT_ROLES values
 * @param {string} input — message/context to send
 * @param {string|null} conversationId — existing conversation (null for new)
 * @returns {Promise<{conversationId: string, response: string}>}
 */
async function callAgent(role, input, conversationId = null) {
  const assistantId = resolveAgentId(role);
  const apiKey = process.env.LEMONADE_API_KEY;
  const apiUrl = process.env.LEMONADE_API_URL;

  if (!assistantId || !apiKey) {
    throw new Error(`Agent ${role} not configured`);
  }

  const payload = {
    assistant_id: assistantId,
    conversation_id: conversationId || '',
    input,
  };

  const response = await axios.post(apiUrl, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const data = response.data;
  if (data.Error && data.Error !== 'No') {
    throw new Error(`Agent ${role} error: ${data.Error_Reason}`);
  }

  return {
    conversationId: data.Conversation_ID || null,
    response: data.response || data.Response || '',
  };
}

module.exports = { AGENT_ROLES, resolveAgentId, callAgent };
```

**Step 4: Run tests**

Run: `cd server && npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add server/services/agentOrchestrator.js server/__tests__/agentOrchestrator.test.js
git commit -m "feat: add agent orchestrator service with 5 hot-swappable Lemonade agents"
```

---

### Task 3: Update DB schema

**Files:**
- Modify: `server/models/schema.sql`

**Step 1: Add active_agent_id and expand sender enum**

Add to `schema.sql` after existing CREATE statements:

```sql
-- Migration: add agent tracking and expanded sender types
ALTER TABLE sessions ADD COLUMN active_agent_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE messages MODIFY COLUMN sender ENUM('client', 'ai', 'social_worker_ai', 'admin') NOT NULL;
```

Also update the original CREATE TABLE statements to include the new column/enum so fresh installs work:

In the `sessions` CREATE TABLE, add:
```sql
  active_agent_id VARCHAR(255) DEFAULT NULL,
```

In the `messages` CREATE TABLE, change sender to:
```sql
  sender ENUM('client', 'ai', 'social_worker_ai', 'admin') NOT NULL,
```

**Step 2: Commit**

```bash
git add server/models/schema.sql
git commit -m "feat: add active_agent_id to sessions, expand message sender types"
```

---

## Workstream B: Crisis Protocol Server Logic

### Task 4: Rewrite socket handler — message routing by active agent

**Files:**
- Modify: `server/socket/handler.js`
- Modify: `server/services/lemonade.js` (deprecate, redirect to orchestrator)

**Step 1: Update the `client:message` handler**

Replace the current AI response logic (lines ~116-139 in handler.js) with agent-aware routing:

```javascript
// Determine which agent should respond
const activeRole = session.active_agent_id
  ? (session.active_agent_id === process.env.LEMONADE_AGENT_SOCIAL_WORKER_ID
      ? AGENT_ROLES.SOCIAL_WORKER
      : AGENT_ROLES.CHATBOT)
  : AGENT_ROLES.CHATBOT;

// If Jason has taken over (active_agent_id === 'ADMIN'), don't send to any AI
if (session.active_agent_id === 'ADMIN') {
  // Just save the message, no AI response — Jason responds manually
  return;
}

let aiResponse = '';
let senderType = activeRole === AGENT_ROLES.SOCIAL_WORKER ? 'social_worker_ai' : 'ai';

try {
  const result = await callAgent(activeRole, message, session.lemonade_conversation_id);

  if (!session.lemonade_conversation_id && result.conversationId) {
    await pool.execute(
      'UPDATE sessions SET lemonade_conversation_id = ? WHERE id = ?',
      [result.conversationId, sessionId]
    );
  }

  aiResponse = result.response || "I'm here to support you. Can you tell me more?";
} catch {
  aiResponse = "I'm here to support you. Can you tell me more?";
}

// Save AI response with correct sender type
const aiEnc = encrypt(aiResponse);
await pool.execute(
  'INSERT INTO messages (session_id, sender, content_encrypted, iv) VALUES (?, ?, ?, ?)',
  [sessionId, senderType, aiEnc.encrypted, aiEnc.iv]
);

// Emit to chatbot
socket.emit('ai:message', { sessionId, message: aiResponse, sender: senderType });
```

**Step 2: Update imports at top of handler.js**

Replace:
```javascript
const { runAssistant } = require('../services/lemonade');
```
With:
```javascript
const { callAgent, AGENT_ROLES } = require('../services/agentOrchestrator');
```

**Step 3: Commit**

```bash
git add server/socket/handler.js
git commit -m "feat: route messages to correct agent based on session state"
```

---

### Task 5: Rewrite crisis protocol activation with parallel agents

**Files:**
- Modify: `server/socket/handler.js` (the `activateCrisisProtocol` function)

**Step 1: Rewrite `activateCrisisProtocol`**

```javascript
async function activateCrisisProtocol(session, sessionId, triggerMessage, triggers, therapist, io) {
  try {
    // 1. Mark session crisis-active and switch to Social Worker AI
    const socialWorkerId = process.env.LEMONADE_AGENT_SOCIAL_WORKER_ID;
    await pool.execute(
      'UPDATE sessions SET crisis_active = 1, crisis_activated_at = NOW(), active_agent_id = ? WHERE id = ?',
      [socialWorkerId, sessionId]
    );

    // 2. Audit log
    await pool.execute(
      'INSERT INTO audit_log (session_id, actor, action, detail) VALUES (?, ?, ?, ?)',
      [sessionId, 'system', 'crisis_activated', `Triggers: ${triggers.join(', ')}`]
    );

    const summary = `Crisis detected in session ${sessionId}. Keywords: ${triggers.join(', ')}.`;

    // 3. Emit agent:joined to chatbot + dashboard
    io.to(`session:${sessionId}`).emit('agent:joined', {
      sessionId,
      agentName: 'Social Worker AI',
    });
    io.to('dashboard').emit('crisis:activated', {
      sessionId,
      therapistEmail: therapist ? therapist.email : null,
      summary,
      timestamp: new Date().toISOString(),
    });

    // 4. Fire all parallel actions — agents + notifications
    const parallelActions = [];

    // Social Worker AI responds to the user
    parallelActions.push(
      callAgent(AGENT_ROLES.SOCIAL_WORKER, triggerMessage, session.lemonade_conversation_id)
        .then(async (result) => {
          const response = result.response || 'I hear you, and I want you to know you are not alone. I am here with you right now.';
          const enc = encrypt(response);
          await pool.execute(
            'INSERT INTO messages (session_id, sender, content_encrypted, iv) VALUES (?, ?, ?, ?)',
            [sessionId, 'social_worker_ai', enc.encrypted, enc.iv]
          );
          io.to(`session:${sessionId}`).emit('ai:message', {
            sessionId,
            message: response,
            sender: 'social_worker_ai',
          });
          if (result.conversationId && !session.lemonade_conversation_id) {
            await pool.execute(
              'UPDATE sessions SET lemonade_conversation_id = ? WHERE id = ?',
              [result.conversationId, sessionId]
            );
          }
        })
        .catch((err) => console.error('Social Worker AI agent failed:', err.message))
    );

    // Search Agent — find the user
    parallelActions.push(
      callAgent(AGENT_ROLES.SEARCH, `Crisis in session ${sessionId}. Client identifier: ${session.client_identifier || 'unknown'}. Find any available information about this user.`)
        .then((result) => {
          io.to('dashboard').emit('agent:output', {
            sessionId,
            agentRole: 'search',
            content: result.response || 'Searching for user information...',
            timestamp: new Date().toISOString(),
          });
        })
        .catch((err) => console.error('Search agent failed:', err.message))
    );

    // Comms Agent — notify Jason + company owner
    parallelActions.push(
      callAgent(AGENT_ROLES.COMMS, `CRISIS ACTIVATED. Session: ${sessionId}. ${summary}. Therapist: ${therapist ? therapist.email : 'unknown'}. Notify all parties.`)
        .then((result) => {
          io.to('dashboard').emit('agent:output', {
            sessionId,
            agentRole: 'comms',
            content: result.response || 'Notifications dispatched.',
            timestamp: new Date().toISOString(),
          });
        })
        .catch((err) => console.error('Comms agent failed:', err.message))
    );

    // Audit Agent — log the crisis activation
    parallelActions.push(
      callAgent(AGENT_ROLES.AUDIT, `CRISIS ACTIVATED. Session: ${sessionId}. Triggers: ${triggers.join(', ')}. Time: ${new Date().toISOString()}. Log this event.`)
        .then((result) => {
          io.to('dashboard').emit('agent:output', {
            sessionId,
            agentRole: 'audit',
            content: result.response || 'Crisis activation logged.',
            timestamp: new Date().toISOString(),
          });
        })
        .catch((err) => console.error('Audit agent failed:', err.message))
    );

    // Twilio SMS
    const monitoringPhone = process.env.TWILIO_MONITOR_PHONE || process.env.TWILIO_PHONE_NUMBER;
    if (monitoringPhone && process.env.TWILIO_ACCOUNT_SID) {
      parallelActions.push(
        sendSms(monitoringPhone, `[CRISIS ALERT] ${summary}`)
          .then(async (smsSid) => {
            await pool.execute(
              'INSERT INTO notifications (session_id, type, recipient, status) VALUES (?, ?, ?, ?)',
              [sessionId, 'sms', monitoringPhone, smsSid ? 'sent' : 'failed']
            );
          })
          .catch((err) => console.error('Twilio SMS failed:', err.message))
      );

      // Twilio voice call
      parallelActions.push(
        makeCall(monitoringPhone, 'Crisis alert. A user needs immediate assistance. Check the dashboard now.')
          .then(async (callSid) => {
            await pool.execute(
              'INSERT INTO notifications (session_id, type, recipient, status) VALUES (?, ?, ?, ?)',
              [sessionId, 'call', monitoringPhone, callSid ? 'sent' : 'failed']
            );
          })
          .catch((err) => console.error('Twilio call failed:', err.message))
      );
    }

    // SendGrid email
    const monitoringEmail = process.env.SENDGRID_MONITOR_EMAIL || process.env.SENDGRID_FROM_EMAIL;
    if (monitoringEmail && process.env.SENDGRID_API_KEY) {
      parallelActions.push(
        sendCrisisEmail(monitoringEmail, sessionId, summary)
          .then(async () => {
            await pool.execute(
              'INSERT INTO notifications (session_id, type, recipient, status) VALUES (?, ?, ?, ?)',
              [sessionId, 'email', monitoringEmail, 'sent']
            );
          })
          .catch((err) => console.error('SendGrid failed:', err.message))
      );
    }

    // Fire all in parallel — don't let any single failure stop the rest
    await Promise.allSettled(parallelActions);

  } catch (err) {
    console.error('Crisis protocol activation failed:', err.message);
  }
}
```

**Step 2: Commit**

```bash
git add server/socket/handler.js
git commit -m "feat: rewrite crisis protocol with parallel agent activation"
```

---

### Task 6: Add admin takeover and end protocol endpoints

**Files:**
- Modify: `server/socket/handler.js` — add `admin:takeover` handler
- Modify: `server/routes/admin.js` — add `POST /api/admin/sessions/:sessionId/end-crisis`

**Step 1: Add `admin:takeover` socket event**

Inside the `socket.on('connection')` block, after the existing `admin:intercept` handler, add:

```javascript
// Jason takes over the conversation from Social Worker AI
socket.on('admin:takeover', async ({ sessionId }) => {
  if (socket.userType !== 'admin') return;
  if (!sessionId || !validateUUID(sessionId)) return;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions WHERE id = ? AND crisis_active = 1',
      [sessionId]
    );
    if (rows.length === 0) return;

    // Set active agent to ADMIN — stops AI from responding
    await pool.execute(
      'UPDATE sessions SET active_agent_id = ? WHERE id = ?',
      ['ADMIN', sessionId]
    );

    // Audit
    await pool.execute(
      'INSERT INTO audit_log (session_id, actor, action, detail) VALUES (?, ?, ?, ?)',
      [sessionId, socket.user.email, 'admin_takeover', 'Jason entered the conversation']
    );

    // Notify chatbot + dashboard
    io.to(`session:${sessionId}`).emit('agent:joined', {
      sessionId,
      agentName: 'Jason Fernandez, LMSW',
    });

    // Notify audit agent
    callAgent(AGENT_ROLES.AUDIT, `ADMIN TAKEOVER. Jason Fernandez entered session ${sessionId} at ${new Date().toISOString()}.`)
      .then((result) => {
        io.to('dashboard').emit('agent:output', {
          sessionId,
          agentRole: 'audit',
          content: result.response || 'Admin takeover logged.',
          timestamp: new Date().toISOString(),
        });
      })
      .catch((err) => console.error('Audit agent failed on takeover:', err.message));

  } catch (err) {
    console.error('admin:takeover error:', err.message);
  }
});
```

**Step 2: Add end-crisis route in `admin.js`**

```javascript
// POST /api/admin/sessions/:sessionId/end-crisis — end crisis protocol (admin only)
router.post('/sessions/:sessionId/end-crisis', authenticateAdmin, async (req, res) => {
  const { sessionId } = req.params;
  if (!validateUUID(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions WHERE id = ? AND crisis_active = 1',
      [sessionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Active crisis session not found' });
    }

    // End crisis
    await pool.execute(
      'UPDATE sessions SET crisis_active = 0, active_agent_id = NULL WHERE id = ?',
      [sessionId]
    );

    // Audit
    await pool.execute(
      'INSERT INTO audit_log (session_id, actor, action, detail) VALUES (?, ?, ?, ?)',
      [sessionId, req.user.email, 'crisis_ended', 'Crisis protocol ended by admin']
    );

    // Notify via WebSocket (need io reference — pass via app.locals or similar)
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('crisis:ended', {
        sessionId,
        endedBy: req.user.email,
        timestamp: new Date().toISOString(),
      });
      io.to('dashboard').emit('crisis:ended', {
        sessionId,
        endedBy: req.user.email,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ success: true, message: 'Crisis protocol ended' });
  } catch {
    return res.status(500).json({ error: 'Failed to end crisis' });
  }
});
```

**Step 3: Store `io` on app in `index.js`**

In `server/index.js`, after creating the io instance, add:

```javascript
app.set('io', io);
```

**Step 4: Add imports to `admin.js`**

Add at top of `admin.js`:
```javascript
const { validateUUID } = require('../middleware/validation');
```

(Already added in a previous commit — verify it's there.)

**Step 5: Commit**

```bash
git add server/socket/handler.js server/routes/admin.js server/index.js
git commit -m "feat: add admin takeover and end-crisis protocol endpoints"
```

---

## Workstream C: Chatbot Widget UI

### Task 7: Add permanent safety banner

**Files:**
- Create: `chatbot/src/components/SafetyBanner.jsx`
- Modify: `chatbot/src/components/ChatWindow.jsx`

**Step 1: Create SafetyBanner component**

```jsx
// chatbot/src/components/SafetyBanner.jsx
import { Phone, Mail, ExternalLink } from 'lucide-react';

export default function SafetyBanner({ crisisActive }) {
  return (
    <div
      className={`px-4 py-2 flex items-center justify-center gap-3 text-[10px] font-mono flex-wrap transition-colors duration-500 ${
        crisisActive
          ? 'bg-ember-crisis/20 border-b border-ember-crisis/30 text-ember-crisis'
          : 'bg-ember-surface/50 border-b border-ember-text/5 text-ember-muted'
      }`}
    >
      <a href="tel:911" className="flex items-center gap-1 hover:text-ember-text transition-colors">
        <Phone className="w-2.5 h-2.5" />
        911
      </a>
      <span className="opacity-30">|</span>
      <a href="tel:988" className="flex items-center gap-1 hover:text-ember-text transition-colors">
        <Phone className="w-2.5 h-2.5" />
        988 Crisis Lifeline
      </a>
      <span className="opacity-30">|</span>
      <a href="mailto:help@60wattsofclarity.com" className="flex items-center gap-1 hover:text-ember-text transition-colors">
        <Mail className="w-2.5 h-2.5" />
        help@60wattsofclarity.com
      </a>
      <span className="opacity-30">|</span>
      <span className="flex items-center gap-1">
        <Phone className="w-2.5 h-2.5" />
        XXX-XXX-XXXX
      </span>
      <span className="opacity-30">|</span>
      <a href="#" className="flex items-center gap-1 hover:text-ember-text transition-colors underline">
        <ExternalLink className="w-2.5 h-2.5" />
        Free Resources
      </a>
    </div>
  );
}
```

**Step 2: Add SafetyBanner to ChatWindow**

Import and place immediately after the header div, before the messages area:

```jsx
import SafetyBanner from './SafetyBanner';

// Inside the component, after the header <div>:
<SafetyBanner crisisActive={crisisActive} />
```

**Step 3: Commit**

```bash
git add chatbot/src/components/SafetyBanner.jsx chatbot/src/components/ChatWindow.jsx
git commit -m "feat: add permanent safety banner with 911, 988, email, phone, resources"
```

---

### Task 8: Add system messages and 4 sender types to chat

**Files:**
- Modify: `chatbot/src/hooks/useChat.js`
- Modify: `chatbot/src/components/ChatWindow.jsx`

**Step 1: Update `useChat.js` to handle new events**

Add handlers for `agent:joined` and `crisis:ended`:

```javascript
socket.on('agent:joined', ({ agentName }) => {
  setMessages((prev) => [
    ...prev,
    { id: Date.now(), sender: 'system', content: `${agentName} has joined the conversation` },
  ]);
  setCrisisActive(true);
});

socket.on('crisis:ended', () => {
  setMessages((prev) => [
    ...prev,
    { id: Date.now(), sender: 'system', content: 'Crisis protocol has ended' },
  ]);
  setCrisisActive(false);
});
```

Update the `ai:message` handler to include sender type:

```javascript
socket.on('ai:message', ({ message, sender }) => {
  setMessages((prev) => [
    ...prev,
    { id: Date.now(), sender: sender || 'ai', content: message },
  ]);
});
```

**Step 2: Update ChatWindow MessageBubble with all sender types**

Update the styles and labels objects:

```javascript
const styles = {
  client: 'ml-12 bg-gradient-to-br from-ember-primary/20 to-ember-secondary/10 border border-ember-primary/20 text-ember-text',
  ai: 'mr-12 frost-panel text-ember-text',
  social_worker_ai: 'mr-12 frost-panel border border-ember-secondary/40 text-ember-text bg-ember-secondary/5',
  admin: 'mr-12 frost-panel border border-ember-primary/40 text-ember-text bg-ember-primary/5',
  system: 'mx-auto text-center max-w-xs',
};

const labels = {
  client: null,
  ai: 'AI Assistant',
  social_worker_ai: 'Social Worker AI',
  admin: 'Jason Fernandez, LMSW',
  system: null,
};
```

Add special rendering for system messages:

```jsx
if (sender === 'system') {
  return (
    <div ref={ref} className="py-2">
      <div className="frost-panel rounded-full px-4 py-1.5 text-[11px] font-mono text-ember-muted mx-auto w-fit border border-ember-text/10">
        {content}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add chatbot/src/hooks/useChat.js chatbot/src/components/ChatWindow.jsx
git commit -m "feat: add system messages, 4 sender types, agent:joined and crisis:ended events"
```

---

## Workstream D: Dashboard Crisis Command Center

### Task 9: Create Crisis Workspace component

**Files:**
- Create: `dashboard/src/components/CrisisWorkspace.jsx`
- Create: `dashboard/src/components/AgentPanel.jsx`

**Step 1: Create AgentPanel — reusable panel for each agent's output**

```jsx
// dashboard/src/components/AgentPanel.jsx
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function AgentPanel({ title, icon: Icon, entries, accentColor }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="frost-panel rounded-xl flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-ember-text/5 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accentColor}`} />
        <h3 className="text-sm font-heading text-ember-text">{title}</h3>
        <span className="ml-auto text-[10px] font-mono text-ember-muted">{entries.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {entries.length === 0 && (
          <p className="text-ember-muted/50 text-xs text-center py-4 font-mono">Waiting for agent...</p>
        )}
        {entries.map((entry, i) => (
          <AgentEntry key={i} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function AgentEntry({ entry }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  }, []);

  return (
    <div ref={ref} className="frost-panel rounded-lg px-3 py-2">
      <span className="text-[9px] font-mono text-ember-muted block mb-1">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </span>
      <p className="text-xs text-ember-text leading-relaxed">{entry.content}</p>
    </div>
  );
}
```

**Step 2: Create CrisisWorkspace — multi-panel layout**

```jsx
// dashboard/src/components/CrisisWorkspace.jsx
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, Search, Radio, FileText, Send, UserCheck, XCircle } from 'lucide-react';
import AgentPanel from './AgentPanel';

export default function CrisisWorkspace({
  session,
  token,
  messages,
  agentOutputs,
  sendIntercept,
  onTakeover,
  onEndCrisis,
  onBack,
  isJasonActive,
}) {
  const [input, setInput] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmTakeover, setConfirmTakeover] = useState(false);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendIntercept(session.id || session.sessionId, trimmed);
    setInput('');
  };

  const searchEntries = (agentOutputs || []).filter((o) => o.agentRole === 'search');
  const commsEntries = (agentOutputs || []).filter((o) => o.agentRole === 'comms');
  const auditEntries = (agentOutputs || []).filter((o) => o.agentRole === 'audit');

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-ember-base">
      {/* Top bar */}
      <div className="frost-panel px-4 py-3 border-b border-ember-text/5 flex items-center gap-3">
        <button onClick={onBack} className="text-ember-muted hover:text-ember-text transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <span className="text-sm font-heading text-ember-text">Crisis Workspace</span>
          <span className="text-[10px] font-mono text-ember-muted ml-2">
            {(session.id || session.sessionId || '').substring(0, 8)}
          </span>
        </div>

        {/* Jason's controls */}
        {!isJasonActive && (
          <div className="relative">
            {confirmTakeover ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ember-text">Enter conversation?</span>
                <button
                  onClick={() => { onTakeover(); setConfirmTakeover(false); }}
                  className="text-xs bg-ember-primary/20 text-ember-primary px-2 py-1 rounded font-mono hover:bg-ember-primary/30"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmTakeover(false)}
                  className="text-xs text-ember-muted px-2 py-1 rounded font-mono hover:text-ember-text"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmTakeover(true)}
                className="flex items-center gap-1.5 text-xs font-mono text-ember-primary bg-ember-primary/10 px-3 py-1.5 rounded-lg hover:bg-ember-primary/20 transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                Enter Conversation
              </button>
            )}
          </div>
        )}

        <div className="relative">
          {confirmEnd ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ember-crisis">End protocol?</span>
              <button
                onClick={() => { onEndCrisis(); setConfirmEnd(false); }}
                className="text-xs bg-ember-crisis/20 text-ember-crisis px-2 py-1 rounded font-mono hover:bg-ember-crisis/30"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmEnd(false)}
                className="text-xs text-ember-muted px-2 py-1 rounded font-mono hover:text-ember-text"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmEnd(true)}
              className="flex items-center gap-1.5 text-xs font-mono text-ember-crisis bg-ember-crisis/10 px-3 py-1.5 rounded-lg hover:bg-ember-crisis/20 transition-colors"
            >
              <XCircle className="w-3 h-3" />
              End Protocol
            </button>
          )}
        </div>
      </div>

      {/* Main workspace grid */}
      <div className="flex-1 grid grid-cols-4 gap-3 p-3 overflow-hidden">
        {/* Left: Search Agent */}
        <div className="col-span-1 flex flex-col">
          <AgentPanel title="Search Agent" icon={Search} entries={searchEntries} accentColor="text-ember-safe" />
        </div>

        {/* Center: Chat Feed */}
        <div className="col-span-2 flex flex-col frost-panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ember-text/5">
            <h3 className="text-sm font-heading text-ember-text">Live Conversation</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {(messages || []).map((msg, i) => {
              const senderLabels = {
                client: null,
                ai: 'AI Assistant',
                social_worker_ai: 'Social Worker AI',
                admin: 'Jason Fernandez, LMSW',
                system: null,
              };
              const senderStyles = {
                client: 'ml-8 bg-ember-primary/10 border border-ember-primary/20',
                ai: 'mr-8 frost-panel',
                social_worker_ai: 'mr-8 frost-panel border border-ember-secondary/40',
                admin: 'mr-8 frost-panel border border-ember-primary/40',
                system: 'mx-auto text-center',
              };

              if (msg.sender === 'system') {
                return (
                  <div key={i} className="py-1">
                    <div className="frost-panel rounded-full px-3 py-1 text-[10px] font-mono text-ember-muted mx-auto w-fit">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className={`rounded-xl px-3 py-2 text-xs text-ember-text ${senderStyles[msg.sender] || 'frost-panel'}`}>
                  {senderLabels[msg.sender] && (
                    <span className="text-[10px] font-mono text-ember-muted block mb-0.5">{senderLabels[msg.sender]}</span>
                  )}
                  {msg.content}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Jason's input — only shown when Jason has taken over */}
          {isJasonActive && (
            <div className="px-3 py-3 border-t border-ember-text/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type as Jason..."
                  className="flex-1 bg-ember-surface text-ember-text text-xs rounded-lg px-3 py-2 border border-ember-text/10 placeholder:text-ember-muted/60 focus:outline-none focus:ring-1 focus:ring-ember-primary/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="ember-gradient rounded-lg px-3 py-2 text-ember-text disabled:opacity-30 transition-all"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Comms + Audit stacked */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="flex-1">
            <AgentPanel title="Comms Agent" icon={Radio} entries={commsEntries} accentColor="text-ember-primary" />
          </div>
          <div className="flex-1">
            <AgentPanel title="Audit Log" icon={FileText} entries={auditEntries} accentColor="text-ember-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add dashboard/src/components/CrisisWorkspace.jsx dashboard/src/components/AgentPanel.jsx
git commit -m "feat: add CrisisWorkspace with Search, Comms, Audit panels and Jason controls"
```

---

### Task 10: Wire CrisisWorkspace into dashboard App

**Files:**
- Modify: `dashboard/src/App.jsx`
- Modify: `dashboard/src/hooks/useDashboard.js`

**Step 1: Update `useDashboard.js` to track agent outputs and crisis messages**

Add state for agent outputs and messages. Add handlers for `agent:output`, `agent:joined`, `crisis:ended`, `ai:message`, `admin:message` events. Add `takeover` and `endCrisis` functions.

```javascript
const [agentOutputs, setAgentOutputs] = useState([]);
const [crisisMessages, setCrisisMessages] = useState({});
const [jasonActive, setJasonActive] = useState({});

// Inside the useEffect where socket events are set up:

s.on('agent:output', (data) => {
  setAgentOutputs((prev) => [...prev, data]);
});

s.on('agent:joined', (data) => {
  const msg = { id: Date.now(), sender: 'system', content: `${data.agentName} has joined the conversation` };
  setCrisisMessages((prev) => ({
    ...prev,
    [data.sessionId]: [...(prev[data.sessionId] || []), msg],
  }));
  if (data.agentName.includes('Jason')) {
    setJasonActive((prev) => ({ ...prev, [data.sessionId]: true }));
  }
});

s.on('crisis:ended', (data) => {
  const msg = { id: Date.now(), sender: 'system', content: 'Crisis protocol has ended' };
  setCrisisMessages((prev) => ({
    ...prev,
    [data.sessionId]: [...(prev[data.sessionId] || []), msg],
  }));
  setJasonActive((prev) => ({ ...prev, [data.sessionId]: false }));
  setCrisisSessions((prev) => prev.filter((s) => s.sessionId !== data.sessionId));
});

s.on('ai:message', (data) => {
  const msg = { id: Date.now(), sender: data.sender || 'ai', content: data.message };
  setCrisisMessages((prev) => ({
    ...prev,
    [data.sessionId]: [...(prev[data.sessionId] || []), msg],
  }));
});

s.on('admin:message', (data) => {
  const msg = { id: Date.now(), sender: 'admin', content: data.message };
  setCrisisMessages((prev) => ({
    ...prev,
    [data.sessionId]: [...(prev[data.sessionId] || []), msg],
  }));
});
```

Add takeover and endCrisis functions:

```javascript
const takeover = useCallback(
  (sessionId) => {
    if (socket) socket.emit('admin:takeover', { sessionId });
  },
  [socket]
);

const endCrisis = useCallback(
  async (sessionId) => {
    try {
      await fetch(`${SERVER_URL}/api/admin/sessions/${sessionId}/end-crisis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to end crisis:', err.message);
    }
  },
  [token]
);
```

Return all new values from the hook.

**Step 2: Update App.jsx to use CrisisWorkspace**

Import CrisisWorkspace and render it when `page === 'crisis'`:

```jsx
import CrisisWorkspace from './components/CrisisWorkspace';

// In the return, replace the CrisisView render with:
{page === 'crisis' && selectedSession && (
  <CrisisWorkspace
    session={selectedSession}
    token={token}
    messages={crisisMessages[selectedSession.id || selectedSession.sessionId] || []}
    agentOutputs={agentOutputs.filter((o) => o.sessionId === (selectedSession.id || selectedSession.sessionId))}
    sendIntercept={sendIntercept}
    onTakeover={() => takeover(selectedSession.id || selectedSession.sessionId)}
    onEndCrisis={() => endCrisis(selectedSession.id || selectedSession.sessionId)}
    onBack={() => setPage('monitor')}
    isJasonActive={jasonActive[selectedSession.id || selectedSession.sessionId] || false}
  />
)}
```

**Step 3: Commit**

```bash
git add dashboard/src/App.jsx dashboard/src/hooks/useDashboard.js
git commit -m "feat: wire CrisisWorkspace into dashboard with agent outputs and Jason controls"
```

---

## Workstream E: Tests & Integration

### Task 11: Write agent orchestrator integration test

**Files:**
- Modify: `server/__tests__/agentOrchestrator.test.js`

**Step 1: Add test for `callAgent` with mocked axios**

```javascript
const axios = require('axios');
jest.mock('axios');

describe('callAgent', () => {
  const { callAgent, AGENT_ROLES } = require('../services/agentOrchestrator');

  beforeEach(() => {
    process.env.LEMONADE_API_KEY = 'test-key';
    process.env.LEMONADE_API_URL = 'https://test.api/run_assistant';
    process.env.LEMONADE_AGENT_CHATBOT_ID = 'chatbot-123';
  });

  test('calls Lemonade API with correct assistant ID and input', async () => {
    axios.post.mockResolvedValue({
      data: { Conversation_ID: 'conv-1', response: 'Hello there', Error: 'No' },
    });

    const result = await callAgent(AGENT_ROLES.CHATBOT, 'Hi');

    expect(axios.post).toHaveBeenCalledWith(
      'https://test.api/run_assistant',
      { assistant_id: 'chatbot-123', conversation_id: '', input: 'Hi' },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    );
    expect(result.response).toBe('Hello there');
    expect(result.conversationId).toBe('conv-1');
  });

  test('passes existing conversation ID', async () => {
    axios.post.mockResolvedValue({
      data: { Conversation_ID: 'conv-1', response: 'Ok', Error: 'No' },
    });

    await callAgent(AGENT_ROLES.CHATBOT, 'Hi', 'existing-conv');

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ conversation_id: 'existing-conv' }),
      expect.any(Object)
    );
  });

  test('throws on API error', async () => {
    axios.post.mockResolvedValue({
      data: { Error: 'Yes', Error_Reason: 'Bad request' },
    });

    await expect(callAgent(AGENT_ROLES.CHATBOT, 'Hi')).rejects.toThrow('Bad request');
  });

  test('throws when agent not configured', async () => {
    delete process.env.LEMONADE_AGENT_CHATBOT_ID;
    await expect(callAgent(AGENT_ROLES.CHATBOT, 'Hi')).rejects.toThrow('not configured');
  });
});
```

**Step 2: Run tests**

Run: `cd server && npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add server/__tests__/agentOrchestrator.test.js
git commit -m "test: add callAgent integration tests with mocked axios"
```

---

### Task 12: Commit all changes, push, verify builds

**Step 1: Verify server tests pass**

Run: `cd server && npm test`
Expected: All tests pass

**Step 2: Verify chatbot builds**

Run: `cd chatbot && npx vite build`
Expected: Build succeeds

**Step 3: Verify dashboard builds**

Run: `cd dashboard && npx vite build`
Expected: Build succeeds

**Step 4: Push to GitHub**

```bash
git push origin main
```

---

## Parallel Execution Map

```
Workstream A (Tasks 1-3): Agent orchestrator + env + schema
  ↓ (must complete first)
Workstream B (Tasks 4-6): Crisis protocol server logic
  ↓ (must complete before C and D)
Workstream C (Tasks 7-8): Chatbot widget UI ──┐
Workstream D (Tasks 9-10): Dashboard crisis    ├── Can run in PARALLEL
Workstream E (Task 11): Tests                 ──┘
  ↓
Task 12: Final verification + push
```

Tasks 7-8, 9-10, and 11 are independent and can be dispatched as parallel agents once Tasks 1-6 are complete.
