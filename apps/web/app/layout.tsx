import type { ReactNode } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { WebThemeProvider } from "../components/web-theme-provider";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"]
});

export const metadata = {
  title: "边做边学",
  description: "面向零基础小白的交互式 AI 编程学习平台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${mono.variable}`}>
        <WebThemeProvider>{children}</WebThemeProvider>
      </body>
    </html>
  );
}
