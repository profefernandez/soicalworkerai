import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';

export default function ChatWidget({ sessionId }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, {
      boxShadow: '0 0 24px rgba(232, 145, 58, 0.5)',
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  useEffect(() => {
    if (!panelRef.current || !open) return;
    gsap.fromTo(
      panelRef.current,
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
    );
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div ref={panelRef}>
          <ChatWindow sessionId={sessionId} />
        </div>
      )}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full ember-gradient flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <X className="w-6 h-6 text-ember-text" />
        ) : (
          <MessageCircle className="w-6 h-6 text-ember-text" />
        )}
      </button>
    </div>
  );
}
