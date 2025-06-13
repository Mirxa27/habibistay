'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaHome = ({ className }: { className?: string }) => <IconComponent className={className}>🏠</IconComponent>;
const FaUsers = ({ className }: { className?: string }) => <IconComponent className={className}>👥</IconComponent>;
const FaBuilding = ({ className }: { className?: string }) => <IconComponent className={className}>🏢</IconComponent>;
const FaCalendarAlt = ({ className }: { className?: string }) => <IconComponent className={className}>📅</IconComponent>;
const FaCreditCard = ({ className }: { className?: string }) => <IconComponent className={className}>💳</IconComponent>;
const FaChartLine = ({ className }: { className?: string }) => <IconComponent className={className}>📈</IconComponent>;
const FaCog = ({ className }: { className?: string }) => <IconComponent className={className}>⚙️</IconComponent>;
const FaBell = ({ className }: { className?: string }) => <IconComponent className={className}>🔔</IconComponent>;
const FaQuestion = ({ className }: { className?: string }) => <IconComponent className={className}>❓</IconComponent>;
const FaChevronLeft = ({ className }: { className?: string }) => <IconComponent className={className}>◀️</IconComponent>;
const FaChevronRight = ({ className }: { className?: string }) => <IconComponent className={className}>▶️</IconComponent>;

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => pathname?.startsWith(path);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/admin/users', label: 'Users', icon: FaUsers },
    { path: '/admin/properties', label: 'Properties', icon: FaBuilding },
    { path: '/admin/bookings', label: 'Bookings', icon: FaCalendarAlt },
    { path: '/admin/payments', label: 'Payments', icon: FaCreditCard },
    { path: '/admin/reports', label: 'Reports', icon: FaChartLine },
    { path: '/admin/settings', label: 'Settings', icon: FaCog },
    { path: '/admin/notifications', label: 'Notifications', icon: FaBell },
    { path: '/admin/support', label: 'Support', icon: FaQuestion },
  ];

  return (
    <div 
      className={`bg-gray-800 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold">Admin Panel</h2>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-md hover:bg-gray-700 ${isCollapsed ? 'mx-auto' : ''}`}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto pt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path as any}
                  className={`flex items-center py-3 px-4 ${
                    isActive(item.path) 
                      ? 'bg-blue-600' 
                      : 'hover:bg-gray-700'
                  } transition-colors duration-200 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <item.icon className={`${isCollapsed ? 'text-xl' : 'mr-3'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700 text-center text-sm text-gray-400">
          {!isCollapsed && (
            <p>Habibistay Admin v1.0</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
