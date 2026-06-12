"use client";

import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/lib/store/auth-store";
import { authApi } from "@/lib/api/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const publicPaths = ["/login", "/signup", "/forgot-password"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTokens = useAuthStore((s) => s.setTokens);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.slice(1));
      const at = params.get("access_token");
      const rt = params.get("refresh_token");
      if (at) {
        setTokens(at, rt);
        window.location.hash = "";
        setLoading(true);
        authApi.getMe()
          .then((u) => {
            setAuth(u);
            setChecked(true);
          })
          .catch(() => {
            router.replace("/login");
          })
          .finally(() => setLoading(false));
        return;
      }
    }

    if (publicPaths.includes(pathname)) {
      setChecked(true);
      return;
    }

    if (user) {
      setChecked(true);
      return;
    }

    if (loading) return;
    setLoading(true);

    authApi.getMe()
      .then((u) => {
        setAuth(u);
        setChecked(true);
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [pathname, router, hasHydrated, user, setAuth, setTokens, loading]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthGuard>
              <MainLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={() => setSidebarOpen(false)}>
                {children}
              </MainLayout>
            </AuthGuard>
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                className: "text-sm",
              }}
            />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

function MainLayout({
  children,
  sidebarOpen,
  toggleSidebar,
  closeSidebar,
}: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <Sidebar mobile open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
