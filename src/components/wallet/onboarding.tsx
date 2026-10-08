import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { SableMark } from "@/components/brand/sable-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidMnemonic } from "@/lib/wallet/mnemonic";
import { useWallet } from "@/lib/wallet/store";

type Step = "welcome" | "create" | "backup" | "restore" | "pin";

export function Onboarding() {
  const createWallet = useWallet((s) => s.createWallet);
  const restoreWallet = useWallet((s) => s.restoreWallet);
  const setPin = useWallet((s) => s.setPin);
  const completeSetup = useWallet((s) => s.completeSetup);
  const wallet = useWallet((s) => s.wallet);

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("Primary");
  const [phrase, setPhrase] = useState("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pin, setPinValue] = useState("");
  const [pin2, setPin2] = useState("");

  async function onCreate() {
    setBusy(true);
    try {
      const w = await createWallet(name);
      setPhrase(w.phrase);
      setStep("backup");
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setBusy(true);
    try {
      await restoreWallet(restorePhrase, name);
      setStep("pin");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not restore wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function onPin(skip: boolean) {
    if (!skip) {
      if (pin.length !== 6 || pin !== pin2) {
        toast("PINs must match and be 6 digits.");
        return;
      }

      await setPin(pin);
      toast("PIN set");
    }

    // Both choices finish onboarding. The app gate watches setupComplete
    // and will immediately switch from the PIN screen to the wallet shell.
    completeSetup();
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        {step === "welcome" && (
          <div className="flex flex-1 flex-col">
            <div className="stagger-enter flex flex-1 flex-col justify-end pb-10">
              <SableMark className="mb-8 size-12" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sable
              </p>
              <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
                A private wallet for digital assets.
              </h1>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                Self-custodial by design. Preview balances and transfers so you
                can learn the product without moving real funds.
              </p>
            </div>
            <div className="stagger-enter flex flex-col gap-3">
              <Button size="lg" onClick={() => setStep("create")}>
                Create wallet
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setStep("restore")}
              >
                Restore with phrase
              </Button>
            </div>
          </div>
        )}

        {step === "create" && (
          <div className="flex flex-1 flex-col">
            <Header
              kicker="New wallet"
              title="Name this account"
              copy="You can rename it later. One account, several networks."
            />
            <div className="mt-8 space-y-2">
              <Label htmlFor="wallet-name">Account name</Label>
              <Input
                id="wallet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Primary"
                autoFocus
              />
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <Button size="lg" onClick={onCreate} disabled={busy}>
                Generate recovery phrase
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setStep("welcome")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "backup" && (
          <div className="flex flex-1 flex-col">
            <Header
              kicker="Recovery"
              title="Write these words down"
              copy="This preview phrase unlocks this wallet on this device. Store it privately. Never share it."
            />
            <div className="relative mt-8">
              <ol className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-3 shadow-[var(--shadow-border)] sm:grid-cols-3">
                {phrase.split(" ").map((word, i) => (
                  <li
                    key={`${word}-${i}`}
                    className="flex items-baseline gap-2 rounded-md bg-background/40 px-3 py-2.5 font-mono text-sm"
                  >
                    <span className="text-xs text-muted-foreground tabular">
                      {i + 1}
                    </span>
                    <span className={revealed ? "text-foreground" : "blur-[5px]"}>
                      {word}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealed((v) => !v)}
                >
                  {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {revealed ? "Hide" : "Reveal"}
                </Button>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button size="lg" onClick={() => setStep("pin")}>
                I saved these words
              </Button>
            </div>
          </div>
        )}

        {step === "restore" && (
          <div className="flex flex-1 flex-col">
            <Header
              kicker="Restore"
              title="Enter your 12-word phrase"
              copy="Use words from the Sable preview word list. This derives a local address; it does not import a live chain account."
            />
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restore-name">Account name</Label>
                <Input
                  id="restore-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restore-phrase">Recovery phrase</Label>
                <textarea
                  id="restore-phrase"
                  value={restorePhrase}
                  onChange={(e) => setRestorePhrase(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-md bg-secondary px-3.5 py-3 font-mono text-sm shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  placeholder="twelve words separated by spaces"
                />
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button
                size="lg"
                disabled={busy || !isValidMnemonic(restorePhrase)}
                onClick={onRestore}
              >
                Restore wallet
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setStep("welcome")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "pin" && wallet && (
          <PinStep
            pin={pin}
            pin2={pin2}
            onPin={setPinValue}
            onPin2={setPin2}
            onContinue={onPin}
          />
        )}
      </div>
    </div>
  );
}

function Header({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="stagger-enter pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {kicker}
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  );
}

function PinStep({
  pin,
  pin2,
  onPin,
  onPin2,
  onContinue,
}: {
  pin: string;
  pin2: string;
  onPin: (v: string) => void;
  onPin2: (v: string) => void;
  onContinue: (skip: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function finish(skip: boolean) {
    setBusy(true);
    try {
      await onContinue(skip);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        kicker="Security"
        title="Add a 6-digit PIN"
        copy="Optional. If you set one, Sable will lock after idle time on this device."
      />
      <div className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => onPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="font-mono tracking-[0.4em]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pin2">Confirm PIN</Label>
          <Input
            id="pin2"
            inputMode="numeric"
            maxLength={6}
            value={pin2}
            onChange={(e) => onPin2(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="font-mono tracking-[0.4em]"
          />
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Shield className="mt-0.5 size-3.5 shrink-0" />
          The PIN never leaves this browser. There is no recovery besides your phrase.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button
          size="lg"
          disabled={busy || pin.length !== 6}
          onClick={() => finish(false)}
        >
          Set PIN
        </Button>
        <Button size="lg" variant="ghost" disabled={busy} onClick={() => finish(true)}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
