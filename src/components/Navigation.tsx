import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Map, Wallet, User, FileUser } from 'lucide-react';
import { BLogo } from './BLogo';
import { WalletButton } from './wallet/WalletButton';
import { createRoute, isActiveRoute } from '@/utils/navigation';

export const Navigation = () => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path: string) => isActiveRoute(path, location.pathname);

  return (
    <nav className="w-full bg-card/95 backdrop-blur-lg border-b border-border/30 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <Link
              to={createRoute('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="h-12 w-12 flex items-center justify-center">
                <BLogo className="w-full h-full text-primary" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                  BitStriker
                </span>
                <span className="text-xs font-semibold text-primary tracking-tight -mt-1">
                  ONE WAY OPTIONS
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-6">
              <Link
                to={createRoute('/')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/')
                    ? 'text-primary font-semibold bg-primary/20'
                    : hoveredItem === 'home'
                      ? 'text-primary/80 bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoveredItem('home')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link
                to={createRoute('/trade')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/trade')
                    ? 'text-primary font-semibold bg-primary/20'
                    : hoveredItem === 'trade'
                      ? 'text-primary/80 bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoveredItem('trade')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Trade</span>
              </Link>

              <Link
                to={createRoute('/portfolio')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/portfolio')
                    ? 'text-primary font-semibold bg-primary/20'
                    : hoveredItem === 'portfolio'
                      ? 'text-primary/80 bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoveredItem('portfolio')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Map className="w-4 h-4" />
                <span>Portfolio</span>
              </Link>

              <Link
                to={createRoute('/wallet')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/wallet')
                    ? 'text-primary font-semibold bg-primary/20'
                    : hoveredItem === 'wallet'
                      ? 'text-primary/80 bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoveredItem('wallet')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Wallet className="w-4 h-4" />
                <span>Wallet</span>
              </Link>
            </div>
          </div>

          {/* Wallet and User Menu */}
          <div className="flex items-center space-x-4">
            <WalletButton />
            <div className="relative">
              <button
                className={`flex items-center space-x-2 w-10 h-10 rounded-full transition-all duration-200 ${
                  isUserMenuOpen
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/20 hover:bg-primary/30 text-primary'
                }`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 150)}
              >
                <User className="w-5 h-5 mx-auto" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-card/95 backdrop-blur-lg border border-border/30 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <Link
                      to={createRoute('/mypage')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FileUser className="w-4 h-4" />
                      <span>My Page</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
