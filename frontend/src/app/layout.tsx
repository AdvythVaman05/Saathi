import type { Metadata } from "next";
import "../design-system/tokens.css";
import { AudioCueManager } from "../components/AudioCueManager";
import { AccessibilityProvider } from "../components/AccessibilityProvider";

export const metadata: Metadata = {
  title: "Saathi - Voice-First Survey Platform",
  description: "Accessible survey companion for blind and visually impaired users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-hyperlegible bg-background text-foreground antialiased min-h-screen">
        <AccessibilityProvider>
          <AudioCueManager />
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
