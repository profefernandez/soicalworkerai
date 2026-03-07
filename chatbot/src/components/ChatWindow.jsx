import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Send, AlertTriangle } from 'lucide-react';
import { useChat } from '../hooks/useChat';

function MessageBubble({ sender, content, index }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, delay: index * 0.05, ease: 'power2.out' }
    );
  }, [index]);

  const styles = {
    client:
      'ml-8 bg-gradient-to-br from-ember-primary/20 to-ember-secondary/10 border border-ember-primary/20 text-ember-text',
    ai: 'mr-8 frost-panel text-ember-text',
    admin: 'mr-8 frost-panel border border-ember-secondary/40 text-ember-text',
  };

  const labels = { client: null, ai: 'AI Counselor', admin: 'Crisis Team' };

  return (
    <div ref={ref} className={`rounded-xl px-4 py-3 text-sm ${styles[sender] || styles.ai}`}>
      {labels[sender] && (
        <span className="text-xs font-mono text-ember-muted block mb-1">{labels[sender]}</span>
      )}
      {content}
    </div>
  );
}

export default function ChatWindow({ sessionId }) {
  const { messages, connected, crisisActive, sendMessage } = useChat(sessionId);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  };

  return (
    <div
      className={`w-80 h-[480px] rounded-2xl overflow-hidden flex flex-col shadow-2xl ${
        crisisActive ? 'animate-pulse-crisis' : ''
      }`}
      style={{ background: '#1A1614' }}
    >
      <div className="frost-panel px-4 py-3 flex items-center justify-between border-b border-ember-text/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-ember-safe' : 'bg-ember-muted'}`} />
          <span className="font-heading text-ember-text text-sm">Support Chat</span>
        </div>
        {crisisActive && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ember-crisis/20 border border-ember-crisis/30">
            <AlertTriangle className="w-3 h-3 text-ember-crisis" />
            <span className="text-xs text-ember-crisis font-mono">Crisis Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-ember-muted text-sm text-center mt-8">How can I support you today?</p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} sender={msg.sender} content={msg.content} index={i} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="frost-panel px-3 py-3 border-t border-ember-text/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-ember-surface text-ember-text text-sm rounded-lg px-3 py-2 border border-ember-text/10 placeholder:text-ember-muted/60 focus:outline-none focus:ring-1 focus:ring-ember-primary/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="ember-gradient rounded-lg px-3 py-2 text-ember-text disabled:opacity-30 transition-all ember-glow"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
