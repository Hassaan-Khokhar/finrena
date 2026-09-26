'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthModal } from '../../context/auth-modal-context';
import { getSupabaseClient } from '../../lib/supabase';
import { FinrenaLogo } from './finrena-logo';
import { X, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Social OAuth Handler
  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setOauthLoading(provider);

    try {
      const supabase = getSupabaseClient();
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback` 
        : 'http://localhost:3000/auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(`${provider} OAuth Error:`, err);
      setErrorMessage(
        err.message?.includes('provider is not enabled')
          ? `${provider.toUpperCase()} provider is not toggled ON in your Supabase Dashboard settings.`
          : err.message || `Failed to connect with ${provider}.`
      );
      setOauthLoading(null);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // If on email step, validate and advance to password
    if (step === 'email') {
      if (!email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      setStep('password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Authentication failed. Please verify your credentials.');
      }

      setSuccessMessage(result.message || 'Authenticated successfully.');

      if (typeof window !== 'undefined' && result.data) {
        localStorage.setItem('finrena_user', JSON.stringify(result.data));
      }

      setTimeout(() => {
        closeAuthModal();
        window.location.reload(); // Refresh session in view
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dimmed Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/75 backdrop-blur-[3px] transition-opacity"
      />

      {/* Perplexity-style Auth Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-[420px] bg-[#18181b] border border-zinc-800/90 rounded-2xl p-7 sm:p-8 relative shadow-2xl z-10 text-zinc-100"
      >
        {/* Top Right Close 'X' Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-md"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Centered Brand Logo */}
        <div className="flex justify-center mb-4">
          <FinrenaLogo className="w-10 h-10" />
        </div>

        {/* Elegant Serif Headline */}
        <h2 className="font-serif text-[24px] sm:text-[27px] font-normal text-center text-zinc-100 tracking-tight leading-snug max-w-[320px] mx-auto">
          Sign up below to unlock the full potential of Finrena
        </h2>

        {/* Privacy Policy & Terms of Service Subtext */}
        <p className="text-xs text-zinc-400 text-center mt-2.5 mb-6">
          By continuing, you agree to our{' '}
          <Link href="/legal" className="underline underline-offset-2 hover:text-zinc-200 transition-colors">
            privacy policy
          </Link>{' '}
          and{' '}
          <Link href="/legal" className="underline underline-offset-2 hover:text-zinc-200 transition-colors">
            terms of service
          </Link>
          .
        </p>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Social OAuth Buttons */}
        <div className="space-y-2.5">
          {/* Continue with Google */}
          <button
            type="button"
            disabled={loading || !!oauthLoading}
            onClick={() => handleOAuth('google')}
            className="w-full h-11 bg-[#ececec] hover:bg-white text-zinc-900 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Continue with GitHub */}
          <button
            type="button"
            disabled={loading || !!oauthLoading}
            onClick={() => handleOAuth('github')}
            className="w-full h-11 bg-[#262626] hover:bg-[#303030] text-zinc-100 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {oauthLoading === 'github' ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (step === 'password' && !e.target.value) {
                setStep('email');
              }
            }}
            placeholder="Enter your email"
            className="w-full h-11 bg-[#141416] border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />

          {/* Password step (smoothly revealed) */}
          <AnimatePresence>
            {step === 'password' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 bg-[#141416] border border-zinc-800 rounded-xl pl-4 pr-11 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 bg-[#262626] hover:bg-[#303030] text-zinc-200 font-medium text-sm rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
            ) : (
              <span>{step === 'password' ? 'Continue' : 'Continue with email'}</span>
            )}
          </button>
        </form>

        {/* Bottom Close Action */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="text-xs text-zinc-400 hover:text-zinc-200 text-center mt-5 block w-full transition-colors cursor-pointer"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
