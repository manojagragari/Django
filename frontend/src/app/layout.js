import "./globals.css";

export const metadata = {
  title: "ElectroShop Management",
  description: "Shop Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}

