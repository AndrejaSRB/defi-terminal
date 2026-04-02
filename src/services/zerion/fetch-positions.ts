const isDev = import.meta.env.DEV;
const ZERION_API_KEY = import.meta.env.VITE_ZERION_API_KEY ?? "";

const ZERION_BASE = isDev ? "https://api.zerion.io/v1" : "/api/zerion";

function getAuthHeader(): string {
  return `Basic ${btoa(`${ZERION_API_KEY}:`)}`;
}

export interface ZerionPosition {
  id: string;
  attributes: {
    position_type: string;
    quantity: {
      float: number;
    };
    value: number | null;
    price: number;
    fungible_info: {
      name: string;
      symbol: string;
      icon: { url: string } | null;
      flags: { verified: boolean };
      implementations: Array<{
        chain_id: string;
        address: string | null;
        decimals: number;
      }>;
    };
  };
  relationships: {
    chain: {
      data: {
        id: string;
      };
    };
  };
}

interface ZerionResponse {
  data: ZerionPosition[];
}

export async function fetchWalletPositions(
  address: string,
): Promise<ZerionPosition[]> {
  if (!address) return [];

  if (isDev && !ZERION_API_KEY) {
    throw new Error("Missing VITE_ZERION_API_KEY in development");
  }

  const params = new URLSearchParams({
    "filter[position_types]": "wallet",
    "filter[trash]": "only_non_trash",
    currency: "usd",
    sort: "value",
  });

  const url = `${ZERION_BASE}/wallets/${address}/positions/?${params.toString()}`;

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (isDev) {
    headers.Authorization = getAuthHeader();
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zerion request failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as ZerionResponse;

  if (!result || !Array.isArray(result.data)) {
    throw new Error("Invalid Zerion response shape");
  }

  return result.data;
}
