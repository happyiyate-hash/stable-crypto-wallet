import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TokenIcon } from "@/components/wallet/token-icon";
import { ASSETS, ASSET_LIST, type AssetId } from "@/lib/wallet/assets";
import { usePrices } from "@/lib/wallet/prices";
import { useWallet } from "@/lib/wallet/store";
import { formatTokenAmount, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/_app/swap")({
  component: SwapPage,
});

function SwapPage() {
  const holdings = useWallet((s) => s.holdings);
  const swap = useWallet((s) => s.swap);
  const prices = usePrices((s) => s.prices);
  const [fromId, setFromId] = useState<AssetId>("ethereum");
  const [toId, setToId] = useState<AssetId>("usd-coin");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const from = ASSETS[fromId];
  const to = ASSETS[toId];
  const available = holdings[fromId] ?? 0;
  const parsed = Number(amount);
  const fromPx = prices[fromId]?.usd ?? 0;
  const toPx = prices[toId]?.usd ?? 0;
  const rate = toPx === 0 ? 0 : fromPx / toPx;
  const feePct = 0.003;
  const toAmount =
    Number.isFinite(parsed) && parsed > 0 ? parsed * rate * (1 - feePct) : 0;
  const valid =
    fromId !== toId &&
    Number.isFinite(parsed) &&
    parsed > 0 &&
    parsed <= available &&
    toAmount > 0;

  const impact = useMemo(() => (parsed > available * 0.4 ? 0.42 : 0.08), [parsed, available]);

  function flip() {
    setFromId(toId);
    setToId(fromId);
    setAmount(toAmount ? String(Number(toAmount.toPrecision(6))) : "");
  }

  function confirm() {
    if (!valid) return;
    setBusy(true);
    try {
      swap({
        fromId,
        toId,
        fromAmount: parsed,
        toAmount,
      });
      toast(`Swapped ${formatTokenAmount(parsed)} ${from.symbol}`);
      setAmount("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Swap failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Exchange
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight">Swap</h1>
      </header>

      <div className="relative space-y-2">
        <SwapLeg
          label="You pay"
          assetId={fromId}
          onAsset={setFromId}
          amount={amount}
          onAmount={setAmount}
          available={available}
          usd={Number.isFinite(parsed) ? parsed * fromPx : 0}
          exclude={toId}
        />
        <div className="relative z-10 -my-1 flex justify-center">
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label="Flip assets"
            onClick={flip}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
        <SwapLeg
          label="You receive"
          assetId={toId}
          onAsset={setToId}
          amount={toAmount ? formatTokenAmount(toAmount) : ""}
          usd={toAmount * toPx}
          exclude={fromId}
          readOnly
        />
      </div>

      <dl className="space-y-2.5 rounded-xl bg-card px-4 py-4 text-sm shadow-[var(--shadow-border)]">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Rate</dt>
          <dd className="tabular">
            1 {from.symbol} = {rate ? formatTokenAmount(rate) : "—"} {to.symbol}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Fee</dt>
          <dd className="tabular">0.30%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Price impact</dt>
          <dd className="tabular">{impact.toFixed(2)}%</dd>
        </div>
      </dl>

      <Button size="lg" className="w-full" disabled={!valid || busy} onClick={confirm}>
        {fromId === toId ? "Select different assets" : "Confirm swap"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Quotes use live market prices when available. Settlement is local to this preview.
      </p>
    </div>
  );
}

function SwapLeg({
  label,
  assetId,
  onAsset,
  amount,
  onAmount,
  available,
  usd,
  exclude,
  readOnly,
}: {
  label: string;
  assetId: AssetId;
  onAsset: (id: AssetId) => void;
  amount: string;
  onAmount?: (v: string) => void;
  available?: number;
  usd: number;
  exclude: AssetId;
  readOnly?: boolean;
}) {
  const asset = ASSETS[assetId];
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {available !== undefined && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onAmount?.(String(available))}
          >
            Balance {formatTokenAmount(available)}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label className="sr-only" htmlFor={`asset-${label}`}>
          Asset
        </label>
        <div className="flex items-center gap-2 rounded-md bg-secondary py-1.5 pl-1.5 pr-2 shadow-[var(--shadow-border)]">
          <TokenIcon id={assetId} className="size-7" />
          <select
            id={`asset-${label}`}
            value={assetId}
            onChange={(e) => onAsset(e.target.value as AssetId)}
            className="bg-transparent text-sm font-medium outline-none"
          >
            {ASSET_LIST.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === exclude}>
                {a.symbol}
              </option>
            ))}
          </select>
        </div>
        {readOnly ? (
          <p className="min-w-0 flex-1 text-right text-2xl font-medium tabular">
            {amount || "0"}
          </p>
        ) : (
          <Input
            value={amount}
            onChange={(e) => onAmount?.(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="h-12 flex-1 border-0 bg-transparent text-right text-2xl shadow-none focus-visible:ring-0"
          />
        )}
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground tabular">
        {formatUsd(usd)} · {asset.name}
      </p>
    </div>
  );
}
