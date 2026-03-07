import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Shield, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (!formRef.current) return;
    gsap.fromTo(
      formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ember-base flex items-center justify-center px-4">
      <div ref={formRef} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl ember-gradient mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-ember-text" />
          </div>
          <h1 className="font-heading text-2xl text-ember-text">Crisis Monitor</h1>
          <p className="text-ember-muted text-sm mt-1">60 Watts of Clarity</p>
        </div>

        <form onSubmit={handleSubmit} className="frost-panel rounded-2xl p-6 space-y-4">
          {error && (
            <div className="text-sm text-ember-crisis bg-ember-crisis/10 border border-ember-crisis/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-ember-muted font-mono block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-ember-surface text-ember-text rounded-lg px-3 py-2.5 border border-ember-text/10 focus:outline-none focus:ring-1 focus:ring-ember-primary/50 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-ember-muted font-mono block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-ember-surface text-ember-text rounded-lg px-3 py-2.5 border border-ember-text/10 focus:outline-none focus:ring-1 focus:ring-ember-primary/50 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full ember-gradient text-ember-text font-body font-medium rounded-lg py-2.5 transition-all ember-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
