import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Sable";

export const Route = createRootRoute({
  ssr: false,
  shellComponent: RootShell,
  component: RootApp,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>{children}</body>
    </html>
  );
}

function RootApp() {
  return (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <Outlet />
      </AuthProvider>
      <Toaster />
      <Scripts />
    </>
  );
}