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
  const network = useWallet((s) => s.network);
  const hide = useWallet((s) => s.hideBalances);
  const prices = usePrices((s) => s.prices);

  const rows = holdingRows(holdings, prices, network);
  const { total, delta, pct } = portfolioTotals(rows);
  const up = delta >= 0;

  return (
    <div className="stagger-enter pb-1">
      <header className="flex justify-center pt-0">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 text-[14px] font-medium text-foreground shadow-none"
          aria-label="Select wallet"
        >
          <span>Wallet 1</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </header>

      <section className="relative mt-5 min-h-[142px]">
        <div className="pr-[35%]">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Total balance
          </p>
          <p className="mt-1 text-[38px] font-medium leading-none tracking-[-0.045em] tabular">
            {hide ? "••••••" : formatUsd(total)}
          </p>
          <p
            className={cn(
              "mt-4 whitespace-nowrap text-[13px] tabular",
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
          className="absolute right-0 top-[82px] h-11 w-[48%] text-loss"
        />
      </section>

      <div className="mt-1 grid grid-cols-3 gap-1">
        <ActionLink to="/send" icon={ArrowUpRight} label="Send" />
        <ActionLink to="/receive" icon={ArrowDownLeft} label="Receive" />
        <ActionLink to="/swap" icon={ArrowLeftRight} label="Swap" />
      </div>

      <section className="mt-7">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[20px] font-medium tracking-tight">Assets</h2>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-[13px] text-muted-foreground"
          >
            Manage
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assets on this wallet.
            </p>
          ) : (
            rows.map((row) => (
              <AssetRow key={row.id} row={row} hidden={hide} />
            ))
          )}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[20px] font-medium tracking-tight">Collectibles</h2>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-[13px] text-muted-foreground"
          >
            View all
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {COLLECTIBLES.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-[11px] border border-white/[0.07] bg-white/[0.025]"
            >
              <CollectibleArt seed={c.seed} className="aspect-square w-full" />
              <div className="px-1.5 py-1.5">
                <p className="truncate text-[10px] font-medium">{c.name}</p>
                <p className="truncate text-[9px] text-muted-foreground">
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
      className="flex flex-col items-center gap-1.5 text-[13px] font-medium text-foreground"
    >
      <span className="grid size-12 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025]">
        <Icon className="size-5 stroke-[1.6]" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
