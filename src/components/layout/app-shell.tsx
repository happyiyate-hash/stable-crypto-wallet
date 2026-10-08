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

  useEffect(() => { void refresh(); const id = window.setInterval(() => void refresh(), 60_000); return () => clearInterval(id); }, [refresh]);
  useEffect(() => {
    if (!wallet?.pinHash) return;
    let timer = 0;
    const bump = () => { clearTimeout(timer); timer = window.setTimeout(() => lock(), 5 * 60 * 1000); };
    bump(); window.addEventListener("pointerdown", bump);
    return () => { clearTimeout(timer); window.removeEventListener("pointerdown", bump); };
  }, [wallet?.pinHash, lock]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border px-4 py-6 lg:flex">
          <SableWordmark className="px-2" />
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return <Link key={item.to} to={item.to} className={cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-4" />{item.label}</Link>;
            })}
          </nav>
          {wallet && <div className="rounded-lg bg-secondary px-3 py-3 shadow-[var(--shadow-border)]"><p className="text-sm font-medium">{wallet.name}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{truncateAddress(wallet.addresses.evm, 5)}</p></div>}
        </aside>

        <div className="lg:pl-56">
          <main className="mx-auto min-h-dvh w-full max-w-xl px-0 pb-20 pt-0 lg:max-w-2xl lg:px-6 lg:pb-12 lg:pt-8">
            <Outlet />
          </main>
        </div>

        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[calc(env(safe-area-inset-bottom)+6px)] lg:hidden">
          <div className="flex w-full items-end gap-1 px-1">
            <div className="pointer-events-auto grid h-12 flex-1 grid-cols-3 items-stretch rounded-[24px] border border-white/[0.09] bg-[#18191b] px-0.5 shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
              {NAV.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return <Link key={item.to} to={item.to} className={cn("relative flex min-w-0 flex-col items-center justify-center gap-0 text-[10px] font-medium", active ? "text-white" : "text-[#8f9095]")}><Icon className="size-[18px] stroke-[1.6]" /><span>{item.label}</span>{active && <span className="absolute bottom-0.5 h-0.5 w-6 rounded-full bg-white/80" />}</Link>;
              })}
            </div>
            <Link to="/swap" aria-label="Swap" className="pointer-events-auto grid size-12 shrink-0 place-items-center rounded-[17px] border border-white/[0.09] bg-[#18191b] shadow-[0_6px_20px_rgba(0,0,0,0.28)] active:scale-95">
              <ArrowLeftRight className="size-[19px] text-white stroke-[1.6]" />
            </Link>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
