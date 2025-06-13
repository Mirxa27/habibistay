'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import NotificationsDropdown from '../notifications/NotificationsDropdown';

// Placeholder icon components 
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaUserCircle = ({ className }: { className?: string }) => <IconComponent className={className}>👤</IconComponent>;
const FaSignOutAlt = ({ className }: { className?: string }) => <IconComponent className={className}>🚪</IconComponent>;
const FaCalendarAlt = ({ className }: { className?: string }) => <IconComponent className={className}>📅</IconComponent>;
const FaEnvelope = ({ className }: { className?: string }) => <IconComponent className={className}>📧</IconComponent>;
const FaCog = ({ className }: { className?: string }) => <IconComponent className={className}>⚙️</IconComponent>;
const FaBell = ({ className }: { className?: string }) => <IconComponent className={className}>🔔</IconComponent>;
const FaQuestionCircle = ({ className }: { className?: string }) => <IconComponent className={className}>❓</IconComponent>;

const Navbar = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={"/" as any} className="text-2xl font-bold text-[#2957c3]">
                Habibistay
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href={"/" as any}
                className={`${
                  isActive('/') 
                    ? 'border-[#2957c3] text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                href={"/search" as any}
                className={`${
                  isActive('/search') 
                    ? 'border-[#2957c3] text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Search
              </Link>
              <Link
                href={"/help" as any}
                className={`${
                  isActive('/help') 
                    ? 'border-[#2957c3] text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Help
              </Link>
              {session?.user.role === UserRole.HOST && (
                <Link
                  href={"/host/properties" as any}
                  className={`${
                    pathname?.startsWith('/host') 
                      ? 'border-[#2957c3] text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  My Properties
                </Link>
              )}
              {session?.user.role === UserRole.PROPERTY_MANAGER && (
                <Link
                  href={"/manager/properties" as any}
                  className={`${
                    pathname?.startsWith('/manager') 
                      ? 'border-[#2957c3] text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Managed Properties
                </Link>
              )}
              {session?.user.role === UserRole.ADMIN && (
                <Link
                  href={"/admin/dashboard" as any}
                  className={`${
                    pathname?.startsWith('/admin') 
                      ? 'border-[#2957c3] text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Admin
                </Link>
              )}
              {session?.user.role === UserRole.INVESTOR && (
                <Link
                  href={"/investor/dashboard" as any}
                  className={`${
                    pathname?.startsWith('/investor') 
                      ? 'border-[#2957c3] text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Investments
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {status === 'authenticated' ? (
              <>
                <NotificationsDropdown className="mr-4" />
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={toggleProfileMenu}
                      className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2957c3]"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      {session.user.image ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                        />
                      ) : (
                        <FaUserCircle className="h-8 w-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Signed in as <span className="font-medium">{session.user.email}</span>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <Link
                      href={"/profile" as any}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-0"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <FaUserCircle className="mr-2" /> Profile
                      </div>
                    </Link>
                    <Link
                      href={"/bookings" as any}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-1"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2" /> My Bookings
                      </div>
                    </Link>
                    <Link
                      href={"/messages" as any}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-2"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <FaEnvelope className="mr-2" /> Messages
                      </div>
                    </Link>
                    <Link
                      href={"/settings" as any}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-3"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <FaCog className="mr-2" /> Settings
                      </div>
                    </Link>
                    <Link
                      href={"/notifications" as any}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-4"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <FaBell className="mr-2" /> Notifications
                      </div>
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-4"
                    >
                      <div className="flex items-center">
                        <FaSignOutAlt className="mr-2" /> Sign out
                      </div>
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href={"/login" as any}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href={"/register" as any}
                  className="bg-[#2957c3] text-white hover:bg-[#1e3c8a] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2957c3]"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href={"/" as any}
            className={`${
              isActive('/') 
                ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={toggleMenu}
          >
            Home
          </Link>
          <Link
            href={"/search" as any}
            className={`${
              isActive('/search') 
                ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={toggleMenu}
          >
            Search
          </Link>
          <Link
            href={"/help" as any}
            className={`${
              isActive('/help') 
                ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={toggleMenu}
          >
            <div className="flex items-center">
              <FaQuestionCircle className="mr-2" /> Help
            </div>
          </Link>
          {session?.user.role === UserRole.HOST && (
            <Link
              href={"/host/properties" as any}
              className={`${
                pathname?.startsWith('/host') 
                  ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={toggleMenu}
            >
              My Properties
            </Link>
          )}
          {session?.user.role === UserRole.PROPERTY_MANAGER && (
            <Link
              href={"/manager/properties" as any}
              className={`${
                pathname?.startsWith('/manager') 
                  ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={toggleMenu}
            >
              Managed Properties
            </Link>
          )}
          {session?.user.role === UserRole.ADMIN && (
            <Link
              href={"/admin/dashboard" as any}
              className={`${
                pathname?.startsWith('/admin') 
                  ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={toggleMenu}
            >
              Admin
            </Link>
          )}
          {session?.user.role === UserRole.INVESTOR && (
            <Link
              href={"/investor/dashboard" as any}
              className={`${
                pathname?.startsWith('/investor') 
                  ? 'bg-[#eef2ff] border-[#2957c3] text-[#2957c3]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={toggleMenu}
            >
              Investments
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {status === 'authenticated' ? (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  {session.user.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {session.user.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {session.user.email}
                  </div>
                </div>
                <Link href={"/notifications" as any} className="ml-auto">
                  <FaBell className="h-6 w-6 text-gray-400" />
                </Link>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href={"/profile" as any}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    <FaUserCircle className="mr-2" /> Profile
                  </div>
                </Link>
                <Link
                  href={"/bookings" as any}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" /> My Bookings
                  </div>
                </Link>
                <Link
                  href={"/messages" as any}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    <FaEnvelope className="mr-2" /> Messages
                  </div>
                </Link>
                <Link
                  href={"/notifications" as any}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    <FaBell className="mr-2" /> Notifications
                  </div>
                </Link>
                <Link
                  href={"/settings" as any}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    <FaCog className="mr-2" /> Settings
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <FaSignOutAlt className="mr-2" /> Sign out
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-1">
              <Link
                href={"/login" as any}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={toggleMenu}
              >
                Sign in
              </Link>
              <Link
                href={"/register" as any}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={toggleMenu}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
