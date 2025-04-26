'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

// Dynamic import to prevent SSR issues
const ApiStatus = dynamic(() => import('@/components/ApiStatus'), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, loading, user, router]);
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  if (!mounted || loading || !user) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/moc_nguyen_production_black.png"
              alt="MOC Production Logo"
              width={120}
              height={40}
              className="invert logo-image"
            />
          </Link>
        </div>
        
        <div className="flex items-center space-x-8">
          <nav>
            <ul className="flex space-x-8">
              <li>
                <Link href="/dashboard" className="hover:text-gray-300 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/projects" className="hover:text-gray-300 transition">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/dashboard/settings" className="hover:text-gray-300 transition">
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
          
          <button
            onClick={handleLogout}
            className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-6 fade-in">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="p-6 border-t border-gray-800 flex justify-between items-center">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} MOC Studio. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
          <p className="text-xs text-gray-500">Environment: {process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV}</p>
          {mounted && <ApiStatus />}
        </div>
      </footer>
    </div>
  );
} 