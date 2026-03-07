import { useState } from 'react';
import ConsentGate from './components/ConsentGate';
import ChatWindow from './components/ChatWindow';

const SESSION_ID = window.__CHATBOT_SESSION_ID__ || 'demo-session';

export default function App() {
  const [consented, setConsented] = useState(false);

  if (!consented) {
    return <ConsentGate onConsent={() => setConsented(true)} />;
  }

  return <ChatWindow sessionId={SESSION_ID} />;
}
