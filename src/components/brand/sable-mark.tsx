import { cn } from "@/lib/utils";

export function SableMark({ className }: { className?: string }) {
  return (
    <img
      src="/sable-mark.svg"
      className={cn("block", className)}
      alt=""
      aria-hidden="true"
    />
  );
}

export function SableWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <SableMark className="size-6" />
      <span className="text-[15px] font-medium tracking-tight">Sable</span>
    </span>
  );
}
