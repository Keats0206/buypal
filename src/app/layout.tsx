import "./globals.css";
import { Header } from "@/components/Header";

import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={openSans.className} style={{ fontFamily: "Open Sans, sans-serif" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="h-screen flex flex-col">
        <Header />
        <main className="bg-muted/50 flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}