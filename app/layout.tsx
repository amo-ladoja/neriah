import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neriah - Your emails, turned into actions",
  description: "Sign in with Google. See what needs your attention. Act.",
  manifest: "/manifest.json",
  themeColor: "#E8F401",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Neriah",
  },
  icons: {
    icon: "/0_5_bb.png",
    apple: "/0_5_bb.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
      </head>
      <body className="antialiased font-sans bg-background">
        {children}
      </body>
    </html>
  );
}
