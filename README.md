# AstroSwap

**Swap Freely. Trade Privately. Explore Beyond.**

AstroSwap is a decentralised exchange UI with a real Railgun privacy path on Ethereum.  
**Phase 2** ships production **public** Uniswap V3 swaps on **Base** + **Ethereum**, plus an honest **Railgun shield + private balance** flow on **Ethereum only**.

> We **never** fake privacy, balances, rates, or transaction hashes.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- wagmi v2 + viem + RainbowKit
- Uniswap V3 QuoterV2 + SwapRouter02 (direct contract calls)
- Railgun: `@railgun-community/wallet@10.4.0` + `shared-models@7.6.1` + `snarkjs` + `level-js` (browser)

## Quick start

```bash
cd /workspace/astroswap
cp .env.example .env.local
# Edit .env.local with your keys (recommended for wallets/RPC; important for Railgun sync)
npm install
npm run dev
# If port 3000 is busy: npm run dev -- -p 3021
```

Open http://localhost:3000

### Scripts

| Script          | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Development server       |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | ESLint                   |

## Environment variables

Copy `.env.example` → `.env.local` (local) or set the same keys in your host (Vercel / Docker).

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Recommended | WalletConnect Cloud project ID ([cloud.walletconnect.com](https://cloud.walletconnect.com)). Without it, WalletConnect / many mobile wallets fail; injected browsers wallets (e.g. MetaMask) may still connect. |
| `NEXT_PUBLIC_ALCHEMY_KEY` | Recommended | Alchemy key for Base + Ethereum. Strongly recommended for Railgun merkletree sync. |
| `NEXT_PUBLIC_INFURA_KEY` | Optional | Infura fallback if Alchemy is unset |
| `NEXT_PUBLIC_RAILGUN_POI_NODE` | Optional | Private POI aggregator (default `https://ppoi.fdi.network`) |
| `NEXT_PUBLIC_RAILGUN_DEBUG` | Optional | Set to `1` for engine debug logs |

The in-app amber **Setup** banner lists missing keys and is dismissible for the session. Public swaps still work on public RPCs (they may rate-limit).

## What works

### Public swaps (Base + Ethereum)

- RainbowKit connect; curated tokens; live Uniswap V3 quotes
- Approve + SwapRouter02 execution; session activity with explorer links

### Private (Railgun) — Ethereum only

| Capability | Status |
|------------|--------|
| Engine init (LevelDB / IndexedDB, WASM artifacts, Ethereum provider) | Wired |
| 0zk wallet create / import / unlock (password → PBKDF2 encryption key) | Wired |
| **Shield** ERC-20 / ETH into Railgun proxy `0xfa70…A4b9` | Wired — real txs |
| Private balance view (from scan callbacks only) | Wired — empty until sync reports notes |
| Unshield prove + populate | Code in `src/lib/privacy/unshield.ts` — UI deferred |
| Private AMM swap (cookbook / 0x cross-contract) | **Blocked** — see below |
| Base private mode | **Disabled** — no Railgun deployment |

### How to try shield

1. Connect wallet → switch to **Ethereum**
2. Swap page → **Private**
3. Initialise Railgun engine
4. Create / unlock 0zk wallet (back up mnemonic once)
5. Enter amount → **Shield** (sign message + submit tx)
6. Wait for merkletree sync before expecting private balances

## Privacy limitations (read this)

- **Shield boundary is public**: your address, token, and amount are visible on the shield tx.
- **Gas** is always paid publicly.
- **Base** has no Railgun deployment (PSR #27 proposed it Aug 2026; not live). Private CTA stays disabled there.
- **Private balances** are never fabricated. Until the engine reports amounts, the UI shows empty / syncing.
- **Session activity** only lists real submitted hashes.
- **No private AMM yet** — see cookbook mismatch below.
- **Mnemonic / password security**:
  - Encryption key = PBKDF2(password, salt, 100k iterations). Kept **in memory only** while unlocked.
  - localStorage stores wallet id, 0zk address, salt, and a password verifier hash — **not** the mnemonic or encryption key.
  - Mnemonic is shown **once** on create for backup. AstroSwap does not persist it.
  - Losing both mnemonic and password means the 0zk wallet cannot be recovered on a new device.
  - Use a strong unique password; treat the mnemonic like a seed phrase (offline backup).

### Why not full private swaps yet?

`@railgun-community/cookbook@3` depends on `shared-models@~8.2`, while the documented stable Wallet SDK is `wallet@10.4.0` / `shared-models@7.x`. Shipping cookbook alongside stable wallet would mix majors. Private swaps also need a quote venue (e.g. 0x) and preferably a Waku broadcaster. Phase 2.1 can align wallet 11.x + cookbook when ready.

**Do not force-install a mismatched cookbook.**

## Architecture map

```
src/lib/privacy/
  types.ts          # modes, phases, honest capability types
  chains.ts         # Ethereum supported / Base not; official contract addresses
  capability.ts     # runtime + static capability copy
  security.ts       # PBKDF2 password model (no plaintext mnemonic storage)
  artifact-store.ts # IndexedDB ArtifactStore
  engine.ts         # startRailgunEngine + loadProvider(Ethereum)
  wallet.ts         # create / import / unlock 0zk wallet
  shield.ts         # populateShield / populateShieldBaseToken
  balances.ts       # balance callbacks + refresh
  unshield.ts       # prove + populate unshield (library)
src/hooks/useRailgun.ts
src/hooks/usePrivateShield.ts
src/components/privacy/
```

Official Ethereum contracts (from `@railgun-community/shared-models`):

- Proxy: `0xfa7093cdd9ee6932b4eb2c9e1cde7ce00b1fa4b9`
- Relay Adapt: `0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a`

## Deployment

### Vercel (recommended)

1. Import the repo in Vercel
2. Framework preset: **Next.js** (see `vercel.json`)
3. Set `NEXT_PUBLIC_*` env vars (same as `.env.example`)
4. Build command: `npm run build` · Node **20+**
5. Deploy. First client visit that opens Private mode downloads proving artifacts into IndexedDB

```bash
npm run build   # must succeed locally before shipping
npm run start   # smoke-test production server
```

### Docker (optional)

Lightweight multi-stage image using Next.js `output: "standalone"`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_id \
  --build-arg NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key \
  -t astroswap .

docker run --rm -p 3000:3000 astroswap
```

`NEXT_PUBLIC_*` values are inlined at **build** time for the client bundle — pass them as `--build-arg`s.

## Known residual issues

- Webpack warns about a dynamic `require` inside `@graphql-tools/url-loader` (Railgun txid GraphQL path). Harmless at runtime; build still succeeds.
- First Railgun engine init + artifact download can take noticeable time and needs a reliable Ethereum RPC.
- Unshield UI is deferred; private AMM is intentionally blocked until cookbook majors align.
- Session activity is in-memory / browser session only — not a global indexer.

## Licence

Private / project-specific — adjust as needed for your organisation.
