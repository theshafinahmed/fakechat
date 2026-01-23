import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PWARegistration } from "@/components/PWARegistration";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "FakeChat",
    description: "Premium anonymous prank chat with total privacy.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "FakeChat",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#0a0a0c",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <ConvexClientProvider>
                    <PWARegistration />
                    {children}
                </ConvexClientProvider>
            </body>
        </html>
    );
}
