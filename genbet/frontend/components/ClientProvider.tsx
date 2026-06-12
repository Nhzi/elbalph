'use client';

import { useEffect } from 'react';
import {
  getAnonAddress,
  getClient,
  getInjectedAddress,
  getMode,
  subscribeInjected,
} from '@/lib/genlayer';
import { getBalance } from '@/lib/contracts';
import { useStore } from '@/lib/store';

export function GenLayerProvider({ children }: { children: React.ReactNode }) {
  const setAddress = useStore((s) => s.setAddress);
  const setBalance = useStore((s) => s.setBalance);
  const setMode = useStore((s) => s.setMode);
  const mode = useStore((s) => s.mode);

  // Hydrate persisted mode + injected address once on mount.
  useEffect(() => {
    setMode(getMode());
    const unsub = subscribeInjected(() => {
      // Force a re-render via the store; address is read in the next effect.
      setAddress(getInjectedAddress());
    });
    return unsub;
  }, [setMode, setAddress]);

  useEffect(() => {
    // Warm the client so the first contract call doesn't pay the construction cost.
    getClient();

    const addr =
      mode === 'MKMC'
        ? (getInjectedAddress() as `0x${string}` | null)
        : (getAnonAddress() as `0x${string}` | null);
    setAddress(addr);

    if (!addr) {
      setBalance(0n);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const bal = await getBalance(addr);
        if (!cancelled) setBalance(bal);
      } catch {
        // Ignore — RPC may be unreachable briefly during chain switch.
      }
    };
    refresh();
    const t = setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [mode, setAddress, setBalance]);

  return <>{children}</>;
}
