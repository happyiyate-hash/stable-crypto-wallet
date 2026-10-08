import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Eye, EyeOff } from "lucide-react";
import { CollectibleArt } from "@/components/wallet/collectible-art";
import { AssetRow } from "@/components/wallet/asset-row";
import { Sparkline } from "@/components/wallet/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLLECTIBLES, NETWORKS } from "@/lib/wallet/assets";
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
  const setNetwork = useWallet((s) => s.setNetwork);
  const hide = useWallet((s) => s.hideBalances);
  const toggleHide = useWallet((s) => s.toggleHideBalances);
  const name = useWallet((s) => s.wallet?.name ?? "Wallet");
  const prices = usePrices((s) => s.prices);

  const rows = holdingRows(holdings, prices, network);
  const { total, delta, pct } = portfolioTotals(rows);
  const up = delta >= 0;
  const networkLabel =
    NETWORKS.find((n) => n.id === network)?.label ?? "All networks";

  return (
    <div className="stagger-enter space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {name}
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight">Portfolio</h1>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                {networkLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {NETWORKS.map((n) => (
                <DropdownMenuItem key={n.id} onClick={() => setNetwork(n.id)}>
                  {n.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={hide ? "Show balances" : "Hide balances"}
            onClick={toggleHide}
          >
            {hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </header>

      <section className="rounded-xl bg-card px-5 py-6 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Total balance
        </p>
        <p className="mt-3 text-4xl font-medium tracking-tight tabular sm:text-5xl">
          {hide ? "••••••" : formatUsd(total)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p
            className={cn(
              "tabular text-sm",
              up ? "text-gain" : "text-loss",
            )}
          >
            {hide
              ? "••••"
              : `${up ? "+" : ""}${formatUsd(delta)} (${up ? "+" : ""}${pct.toFixed(2)}%)`}
            <span className="ml-1 text-muted-foreground">24h</span>
          </p>
          <Sparkline
            seed="portfolio"
            end={total || 1}
            changePct={pct}
            className="h-10 w-28"
          />
        </div>
        {rows.length > 0 && (
          <div className="mt-6 flex h-1.5 overflow-hidden rounded-full bg-secondary">
            {rows.map((row) => (
              <span
                key={row.id}
                className="h-full bg-foreground"
                style={{
                  width: `${(row.value / total) * 100}%`,
                  opacity: 0.25 + (row.value / total) * 0.75,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" className="h-14 flex-col gap-1 rounded-lg" asChild>
          <Link to="/send">
            <ArrowUpRight className="size-4" />
            Send
          </Link>
        </Button>
        <Button variant="secondary" className="h-14 flex-col gap-1 rounded-lg" asChild>
          <Link to="/receive">
            <ArrowDownLeft className="size-4" />
            Receive
          </Link>
        </Button>
        <Button variant="secondary" className="h-14 flex-col gap-1 rounded-lg" asChild>
          <Link to="/swap">
            <ArrowLeftRight className="size-4" />
            Swap
          </Link>
        </Button>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-medium">Assets</h2>
          <Badge>Preview</Badge>
        </div>
        <div className="divide-y divide-border rounded-xl bg-card px-2 py-1 shadow-[var(--shadow-border)]">
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No assets on this network.
            </p>
          ) : (
            rows.map((row) => (
              <AssetRow key={row.id} row={row} hidden={hide} />
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-medium">Collectibles</h2>
          <span className="text-xs text-muted-foreground">Monolith</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLLECTIBLES.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]"
            >
              <CollectibleArt seed={c.seed} className="aspect-square w-full" />
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.collection}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
