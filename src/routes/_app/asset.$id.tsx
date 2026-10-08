import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TokenIcon } from "@/components/wallet/token-icon";
import { ASSETS, type AssetId } from "@/lib/wallet/assets";
import { sparklinePath, usePrices } from "@/lib/wallet/prices";
import { useWallet } from "@/lib/wallet/store";
import { cn, formatTokenAmount, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/_app/asset/$id")({
  component: AssetPage,
});

const IDS = new Set(Object.keys(ASSETS));

function AssetPage() {
  const { id } = Route.useParams();
  if (!IDS.has(id)) throw notFound();
  const assetId = id as AssetId;
  const asset = ASSETS[assetId];
  const amount = useWallet((s) => s.holdings[assetId] ?? 0);
  const hide = useWallet((s) => s.hideBalances);
  const prices = usePrices((s) => s.prices);
  const px = prices[assetId]?.usd ?? 0;
  const change = prices[assetId]?.usd_24h_change ?? 0;
  const value = amount * px;
  const up = change >= 0;

  const data = chartSeries(assetId, px, change);

  return (
    <div>
      <PageHeader title={asset.symbol} />
      <div className="flex items-center gap-3">
        <TokenIcon id={assetId} className="size-12" />
        <div>
          <h1 className="text-xl font-medium tracking-tight">{asset.name}</h1>
          <p className="text-sm text-muted-foreground">{asset.networkLabel}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-3xl font-medium tracking-tight tabular">
          {hide ? "••••" : formatUsd(px, { digits: px < 2 ? 4 : 2 })}
        </p>
        <p className={cn("mt-1 tabular text-sm", up ? "text-gain" : "text-loss")}>
          {up ? "+" : ""}
          {change.toFixed(2)}% <span className="text-muted-foreground">24h</span>
        </p>
      </div>

      <div className="mt-6 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <RTooltip
              cursor={{ stroke: "rgba(245,245,244,0.12)" }}
              content={({ payload }) => {
                const v = payload?.[0]?.value;
                if (typeof v !== "number") return null;
                return (
                  <div className="rounded-md bg-popover px-2 py-1 text-xs shadow-[var(--shadow-border)]">
                    {formatUsd(v, { digits: px < 2 ? 4 : 2 })}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="currentColor"
              strokeWidth={1.6}
              fill="url(#fillPx)"
              className={up ? "text-gain" : "text-loss"}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Holdings" value={hide ? "••••" : `${formatTokenAmount(amount)} ${asset.symbol}`} />
        <Stat label="Value" value={hide ? "••••" : formatUsd(value)} />
        <Stat label="Network" value={asset.networkLabel} />
        <Stat label="Asset" value={asset.symbol} />
      </dl>

      <div className="mt-8 grid grid-cols-2 gap-2">
        <Button size="lg" asChild>
          <Link to="/send">Send</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link to="/receive">Receive</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function chartSeries(id: string, end: number, change: number) {
  const path = sparklinePath(id, end || 1, change, 32);
  const nums = [...path.matchAll(/[\d.]+/g)].map(Number);
  const ys: number[] = [];
  for (let i = 1; i < nums.length; i += 2) ys.push(nums[i]!);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const start = end / (1 + change / 100);
  return ys.map((y, i) => {
    const t = 1 - (y - min) / span;
    const v = start + (end - start) * (i / (ys.length - 1)) + (t - 0.5) * end * 0.02;
    return { i, v };
  });
}
