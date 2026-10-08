import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChevronDown, ChevronRight } from "lucide-react";
import { AssetRow } from "@/components/wallet/asset-row";
import { Sparkline } from "@/components/wallet/sparkline";
import { usePrices } from "@/lib/wallet/prices";
import { holdingRows, portfolioTotals } from "@/lib/wallet/select";
import { useWallet } from "@/lib/wallet/store";
import { cn, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({ component: HomePage });

function HomePage() {
  const holdings = useWallet((s) => s.holdings);
  const network = useWallet((s) => s.network);
  const hide = useWallet((s) => s.hideBalances);
  const prices = usePrices((s) => s.prices);
  const rows = holdingRows(holdings, prices, network);
  const { total, delta, pct } = portfolioTotals(rows);
  const up = delta >= 0;

  return (
    <div className="stagger-enter">
      <header className="relative min-h-10">
        <button
          type="button"
          className="wallet-floating-selector hidden lg:inline-flex"
          aria-label="Select wallet"
        >
          <span>Wallet 1</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </header>

      <button
        type="button"
        className="wallet-floating-selector lg:hidden"
        aria-label="Select wallet"
      >
        <span>Wallet 1</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      <button
        type="button"
        className="notification-floating-button lg:hidden"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-5 stroke-[1.7]" />
      </button>

      <section className="portfolio-summary relative mt-1 min-h-[88px]">
        <div className="portfolio-balance-copy">
          <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Total balance
          </p>
          <p className="mt-0.5 text-[28px] font-medium leading-none tracking-[-0.045em] tabular">
            {hide ? "••••••" : formatUsd(total)}
          </p>
          <p
            className={cn(
              "mt-2 whitespace-nowrap text-[11px] tabular",
              up ? "text-gain" : "text-loss"
            )}
          >
            {hide
              ? "••••"
              : `${up ? "+" : ""}${formatUsd(delta)} (${up ? "+" : ""}${pct.toFixed(2)}%)`}
            <span className="ml-1.5 text-muted-foreground">24h</span>
          </p>
        </div>

        <Sparkline
          seed="portfolio"
          end={total || 1}
          changePct={pct}
          className="portfolio-sparkline text-loss"
        />
      </section>

      <div className="mt-0 grid grid-cols-3">
        <ActionLink to="/send" icon={ArrowUpRight} label="Send" />
        <ActionLink to="/receive" icon={ArrowDownLeft} label="Receive" />
        <ActionLink to="/swap" icon={ArrowLeftRight} label="Swap" />
      </div>

      <section className="mt-3">
        <div className="mb-0.5 flex items-center justify-between">
          <h2 className="text-[17px] font-medium tracking-tight">Assets</h2>
          <button
            type="button"
            className="inline-flex items-center text-[11px] text-muted-foreground"
          >
            Manage <ChevronRight className="size-3" />
          </button>
        </div>

        <div>
          {rows.length === 0 ? (
            <p className="py-5 text-center text-sm text-muted-foreground">
              No assets on this wallet.
            </p>
          ) : (
            rows.map((row) => <AssetRow key={row.id} row={row} hidden={hide} />)
          )}
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
  icon: typeof ArrowLeftRight;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-0.5 text-[11px] font-medium"
    >
      <span className="grid size-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025]">
        <Icon className="size-[17px] stroke-[1.6]" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
