'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useStore } from '@/lib/store';
import {
  connectInjected,
  disconnectInjected,
  fmtGen,
  hasInjectedProvider,
  setMode as persistMode,
} from '@/lib/genlayer';

const tabs = [
  { href: '/', label: 'Lobby' },
  { href: '/sports', label: 'Sports' },
  { href: '/casino', label: 'Casino' },
];

export function Header() {
  const pathname = usePathname();
  const address = useStore((s) => s.address);
  const balanceWei = useStore((s) => s.balanceWei);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleMode = useCallback(async () => {
    if (busy) return;
    setErr(null);
    const next = mode === 'ANON' ? 'MKMC' : 'ANON';
    if (next === 'MKMC') {
      if (!hasInjectedProvider()) {
        setErr('No injected wallet found. Install MetaMask and reload.');
        return;
      }
      setBusy(true);
      try {
        await connectInjected();
        persistMode('MKMC');
        setMode('MKMC');
      } catch (e: any) {
        setErr(e?.shortMessage ?? e?.message ?? 'Wallet connect failed.');
      } finally {
        setBusy(false);
      }
    } else {
      // Going back to ANON — drop the cached injected handle so the next
      // switch re-prompts cleanly.
      disconnectInjected();
      persistMode('ANON');
      setMode('ANON');
    }
  }, [mode, busy, setMode]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be blocked on insecure origins — silently ignore.
    }
  }, [address]);

  const modePillClass =
    mode === 'MKMC'
      ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink'
      : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan';

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-ink/60 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-gradient-to-br from-neon-green via-neon-cyan to-neon-pink shadow-glow" />
            <span className="relative font-display text-[11px] font-black text-black">E</span>
          </span>
          <span className="font-display text-lg font-bold tracking-[0.18em]">
            ELBA<span className="text-neon-green">LPH</span>
          </span>
          <span className="pill ml-2 text-white/70">GenLayer L2</span>
        </Link>

        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = t.href === '/' ? pathname === '/' : pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Balance</div>
            <div className="font-mono text-sm text-neon-green">{fmtGen(balanceWei, 3)} GEN</div>
          </div>

          <button
            type="button"
            onClick={toggleMode}
            disabled={busy}
            title={
              mode === 'ANON'
                ? 'Currently using a browser-generated key. Click to connect an injected wallet (MKMC: My Keys, My Crypto).'
                : 'Currently using your injected wallet. Click to switch back to the local ANON key.'
            }
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold tracking-wider transition hover:brightness-125 disabled:opacity-50 ${modePillClass}`}
          >
            {busy ? '…' : mode}
          </button>

          <button
            type="button"
            onClick={copyAddress}
            title={address ?? 'No wallet'}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] tracking-tight transition hover:bg-white/10"
          >
            {address ? (copied ? 'Copied!' : address) : '—'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mx-auto max-w-6xl px-4 pb-2 text-right text-[11px] text-neon-pink">
          {err}
        </div>
      )}
    </header>
  );
}
