import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Clock,
  Home,
  Settings,
} from "lucide-react";
import { SableWordmark } from "@/components/brand/sable-mark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, truncateAddress } from "@/lib/utils";
import { usePrices } from "@/lib/wallet/prices";
import { useWallet } from "@/lib/wallet/store";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/swap", label: "Swap", icon: ArrowLeftRight },
  { to: "/activity", label: "Activity", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const wallet = useWallet((s) => s.wallet);
  const lock = useWallet((s) => s.lock);
  const refresh = usePrices((s) => s.refresh);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!wallet?.pinHash) return;
    let timer = 0;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => lock(), 5 * 60 * 1000);
    };
    bump();
    window.addEventListener("pointerdown", bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", bump);
    };
  }, [wallet?.pinHash, lock]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border px-4 py-6 lg:flex">
          <SableWordmark className="px-2" />
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {wallet && (
            <div className="rounded-lg bg-secondary px-3 py-3 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{wallet.name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {truncateAddress(wallet.addresses.evm, 5)}
              </p>
            </div>
          )}
        </aside>

        <div className="lg:pl-56">
          <main className="mx-auto min-h-dvh w-full max-w-xl px-5 pb-28 pt-6 lg:max-w-2xl lg:pb-12 lg:pt-10">
            <Outlet />
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pt-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
