const { pool } = require('../config/db');

/**
 * Process Profe's function calls from Mistral.
 * Routes each call to the correct handler and returns whether an intervention occurred.
 *
 * @param {Array} toolCalls - Parsed tool calls [{id, name, arguments}]
 * @param {string} sessionId - Current chat session ID
 * @param {Object} io - Socket.io server instance
 * @returns {Promise<{intervention: boolean, interventionMessage: string|null}>}
 */
async function handleProfeCalls(toolCalls, sessionId, io) {
  let intervention = false;
  let interventionMessage = null;

  for (const call of toolCalls) {
    try {
      switch (call.name) {
        case 'check_ai_response':
          await handleCheckAiResponse(call.arguments, sessionId, io);
          break;

        case 'flag_intervention': {
          const msg = await handleFlagIntervention(call.arguments, sessionId, io);
          intervention = true;
          interventionMessage = msg;
          break;
        }

        case 'log_observation':
          await handleLogObservation(call.arguments, sessionId, io);
          break;

        case 'notify_parent':
          await handleNotifyParent(call.arguments, sessionId, io);
          break;

        default:
          // eslint-disable-next-line no-console
          console.warn(`Unknown Profe function: ${call.name}`);
          break;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Profe handler error (${call.name}):`, err.message);
    }
  }

  return { intervention, interventionMessage };
}

async function handleCheckAiResponse(args, sessionId, io) {
  await pool.execute(
    `INSERT INTO profe_observations
      (session_id, observation_type, safety_rating, sycophancy_score, age_appropriate, manipulation_detected, recommended_action)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      'check_ai_response',
      args.safety_rating ?? null,
      args.sycophancy_score ?? null,
      args.age_appropriate != null ? (args.age_appropriate ? 1 : 0) : null,
      args.manipulation_detected != null ? (args.manipulation_detected ? 1 : 0) : null,
      args.recommended_action || null,
    ]
  );

  io.to('dashboard').emit('agent:output', {
    sessionId,
    agentRole: 'profe',
    type: 'check_ai_response',
    content: `Safety: ${args.safety_rating}/100 | Sycophancy: ${args.sycophancy_score}/100 | Age-appropriate: ${args.age_appropriate ? 'Yes' : 'No'}`,
    data: args,
    timestamp: new Date().toISOString(),
  });
}

async function handleFlagIntervention(args, sessionId, io) {
  // Log the intervention as an observation
  await pool.execute(
    `INSERT INTO profe_observations
      (session_id, observation_type, description, sentiment, recommended_action)
     VALUES (?, ?, ?, ?, ?)`,
    [
      sessionId,
      args.intervention_type === 'safety' ? 'concerning_pattern' : 'ai_behavior',
      args.reason || 'Profe intervention triggered',
      args.severity === 'critical' || args.severity === 'high' ? 'critical' : 'concerned',
      args.intervention_type || 'educational',
    ]
  );

  // Notify dashboard
  io.to('dashboard').emit('agent:output', {
    sessionId,
    agentRole: 'profe',
    type: 'flag_intervention',
    content: `[${args.severity?.toUpperCase()}] Intervention: ${args.reason}`,
    data: args,
    timestamp: new Date().toISOString(),
  });

  return args.message_to_child || "Hey, let me share something important about AI with you.";
}

async function handleLogObservation(args, sessionId, io) {
  await pool.execute(
    `INSERT INTO profe_observations
      (session_id, observation_type, description, sentiment, ai_literacy_level)
     VALUES (?, ?, ?, ?, ?)`,
    [
      sessionId,
      args.observation_type || 'log_observation',
      args.description || null,
      args.sentiment || 'neutral',
      args.ai_literacy_level || null,
    ]
  );

  io.to('dashboard').emit('agent:output', {
    sessionId,
    agentRole: 'profe',
    type: 'log_observation',
    content: `[${args.sentiment}] ${args.description || 'Observation logged'}`,
    data: args,
    timestamp: new Date().toISOString(),
  });
}

async function handleNotifyParent(args, sessionId, io) {
  await pool.execute(
    `INSERT INTO notifications
      (session_id, type, urgency, summary, recipient, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      'profe_alert',
      args.urgency || 'low',
      args.summary || 'Profe flagged an observation',
      'parent_dashboard',
      'sent',
    ]
  );

  io.to('dashboard').emit('notification:new', {
    sessionId,
    urgency: args.urgency,
    type: args.notification_type,
    summary: args.summary,
    recommendedAction: args.recommended_action,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { handleProfeCalls };
