import { useState } from 'react';
import { Button } from './button';
import { useAuth } from '../../contexts/AuthContext';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`md:hidden ${className}`}>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="p-2"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMenu} />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2"
              aria-label="Close menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4 space-y-2">
            <a
              href="#dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </a>
            <a
              href="#content-generator"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Content Generator
            </a>
            <a
              href="#content-library"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Content Library
            </a>
            <a
              href="#calendar"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Calendar
            </a>
            <a
              href="#analytics"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Analytics
            </a>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="mb-4">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.subscriptionTier} Plan
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}