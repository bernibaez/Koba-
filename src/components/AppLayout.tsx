import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const isPosPage = pathname.includes('point-of-sale') || pathname.includes('pos');

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // If on POS page, render full screen without Topbar and Sidebar
  if (isPosPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        currentPath={pathname}
      />

      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{
          marginLeft: 0,
        }}
      >
        <Topbar
          onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
          onToggleMobileSidebar={() => setMobileSidebarOpen((p) => !p)}
          darkMode={darkMode}
          onToggleDark={toggleDark}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div
            key={pathname}
            className="max-w-[1700px] mx-auto px-5 sm:px-6 lg:px-8 xl:px-10 py-8 page-enter"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
