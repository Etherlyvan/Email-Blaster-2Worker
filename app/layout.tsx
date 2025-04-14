// app/layout.tsx
import { Inter } from "next/font/google";
import AuthProvider from "../components/auth/AuthProvider";
import { Header } from "../components/layout/Header";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Email Campaign App",
  description: "A simple email campaign application with Brevo integration",
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.className}>
      <AuthProvider>
        <body className="bg-gray-50">
          <Header />
          <main>
            {children}

          <ToastContainer position="bottom-right" />
          </main>
        </body>
      </AuthProvider>
    </html>
  );
}