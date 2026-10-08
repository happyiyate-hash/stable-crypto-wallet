import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { TokenIcon } from "@/components/wallet/token-icon";
import { ASSETS } from "@/lib/wallet/assets";
import { useWallet, type Transaction } from "@/lib/wallet/store";
import { groupTxs } from "@/lib/wallet/select";
import {
  formatAmount,
  formatDateHeading,
  formatRelative,
  truncateAddress,
} from "@/lib/utils";

export const Route = createFileRoute("/_app/activity")({
  component: ActivityPage,
});

export function ActivityPage() {
  const txs = useWallet((s) => s.txs);
  const groups = groupTxs(txs);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          History
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight">Activity</h1>
      </header>

      {txs.length === 0 ? (
        <div className="rounded-xl bg-card px-5 py-16 text-center shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {formatDateHeading(g.items[0]!.timestamp)}
              </h2>
              <div className="divide-y divide-border rounded-xl bg-card px-2 py-1 shadow-[var(--shadow-border)]">
                {g.items.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const asset = ASSETS[tx.assetId];
  const toAsset = tx.toAssetId ? ASSETS[tx.toAssetId] : null;
  const Icon =
    tx.type === "send"
      ? ArrowUpRight
      : tx.type === "receive"
        ? ArrowDownLeft
        : ArrowLeftRight;
  const title =
    tx.type === "swap"
      ? `Swap ${asset.symbol} → ${toAsset?.symbol ?? ""}`
      : tx.type === "send"
        ? `Sent ${asset.symbol}`
        : `Received ${asset.symbol}`;
  const amount =
    tx.type === "swap" && tx.toAmount
      ? `+${formatAmount(tx.toAmount, toAsset?.symbol ?? "")}`
      : `${tx.type === "send" ? "−" : "+"}${formatAmount(tx.amount, asset.symbol)}`;

  return (
    <article className="flex items-center gap-3 px-2 py-3">
      <div className="relative">
        <TokenIcon id={tx.toAssetId ?? tx.assetId} />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-background shadow-[var(--shadow-border)]">
          <Icon className="size-2.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="tabular text-sm font-medium">{amount}</p>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="truncate font-mono">
            {tx.counterparty
              ? truncateAddress(tx.counterparty, 4)
              : truncateAddress(tx.hash, 4)}
          </p>
          <p>{formatRelative(tx.timestamp)}</p>
        </div>
      </div>
    </article>
  );
}
