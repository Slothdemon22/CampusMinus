'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function DashboardNav() {
  const pathname = usePathname();

  const isAdmin = pathname?.startsWith('/admin');
  
  const navItems = isAdmin
    ? [] // Admin uses sidebar, no nav items needed
    : [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/tasks', label: 'Tasks', icon: '✓' },
        { href: '/questions', label: 'Community', icon: '❓' },
        { href: '/my-questions', label: 'My Questions', icon: '📝' },
      ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Ragra Prep
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

