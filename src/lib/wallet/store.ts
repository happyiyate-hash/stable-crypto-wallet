import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_HOLDINGS,
  type AssetId,
  type NetworkId,
} from "@/lib/wallet/assets";
import {
  deriveAddresses,
  generateMnemonic,
  hashPin,
  isValidMnemonic,
  normalizeMnemonic,
  type Addresses,
} from "@/lib/wallet/mnemonic";
import { randomHex } from "@/lib/utils";

export type TxType = "send" | "receive" | "swap";
export type TxStatus = "confirmed" | "pending";

export type Transaction = {
  id: string;
  type: TxType;
  status: TxStatus;
  assetId: AssetId;
  amount: number;
  toAssetId?: AssetId;
  toAmount?: number;
  counterparty?: string;
  hash: string;
  timestamp: number;
};

export type WalletRecord = {
  name: string;
  phrase: string;
  addresses: Addresses;
  createdAt: number;
  pinHash: string | null;
  pinSalt: string | null;
};

type WalletState = {
  wallet: WalletRecord | null;
  holdings: Record<AssetId, number>;
  txs: Transaction[];
  locked: boolean;
  hideBalances: boolean;
  network: NetworkId;
  hydrated: boolean;
  setupComplete: boolean;
  setHydrated: () => void;
  completeSetup: () => void;
  createWallet: (name: string) => Promise<WalletRecord>;
  restoreWallet: (phrase: string, name: string) => Promise<WalletRecord>;
  setPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  send: (input: {
    assetId: AssetId;
    amount: number;
    to: string;
  }) => Transaction;
  swap: (input: {
    fromId: AssetId;
    toId: AssetId;
    fromAmount: number;
    toAmount: number;
  }) => Transaction;
  toggleHideBalances: () => void;
  setNetwork: (network: NetworkId) => void;
  rename: (name: string) => void;
  reset: () => void;
};

function seedTxs(now: number): Transaction[] {
  return [
    {
      id: "tx-seed-1",
      type: "receive",
      status: "confirmed",
      assetId: "ethereum",
      amount: 0.5,
      counterparty: "0x28c6d61185d90b2866998c15dc9793b3eb0a47d0",
      hash: `0x${randomHex(32)}`,
      timestamp: now - 1000 * 60 * 42,
    },
    {
      id: "tx-seed-2",
      type: "swap",
      status: "confirmed",
      assetId: "usd-coin",
      amount: 400,
      toAssetId: "solana",
      toAmount: 2.24,
      hash: `0x${randomHex(32)}`,
      timestamp: now - 1000 * 60 * 60 * 18,
    },
    {
      id: "tx-seed-3",
      type: "send",
      status: "confirmed",
      assetId: "usd-coin",
      amount: 250,
      counterparty: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      hash: `0x${randomHex(32)}`,
      timestamp: now - 1000 * 60 * 60 * 40,
    },
    {
      id: "tx-seed-4",
      type: "receive",
      status: "confirmed",
      assetId: "bitcoin",
      amount: 0.02,
      counterparty: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      hash: `0x${randomHex(32)}`,
      timestamp: now - 1000 * 60 * 60 * 24 * 5,
    },
  ];
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      holdings: { ...DEFAULT_HOLDINGS },
      txs: [],
      locked: false,
      hideBalances: false,
      network: "all",
      hydrated: false,
      setupComplete: true,
      setHydrated: () => set({ hydrated: true }),
      completeSetup: () => set({ setupComplete: true }),
      createWallet: async (name) => {
        const phrase = generateMnemonic();
        const addresses = await deriveAddresses(phrase);
        const now = Date.now();
        const wallet: WalletRecord = {
          name: name.trim() || "Primary",
          phrase,
          addresses,
          createdAt: now,
          pinHash: null,
          pinSalt: null,
        };
        set({
          wallet,
          holdings: { ...DEFAULT_HOLDINGS },
          txs: seedTxs(now),
          locked: false,
          setupComplete: false,
        });
        return wallet;
      },
      restoreWallet: async (phrase, name) => {
        const normalized = normalizeMnemonic(phrase);
        if (!isValidMnemonic(normalized)) {
          throw new Error("Enter 12 valid recovery words.");
        }
        const addresses = await deriveAddresses(normalized);
        const now = Date.now();
        const wallet: WalletRecord = {
          name: name.trim() || "Restored",
          phrase: normalized,
          addresses,
          createdAt: now,
          pinHash: null,
          pinSalt: null,
        };
        set({
          wallet,
          holdings: { ...DEFAULT_HOLDINGS },
          txs: seedTxs(now),
          locked: false,
          setupComplete: false,
        });
        return wallet;
      },
      setPin: async (pin) => {
        const wallet = get().wallet;
        if (!wallet) return;
        const pinSalt = randomHex(16);
        const pinHash = await hashPin(pin, pinSalt);
        set({ wallet: { ...wallet, pinHash, pinSalt } });
      },
      unlock: async (pin) => {
        const wallet = get().wallet;
        if (!wallet?.pinHash || !wallet.pinSalt) {
          set({ locked: false });
          return true;
        }
        const next = await hashPin(pin, wallet.pinSalt);
        if (next !== wallet.pinHash) return false;
        set({ locked: false });
        return true;
      },
      lock: () => {
        if (get().wallet?.pinHash) set({ locked: true });
      },
      send: ({ assetId, amount, to }) => {
        const holdings = { ...get().holdings };
        const available = holdings[assetId] ?? 0;
        if (amount <= 0 || amount > available) {
          throw new Error("Insufficient balance.");
        }
        holdings[assetId] = available - amount;
        const tx: Transaction = {
          id: `tx-${randomHex(8)}`,
          type: "send",
          status: "confirmed",
          assetId,
          amount,
          counterparty: to,
          hash: `0x${randomHex(32)}`,
          timestamp: Date.now(),
        };
        set({ holdings, txs: [tx, ...get().txs] });
        return tx;
      },
      swap: ({ fromId, toId, fromAmount, toAmount }) => {
        const holdings = { ...get().holdings };
        const available = holdings[fromId] ?? 0;
        if (fromAmount <= 0 || fromAmount > available) {
          throw new Error("Insufficient balance.");
        }
        holdings[fromId] = available - fromAmount;
        holdings[toId] = (holdings[toId] ?? 0) + toAmount;
        const tx: Transaction = {
          id: `tx-${randomHex(8)}`,
          type: "swap",
          status: "confirmed",
          assetId: fromId,
          amount: fromAmount,
          toAssetId: toId,
          toAmount,
          hash: `0x${randomHex(32)}`,
          timestamp: Date.now(),
        };
        set({ holdings, txs: [tx, ...get().txs] });
        return tx;
      },
      toggleHideBalances: () =>
        set((s) => ({ hideBalances: !s.hideBalances })),
      setNetwork: (network) => set({ network }),
      rename: (name) => {
        const wallet = get().wallet;
        if (!wallet) return;
        set({ wallet: { ...wallet, name: name.trim() || wallet.name } });
      },
      reset: () =>
        set({
          wallet: null,
          holdings: { ...DEFAULT_HOLDINGS },
          txs: [],
          locked: false,
          hideBalances: false,
          network: "all",
          setupComplete: true,
        }),
    }),
    {
      name: "sable-wallet",
      skipHydration: true,
      partialize: (s) => ({
        wallet: s.wallet,
        holdings: s.holdings,
        txs: s.txs,
        hideBalances: s.hideBalances,
        network: s.network,
        locked: s.wallet?.pinHash ? true : false,
        setupComplete: s.setupComplete,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        if (state?.wallet?.pinHash) {
          state.lock();
        }
      },
    },
  ),
);
