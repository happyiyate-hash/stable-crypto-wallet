import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { TokenIcon } from "@/components/wallet/token-icon";
import { Sparkline } from "@/components/wallet/sparkline";
import { ASSETS } from "@/lib/wallet/assets";
import { formatTokenAmount, formatUsd } from "@/lib/utils";
import type { HoldingRow } from "@/lib/wallet/select";
import { cn } from "@/lib/utils";

export function AssetRow({
  row,
  hidden,
}: {
  row: HoldingRow;
  hidden: boolean;
}) {
  const asset = ASSETS[row.id];
  const up = row.change >= 0;

  return (
    <Link
      to="/asset/$id"
      params={{ id: row.id }}
      className="group flex min-h-[92px] items-center gap-3 border-b border-border/70 py-3 transition-colors duration-150 hover:bg-white/[0.025]"
    >
      <TokenIcon id={row.id} className="size-12 shrink-0 bg-secondary/80" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{asset.name}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {hidden ? "••••" : formatTokenAmount(row.amount)} {asset.symbol}
        </p>
      </div>

      <div className="flex min-w-[108px] flex-col items-end">
        <p className="tabular text-[15px] font-medium">
          {hidden ? "••••" : formatUsd(row.value)}
        </p>
        <p
          className={cn(
            "mt-1 tabular text-[13px]",
            up ? "text-gain" : "text-loss",
          )}
        >
          {up ? "+" : ""}
          {row.change.toFixed(2)}%
        </p>
      </div>

      <Sparkline
        seed={row.id}
        end={row.price}
        changePct={row.change}
        className="h-8 w-[62px] shrink-0 text-loss"
      />

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
