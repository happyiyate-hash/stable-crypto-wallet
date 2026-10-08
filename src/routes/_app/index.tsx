import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CollectibleArt } from "@/components/wallet/collectible-art";
import { AssetRow } from "@/components/wallet/asset-row";
import { Sparkline } from "@/components/wallet/sparkline";
import { COLLECTIBLES } from "@/lib/wallet/assets";
import { usePrices } from "@/lib/wallet/prices";
import { holdingRows, portfolioTotals } from "@/lib/wallet/select";
import { useWallet } from "@/lib/wallet/store";
import { cn, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const holdings = useWallet((s) => s.holdings);
  const hide = useWallet((s) => s.hideBalances);
  const prices = usePrices((s) => s.prices);

  const rows = holdingRows(holdings, prices, "all");
  const { total, delta, pct } = portfolioTotals(rows);
  const up = delta >= 0;

  return (
    <div className="stagger-enter pb-2">
      <header className="flex justify-center pt-1">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-3 rounded-full border border-border bg-card/60 px-6 text-[15px] font-medium shadow-[var(--shadow-border)] transition-colors hover:bg-accent"
          aria-label="Select wallet"
        >
          <span>Wallet 1</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </header>

      <section className="relative mt-8 min-h-[190px]">
        <div className="pr-0 sm:pr-44">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Total balance
          </p>
          <p className="mt-2 text-[48px] font-medium leading-none tracking-[-0.04em] tabular sm:text-6xl">
            {hide ? "••••••" : formatUsd(total)}
          </p>
          <p
            className={cn(
              "mt-5 text-[15px] tabular",
              up ? "text-gain" : "text-loss",
            )}
          >
            {hide
              ? "••••"
              : `${up ? "+" : ""}${formatUsd(delta)} (${up ? "+" : ""}${pct.toFixed(2)}%)`}
            <span className="ml-2 text-muted-foreground">24h</span>
          </p>
        </div>

        <Sparkline
          seed="portfolio"
          end={total || 1}
          changePct={pct}
          className="absolute right-0 top-24 h-14 w-[43%] min-w-40 text-loss sm:top-20 sm:w-64"
        />
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionLink to="/send" icon={ArrowUpRight} label="Send" />
        <ActionLink to="/receive" icon={ArrowDownLeft} label="Receive" />
        <ActionLink to="/swap" icon={ArrowLeftRight} label="Swap" />
      </div>

      <section className="mt-10">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[22px] font-medium tracking-tight">Assets</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="border-t border-border/80">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No assets on this wallet.
            </p>
          ) : (
            rows.map((row) => (
              <AssetRow key={row.id} row={row} hidden={hide} />
            ))
          )}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-medium tracking-tight">Collectibles</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {COLLECTIBLES.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-[16px] border border-border bg-card/55 shadow-[var(--shadow-border)]"
            >
              <CollectibleArt seed={c.seed} className="aspect-square w-full" />
              <div className="px-2.5 py-2">
                <p className="truncate text-[12px] font-medium">{c.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {c.collection}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/send" | "/receive" | "/swap";
  icon: typeof ArrowUpRight;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 text-[15px] font-medium text-foreground"
    >
      <span className="grid size-[58px] place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-border)]">
        <Icon className="size-6 stroke-[1.7]" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
