import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenIcon } from "@/components/wallet/token-icon";
import { ASSETS, ASSET_LIST, type AssetId } from "@/lib/wallet/assets";
import { usePrices } from "@/lib/wallet/prices";
import { isLikelyAddress } from "@/lib/wallet/select";
import { useWallet } from "@/lib/wallet/store";
import { formatTokenAmount, formatUsd, truncateAddress } from "@/lib/utils";

export const Route = createFileRoute("/_app/send")({
  component: SendPage,
});

function SendPage() {
  const navigate = useNavigate();
  const holdings = useWallet((s) => s.holdings);
  const send = useWallet((s) => s.send);
  const prices = usePrices((s) => s.prices);
  const [assetId, setAssetId] = useState<AssetId>("ethereum");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "review">("form");
  const [busy, setBusy] = useState(false);

  const asset = ASSETS[assetId];
  const available = holdings[assetId] ?? 0;
  const parsed = Number(amount);
  const usd = Number.isFinite(parsed) ? parsed * (prices[assetId]?.usd ?? 0) : 0;
  const network = asset.network;
  const validAmt = Number.isFinite(parsed) && parsed > 0 && parsed <= available;
  const validTo = isLikelyAddress(to, network);

  const quote = useMemo(
    () => ({
      feeUsd: 1.24,
      eta: "~12 sec",
    }),
    [],
  );

  function continueReview() {
    if (!validTo) {
      toast("Enter a valid address for this network.");
      return;
    }
    if (!validAmt) {
      toast("Enter an amount within your balance.");
      return;
    }
    setStep("review");
  }

  function confirm() {
    setBusy(true);
    try {
      send({ assetId, amount: parsed, to: to.trim() });
      toast(`Sent ${formatTokenAmount(parsed)} ${asset.symbol}`);
      void navigate({ to: "/activity" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Send" />
      {step === "form" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Asset</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ASSET_LIST.filter((a) => (holdings[a.id] ?? 0) > 0).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAssetId(a.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm shadow-[var(--shadow-border)] transition-colors duration-150 ${
                    assetId === a.id ? "bg-accent" : "bg-secondary hover:bg-accent"
                  }`}
                >
                  <TokenIcon id={a.id} className="size-8" />
                  <span>
                    <span className="block font-medium">{a.symbol}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatTokenAmount(holdings[a.id] ?? 0)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={
                network === "solana"
                  ? "Solana address"
                  : network === "bitcoin"
                    ? "bc1…"
                    : "0x…"
              }
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Sending on {asset.networkLabel}. Double-check the address.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setAmount(String(available))}
              >
                Max {formatTokenAmount(available)} {asset.symbol}
              </button>
            </div>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="tabular text-lg"
            />
            <p className="text-xs text-muted-foreground tabular">
              {formatUsd(usd)}
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={continueReview}>
            Review
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-card px-5 py-6 text-center shadow-[var(--shadow-border)]">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              You are sending
            </p>
            <p className="mt-3 text-3xl font-medium tracking-tight tabular">
              {formatTokenAmount(parsed)} {asset.symbol}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{formatUsd(usd)}</p>
          </div>
          <dl className="space-y-3 rounded-xl bg-card px-5 py-4 text-sm shadow-[var(--shadow-border)]">
            <Row label="To" value={truncateAddress(to.trim(), 6)} mono />
            <Row label="Network" value={asset.networkLabel} />
            <Row label="Network fee" value={formatUsd(quote.feeUsd)} />
            <Row label="Time" value={quote.eta} />
          </dl>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Preview transfer. Funds are not broadcast to a public chain.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStep("form")}
            >
              Back
            </Button>
            <Button size="lg" className="flex-1" disabled={busy} onClick={confirm}>
              Confirm send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "tabular"}>{value}</dd>
    </div>
  );
}
