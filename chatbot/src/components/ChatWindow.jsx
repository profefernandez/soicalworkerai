import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Send, AlertTriangle, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import SafetyBanner from './SafetyBanner';

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
    client: 'ml-12 bg-gradient-to-br from-ember-primary/20 to-ember-secondary/10 border border-ember-primary/20 text-ember-text',
    ai: 'mr-12 frost-panel text-ember-text',
    social_worker_ai: 'mr-12 frost-panel border border-ember-secondary/40 text-ember-text bg-ember-secondary/5',
    admin: 'mr-12 frost-panel border border-ember-primary/40 text-ember-text bg-ember-primary/5',
    system: 'mx-auto text-center max-w-xs',
  };

  const labels = {
    client: null,
    ai: 'Study Assistant',
    social_worker_ai: 'Profe',
    admin: 'Jason Fernandez, LMSW',
    system: null,
  };

  if (sender === 'system') {
    return (
      <div ref={ref} className="py-2">
        <div className="frost-panel rounded-full px-4 py-1.5 text-[11px] font-mono text-ember-muted mx-auto w-fit border border-ember-text/10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${styles[sender] || styles.ai}`}>
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
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

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
      ref={containerRef}
      className={`min-h-screen bg-ember-base flex flex-col ${crisisActive ? 'animate-pulse-crisis' : ''}`}
    >
      {/* Header */}
      <div className="frost-panel px-6 py-4 flex items-center justify-between border-b border-ember-text/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg ember-gradient flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-ember-text" />
          </div>
          <div>
            <h1 className="font-heading text-ember-text text-lg leading-tight">60 Watts of Intelligence</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-ember-safe' : 'bg-ember-muted'}`} />
              <span className="text-[10px] font-mono text-ember-muted">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        {crisisActive && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ember-crisis/20 border border-ember-crisis/30">
            <AlertTriangle className="w-3.5 h-3.5 text-ember-crisis" />
            <span className="text-xs text-ember-crisis font-mono">Crisis Protocol Active</span>
          </div>
        )}
      </div>

      <SafetyBanner crisisActive={crisisActive} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-16">
              <div className="w-12 h-12 rounded-full bg-ember-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ember-primary" />
              </div>
              <p className="text-ember-text text-sm font-medium mb-1">Hey! Ready to study?</p>
              <p className="text-ember-muted text-xs mb-4">Ask me anything — homework, test prep, or just curious questions.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => sendMessage('Help me with my math homework')}
                  className="text-[11px] font-mono text-ember-muted bg-ember-surface px-3 py-1.5 rounded-full border border-ember-text/10 hover:border-ember-primary/30 hover:text-ember-text transition-colors"
                >
                  Help with math
                </button>
                <button
                  onClick={() => sendMessage('Explain photosynthesis')}
                  className="text-[11px] font-mono text-ember-muted bg-ember-surface px-3 py-1.5 rounded-full border border-ember-text/10 hover:border-ember-primary/30 hover:text-ember-text transition-colors"
                >
                  Explain photosynthesis
                </button>
                <button
                  onClick={() => sendMessage('Help me write an essay outline')}
                  className="text-[11px] font-mono text-ember-muted bg-ember-surface px-3 py-1.5 rounded-full border border-ember-text/10 hover:border-ember-primary/30 hover:text-ember-text transition-colors"
                >
                  Essay outline
                </button>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} sender={msg.sender} content={msg.content} index={i} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="frost-panel px-4 py-4 border-t border-ember-text/5">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 bg-ember-surface text-ember-text text-sm rounded-xl px-4 py-3 border border-ember-text/10 placeholder:text-ember-muted/60 focus:outline-none focus:ring-1 focus:ring-ember-primary/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="ember-gradient rounded-xl px-4 py-3 text-ember-text disabled:opacity-30 transition-all ember-glow"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-ember-muted/40 text-[10px] font-mono mt-3">
          Type <span className="text-ember-muted/60">@profe</span> to talk to Profe &middot; 988 or 911 for emergencies
        </p>
      </div>
    </div>
  );
}
