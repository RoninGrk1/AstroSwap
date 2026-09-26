/**
 * Railgun engine lifecycle — browser / client only.
 */

import {
  NetworkName,
  type FallbackProviderJsonConfig,
  type MerkletreeScanUpdateEvent,
} from "@railgun-community/shared-models";
import { createBrowserArtifactStore } from "./artifact-store";
import type { MerkletreeProgress } from "./types";

let engineStarted = false;
let engineStartPromise: Promise<void> | null = null;
let ethereumProviderLoaded = false;

export type EngineProgressHandlers = {
  onUTXOScan?: (p: MerkletreeProgress) => void;
  onTXIDScan?: (p: MerkletreeProgress) => void;
  onLog?: (msg: string) => void;
};

function ethereumProviderConfig(): FallbackProviderJsonConfig {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY?.trim() || "";
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY?.trim() || "";
  const providers: FallbackProviderJsonConfig["providers"] = [];

  if (alchemyKey) {
    providers.push({
      provider: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      priority: 1,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2_500,
    });
  }
  if (infuraKey) {
    providers.push({
      provider: `https://mainnet.infura.io/v3/${infuraKey}`,
      priority: 2,
      weight: 1,
      maxLogsPerBatch: 10,
      stallTimeout: 2_500,
    });
  }
  // Public fallbacks — may rate-limit during heavy merkletree sync
  providers.push({
    provider: "https://eth.llamarpc.com",
    priority: alchemyKey || infuraKey ? 3 : 1,
    weight: 1,
    maxLogsPerBatch: 5,
    stallTimeout: 3_500,
  });
  providers.push({
    provider: "https://rpc.ankr.com/eth",
    priority: 4,
    weight: 1,
    maxLogsPerBatch: 5,
    stallTimeout: 3_500,
  });

  return { chainId: 1, providers };
}

function mapScan(evt: MerkletreeScanUpdateEvent): MerkletreeProgress {
  return {
    progress: typeof evt.progress === "number" ? evt.progress : 0,
    status: String(evt.scanStatus ?? "scanning"),
  };
}

export function isEngineStarted(): boolean {
  return engineStarted;
}

export function isEthereumProviderLoaded(): boolean {
  return ethereumProviderLoaded;
}

/**
 * Start Railgun engine + snarkjs prover + Ethereum provider.
 * Safe to call multiple times; concurrent callers share one promise.
 */
export async function ensureRailgunEngine(
  handlers: EngineProgressHandlers = {},
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Railgun engine must start in the browser");
  }
  if (engineStarted) {
    if (!ethereumProviderLoaded) {
      await loadEthereumProvider();
    }
    return;
  }
  if (engineStartPromise) return engineStartPromise;

  engineStartPromise = (async () => {
    const wallet = await import("@railgun-community/wallet");
    const Level = (await import("level-js")).default;

    if (handlers.onUTXOScan) {
      wallet.setOnUTXOMerkletreeScanCallback((evt) =>
        handlers.onUTXOScan?.(mapScan(evt)),
      );
    }
    if (handlers.onTXIDScan) {
      wallet.setOnTXIDMerkletreeScanCallback((evt) =>
        handlers.onTXIDScan?.(mapScan(evt)),
      );
    }

    const artifactStore = await createBrowserArtifactStore();
    const db = new Level("astroswap-railgun-engine");

    const poiNodeURLs = [
      process.env.NEXT_PUBLIC_RAILGUN_POI_NODE?.trim() ||
        "https://ppoi.fdi.network",
    ];

    await wallet.startRailgunEngine(
      "astroswap",
      db,
      Boolean(process.env.NEXT_PUBLIC_RAILGUN_DEBUG),
      artifactStore,
      false, // WASM artifacts (browser)
      false, // do not skip merkletree — needed for private balances
      poiNodeURLs,
      [],
      false,
    );

    // Groth16 prover (needed for unshield / private sends; shield can work without it)
    try {
      const { groth16 } = await import("snarkjs");
      wallet.getProver().setSnarkJSGroth16(
        // snarkjs typing vs SDK SnarkJSGroth16 are structurally compatible
        groth16 as unknown as Parameters<
          ReturnType<typeof wallet.getProver>["setSnarkJSGroth16"]
        >[0],
      );
    } catch (err) {
      handlers.onLog?.(
        `Prover setup skipped/failed (shield still works): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    engineStarted = true;
    await loadEthereumProvider();
    handlers.onLog?.("Railgun engine ready (Ethereum)");
  })();

  try {
    await engineStartPromise;
  } catch (err) {
    engineStartPromise = null;
    engineStarted = false;
    throw err;
  }
}

async function loadEthereumProvider(): Promise<void> {
  const wallet = await import("@railgun-community/wallet");
  const config = ethereumProviderConfig();
  await wallet.loadProvider(config, NetworkName.Ethereum, 7_500);
  ethereumProviderLoaded = true;
}

export async function stopRailgunEngineSafe(): Promise<void> {
  if (!engineStarted) return;
  try {
    const wallet = await import("@railgun-community/wallet");
    await wallet.stopRailgunEngine();
  } finally {
    engineStarted = false;
    ethereumProviderLoaded = false;
    engineStartPromise = null;
  }
}
