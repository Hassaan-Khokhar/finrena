'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, LogOut } from 'lucide-react';
import { CommandMenu } from './command-menu';
import { useAuthModal } from '../../context/auth-modal-context';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
}

export function Navbar() {
  const { openAuthModal } = useAuthModal();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('finrena_user') : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        // ignore parse error
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          setUser(data.data);
          localStorage.setItem('finrena_user', JSON.stringify(data.data));
        }
      })
      .catch(() => {
        // Not authenticated
      });
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('finrena_user');
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 shrink-0 w-full">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          <Link href="/" className="font-bold text-lg tracking-tight text-zinc-100 flex items-center">
            Finrena
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-1 pl-2">
          <Link
            href="/chat"
            className="text-xs font-mono px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            WORKSPACE
          </Link>
          <Link
            href="/arena"
            className="text-xs font-mono px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            ARENA
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 mr-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-zinc-400 font-mono tracking-widest">MARKETS OPEN</span>
        </div>
        
        <CommandMenu />

        {user ? (
          <div className="flex items-center gap-3 pl-2">
            <div className="flex items-center gap-2 border border-zinc-800 rounded-full py-1 px-2.5 bg-zinc-900/60">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-500/40"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'A'}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-200 hidden sm:inline-block max-w-[120px] truncate">
                {user.fullName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:text-white hover:border-emerald-500/50 transition-all ml-2 cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
