'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../../lib/supabase';
import { ShieldCheck, Activity, Terminal, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Initiating cryptographic handshake...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Check for session in URL hash or code exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // If no session immediate, listen for state change
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession?.user) {
              await syncUserWithBackend(currentSession.user);
            }
          });

          // Set timeout safety
          setTimeout(() => {
            if (!session) {
              setError('Failed to retrieve authentication token. Please try logging in again.');
            }
          }, 6000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else if (session?.user) {
          await syncUserWithBackend(session.user);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during institutional handshake.');
      }
    };

    const syncUserWithBackend = async (user: any) => {
      try {
        setStatusMessage('Syncing institutional analyst profile & credentials...');

        const provider = user.app_metadata?.provider?.toUpperCase() === 'GITHUB' ? 'GITHUB' : 'GOOGLE';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Trader Analyst';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        const oauthId = user.id;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

        const response = await fetch(`${apiUrl}/auth/oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: user.email,
            fullName,
            avatarUrl,
            provider,
            oauthId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Institutional session minting rejected by backend');
        }

        setStatusMessage('Access granted. Initializing autonomous quant workspace...');
        
        // Store user state for client immediate responsiveness
        if (typeof window !== 'undefined') {
          localStorage.setItem('finrena_user', JSON.stringify(data.data));
        }

        setTimeout(() => {
          router.push('/arena');
        }, 800);
      } catch (err: any) {
        setError(err.message || 'Failed to synchronize institutional credentials.');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Background ambient lighting */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -z-10 w-[700px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Handshake Interrupted</h2>
            <p className="text-sm text-zinc-400">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="mt-4 px-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Spinning Radar Beacon */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/40"
              />
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Institutional Handshake</span>
              </h2>
              <p className="text-xs font-mono text-emerald-400/90 animate-pulse">
                {statusMessage}
              </p>
            </div>

            <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                initial={{ width: '15%' }}
                animate={{ width: '92%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-mono">
              Dual-Token HttpOnly Rotation • Argon2 Encrypted • Relational ACID
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
