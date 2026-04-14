import type { Metadata } from "next";
import "./globals.css";

import { LayoutShell } from "@/components/layout-shell";

export const metadata: Metadata = {
  title: "Control Financiero",
  description: "MVP para gestionar finanzas personales y de negocio con Next.js y Supabase."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
