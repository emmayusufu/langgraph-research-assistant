import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Providers } from "./providers";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
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
      <body className={notoSans.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
