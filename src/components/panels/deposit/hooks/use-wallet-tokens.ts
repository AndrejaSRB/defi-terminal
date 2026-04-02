import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { walletAddressAtom } from "@/atoms/user/onboarding";
import { fetchWalletPositions } from "@/services/zerion/fetch-positions";
import {
  filterPositions,
  type WalletToken,
} from "@/services/zerion/filter-positions";

// Module-level cache — prevents re-fetching on tab switches / dialog reopens
let cachedAddress = "";
let cachedTokens: WalletToken[] = [];
let cachedAt = 0;
let fetchInFlight: Promise<WalletToken[]> | null = null;
const CACHE_TTL = 60_000; // 1 minute

export function useWalletTokens() {
  const walletAddress = useAtomValue(walletAddressAtom);
  const [tokens, setTokens] = useState<WalletToken[]>(
    walletAddress === cachedAddress ? cachedTokens : [],
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setTokens([]);
      return;
    }

    // Use cache if fresh
    if (
      walletAddress === cachedAddress &&
      cachedTokens.length > 0 &&
      Date.now() - cachedAt < CACHE_TTL
    ) {
      setTokens(cachedTokens);
      return;
    }

    // Deduplicate in-flight requests (handles StrictMode double-fire)
    if (!fetchInFlight) {
      fetchInFlight = fetchWalletPositions(walletAddress)
        .then(filterPositions)
        .finally(() => {
          fetchInFlight = null;
        });
    }

    let cancelled = false;
    setIsLoading(true);

    fetchInFlight
      .then((filtered) => {
        if (cancelled) return;
        cachedAddress = walletAddress;
        cachedTokens = filtered;
        cachedAt = Date.now();
        setTokens(filtered);
      })
      .catch(() => {
        if (!cancelled) setTokens([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const networks = [...new Set(tokens.map((token) => token.network))];

  return { tokens, networks, isLoading };
}
