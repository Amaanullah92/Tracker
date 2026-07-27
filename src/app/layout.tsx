import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";

export const metadata: Metadata = {
  title: "Tracker",
  description: "Personal habit & gym tracker",
  applicationName: "Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col bg-bg text-text-primary">
        <Providers>
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}