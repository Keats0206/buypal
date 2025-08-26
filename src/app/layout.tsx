import "./globals.css";
import { Header } from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="bg-muted/50 flex flex-1 flex-col pt-16 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}