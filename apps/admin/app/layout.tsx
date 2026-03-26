import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata = {
  title: "边做边学 - 管理后台",
  description: "课程、练习与内容生产管理"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={sans.variable}>{children}</body>
    </html>
  );
}

