import type { Metadata } from "next";
import "./globals.css";

import { LayoutShell } from "@/components/layout-shell";
import { getWorkspaceScopeData } from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control Financiero",
  description: "MVP para gestionar finanzas personales y de negocio con Next.js y Supabase."
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <html lang="es">
        <body>{children}</body>
      </html>
    );
  }

  const workspaceScope = await getWorkspaceScopeData();

  return (
    <html lang="es">
      <body>
        <LayoutShell availableScopes={workspaceScope.availableScopes} userEmail={user.email}>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
