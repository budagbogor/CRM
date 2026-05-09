import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/toast-provider";
import { brandIdentity } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brandIdentity.appName,
  description: `${brandIdentity.subtitle} - ${brandIdentity.positioning}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
