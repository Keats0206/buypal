import "./globals.css";
import { Header } from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen flex flex-col">
        <Header />
        <main className="bg-muted/50 flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}