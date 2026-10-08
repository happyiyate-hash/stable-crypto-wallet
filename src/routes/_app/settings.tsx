import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/wallet/copy-button";
import { useWallet } from "@/lib/wallet/store";
import { truncateAddress } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const wallet = useWallet((s) => s.wallet)!;
  const hide = useWallet((s) => s.hideBalances);
  const toggleHide = useWallet((s) => s.toggleHideBalances);
  const rename = useWallet((s) => s.rename);
  const lock = useWallet((s) => s.lock);
  const reset = useWallet((s) => s.reset);
  const setPin = useWallet((s) => s.setPin);
  const navigate = useNavigate();
  const [name, setName] = useState(wallet.name);
  const [showPhrase, setShowPhrase] = useState(false);
  const [pin, setPinValue] = useState("");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Preferences
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight">Settings</h1>
      </header>

      <section className="space-y-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">Account</h2>
        <div className="space-y-2">
          <Label htmlFor="acct-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="acct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() => {
                rename(name);
                toast("Name updated");
              }}
            >
              Save
            </Button>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ethereum</p>
          <p className="mt-1 break-all font-mono text-sm">
            {wallet.addresses.evm}
          </p>
          <CopyButton
            value={wallet.addresses.evm}
            label="Copy address"
            className="mt-3"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">Privacy</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm">Hide balances</p>
            <p className="text-xs text-muted-foreground">
              Mask values on Home and asset screens.
            </p>
          </div>
          <Switch checked={hide} onCheckedChange={() => toggleHide()} />
        </div>
        {wallet.pinHash ? (
          <Button variant="secondary" className="w-full" onClick={() => lock()}>
            Lock wallet
          </Button>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="new-pin">Set a 6-digit PIN</Label>
            <div className="flex gap-2">
              <Input
                id="new-pin"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) =>
                  setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="font-mono tracking-[0.3em]"
              />
              <Button
                variant="secondary"
                disabled={pin.length !== 6}
                onClick={async () => {
                  await setPin(pin);
                  setPinValue("");
                  toast("PIN set");
                }}
              >
                Set
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">Recovery phrase</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Anyone with these words can control this preview wallet. Reveal only in
          private.
        </p>
        {showPhrase ? (
          <p className="rounded-md bg-secondary px-3 py-3 font-mono text-sm leading-relaxed">
            {wallet.phrase}
          </p>
        ) : (
          <p className="rounded-md bg-secondary px-3 py-3 font-mono text-sm text-muted-foreground">
            {truncateAddress(wallet.phrase.replace(/\s/g, ""), 8)}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowPhrase((v) => !v)}>
            {showPhrase ? "Hide" : "Reveal"}
          </Button>
          {showPhrase && <CopyButton value={wallet.phrase} label="Copy phrase" />}
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">About</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sable is a preview wallet. Balances, swaps, and transfers are simulated
          and stored only in this browser. Do not send real funds to these
          addresses.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive">
              Remove wallet
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this wallet?</AlertDialogTitle>
              <AlertDialogDescription>
                Local keys, balances, and history will be erased from this
                browser. This cannot be undone unless you saved the phrase.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  reset();
                  void navigate({ to: "/" });
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
