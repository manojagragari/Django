import "./globals.css";

import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, themeBootstrapScript } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: {
    default: "ElectroShop Management System",
    template: "%s · ElectroShop",
  },
  description:
    "Inventory, billing, expenditure and sales analytics for an electronics retail shop. " +
    "Django REST Framework API with a Next.js front end.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
