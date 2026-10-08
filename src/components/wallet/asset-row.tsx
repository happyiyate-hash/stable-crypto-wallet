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
      className="group flex min-h-[70px] items-center gap-2 py-2 transition-colors duration-150 hover:bg-white/[0.02]"
    >
      <TokenIcon id={row.id} className="size-10 shrink-0 bg-white/[0.035]" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{asset.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {hidden ? "••••" : formatTokenAmount(row.amount)} {asset.symbol}
        </p>
      </div>

      <div className="flex min-w-[86px] flex-col items-end">
        <p className="tabular text-[13px] font-medium">
          {hidden ? "••••" : formatUsd(row.value)}
        </p>
        <p
          className={cn(
            "mt-0.5 tabular text-[11px]",
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
        className="h-6 w-[48px] shrink-0 text-loss"
      />

      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" />
    </Link>
  );
}
