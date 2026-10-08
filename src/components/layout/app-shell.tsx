import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight, Clock, Home, Settings } from "lucide-react";
import { SableWordmark } from "@/components/brand/sable-mark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, truncateAddress } from "@/lib/utils";
import { usePrices } from "@/lib/wallet/prices";
import { useWallet } from "@/lib/wallet/store";

const NAV = [
  { to: "/", label: "Home", icon: Home },
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
          <main className="mx-auto min-h-dvh w-full max-w-xl px-6 pb-36 pt-6 lg:max-w-2xl lg:pb-12 lg:pt-10">
            <Outlet />
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom)+14px)] lg:hidden">
          <div className="mx-auto flex w-full max-w-xl items-end justify-between gap-3 px-6">
            <div className="pointer-events-auto grid h-[72px] flex-1 grid-cols-3 items-center rounded-[36px] border border-border bg-[#09090b]/95 px-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
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
                      "relative flex h-full flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors duration-200",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-6 stroke-[1.7]" />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-1 h-1 w-10 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-violet-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            <Link
              to="/swap"
              aria-label="Swap"
              className="pointer-events-auto grid size-[72px] shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-pink-500/90 via-fuchsia-500/80 to-blue-500/90 shadow-[0_12px_40px_rgba(217,70,239,0.28)] transition-transform duration-200 active:scale-95"
            >
              <span className="grid size-[68px] place-items-center rounded-full bg-black/20">
                <ArrowLeftRight className="size-8 text-white stroke-[1.8]" />
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
