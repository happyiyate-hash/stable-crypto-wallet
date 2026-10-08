import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AddressQr } from "@/components/wallet/qr-code";
import { CopyButton } from "@/components/wallet/copy-button";
import { NETWORKS, type NetworkId } from "@/lib/wallet/assets";
import { addressForNetwork } from "@/lib/wallet/select";
import { useWallet } from "@/lib/wallet/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/receive")({
  component: ReceivePage,
});

function ReceivePage() {
  const wallet = useWallet((s) => s.wallet)!;
  const current = useWallet((s) => s.network);
  const [network, setNetwork] = useState<Exclude<NetworkId, "all">>(
    current === "all" ? "ethereum" : current,
  );

  const address = useMemo(
    () => addressForNetwork(wallet.addresses, network),
    [wallet.addresses, network],
  );

  const warning =
    network === "bitcoin"
      ? "Send only Bitcoin to this address."
      : network === "solana"
        ? "Send only Solana and SPL tokens to this address."
        : "Send only Ether and ERC-20 tokens on this network.";

  return (
    <div>
      <PageHeader title="Receive" />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {NETWORKS.filter((n) => n.id !== "all").map((n) => (
          <Button
            key={n.id}
            size="sm"
            variant={network === n.id ? "default" : "secondary"}
            onClick={() => setNetwork(n.id as Exclude<NetworkId, "all">)}
          >
            {n.label}
          </Button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-xs">
        <AddressQr value={address} className="w-full" />
      </div>

      <div className="mt-6 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {wallet.name}
        </p>
        <p
          className={cn(
            "mt-2 break-all font-mono text-sm leading-relaxed",
          )}
        >
          {address}
        </p>
        <CopyButton value={address} label="Copy address" className="mt-4 w-full" />
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        {warning} This is a preview address derived on-device.
      </p>
    </div>
  );
}
