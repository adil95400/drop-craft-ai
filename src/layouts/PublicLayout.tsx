import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import logoPng from '@/assets/logo-shopopti.png';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Memoized Logo component for performance
const HeaderLogo = memo(() => (
  <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
    <img 
      src={logoPng} 
      alt="Shopopti+" 
      className="h-8 w-8 sm:h-10 sm:w-10 object-contain transition-transform duration-300 group-hover:scale-105"
      width={40}
      height={40}
      loading="eager"
    />
    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      ShopOpti+
    </span>
  </Link>
));
HeaderLogo.displayName = 'HeaderLogo';

export function PublicLayout({
  children
}: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const navigation = [{
    name: 'Fonctionnalités',
    href: '/features'
  }, {
    name: 'Tarifs',
    href: '/pricing'
  }, {
    name: 'Documentation',
    href: '/documentation'
  }, {
    name: 'À propos',
    href: '/about'
  }, {
    name: 'Blog',
    href: '/blog'
  }, {
    name: 'Contact',
    href: '/contact'
  }];
  return <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <HeaderLogo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map(item => <Link key={item.name} to={item.href} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors text-primary font-sans">
                  {item.name}
                </Link>)}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Button variant="ghost" size={isMobile ? "sm" : "default"} onClick={() => navigate('/auth')}>
                Connexion
              </Button>
              <Button size={isMobile ? "sm" : "default"} onClick={() => navigate('/auth')} className="bg-gradient-hero hover:opacity-90 transition-opacity bg-primary text-primary-foreground text-center border-primary">
                Essai Gratuit
              </Button>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}>
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-1.5 sm:space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto pb-safe">
              {navigation.map(item => <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-sm sm:text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-95">
                  {item.name}
                </Link>)}
              <div className="pt-3 sm:pt-4 space-y-2 border-t">
                <Button variant="outline" size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-base" onClick={() => {
              setMobileMenuOpen(false);
              navigate('/auth');
            }}>
                  Connexion
                </Button>
                <Button size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-hero hover:opacity-90" onClick={() => {
              setMobileMenuOpen(false);
              navigate('/auth');
            }}>
                  Essai Gratuit
                </Button>
              </div>
            </div>
          </div>}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Footer */}
      <FooterNavigation />
    </div>;
}