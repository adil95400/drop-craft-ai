import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import logoFull from '@/assets/logo-shopopti-full.png';
import { useTranslation } from 'react-i18next';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Memoized Logo component for performance
const HeaderLogo = memo(() => (
  <Link to="/" className="flex items-center group">
    <img 
      src={logoFull} 
      alt="ShopOpti" 
      className="h-12 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
      height={56}
      loading="eager"
    />
  </Link>
));
HeaderLogo.displayName = 'HeaderLogo';

export function PublicLayout({
  children
}: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation('navigation');

  const navigation = [
    { name: t('publicNav.features'), href: '/features' },
    { name: t('publicNav.pricing'), href: '/pricing' },
    { name: t('publicNav.documentation'), href: '/documentation' },
    { name: t('publicNav.about'), href: '/about' },
    { name: t('publicNav.blog'), href: '/blog' },
    { name: t('publicNav.contact'), href: '/contact' },
  ];

  return <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <HeaderLogo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map(item => <Link key={item.href} to={item.href} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors text-primary font-sans">
                  {item.name}
                </Link>)}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Button variant="ghost" size={isMobile ? "sm" : "default"} onClick={() => navigate('/auth')}>
                {t('publicNav.login')}
              </Button>
              <Button size={isMobile ? "sm" : "default"} onClick={() => navigate('/auth')} className="bg-gradient-hero hover:opacity-90 transition-opacity bg-primary text-primary-foreground text-center border-primary">
                {t('publicNav.freeTrial')}
              </Button>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label={mobileMenuOpen ? t('publicNav.closeMenu') : t('publicNav.openMenu')}>
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-1.5 sm:space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto pb-safe">
              {navigation.map(item => <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-sm sm:text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-95">
                  {item.name}
                </Link>)}
              <div className="pt-3 sm:pt-4 space-y-2 border-t">
                <Button variant="outline" size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-base" onClick={() => {
              setMobileMenuOpen(false);
              navigate('/auth');
            }}>
                  {t('publicNav.login')}
                </Button>
                <Button size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-hero hover:opacity-90" onClick={() => {
              setMobileMenuOpen(false);
              navigate('/auth');
            }}>
                  {t('publicNav.freeTrial')}
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