import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "./providers";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Research Assistant",
  description: "Multi-agent technical research assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
