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

const HeaderLogo = memo(() => {
  const { t } = useTranslation('navigation');
  return (
    <Link to="/" className="flex items-center group">
      <img 
        src={logoFull} 
        alt={t('publicNav.logoAlt', 'ShopOpti – Retour à l\'accueil')}
        className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
        width={140}
        height={56}
        loading="eager"
        fetchPriority="high"
      />
    </Link>
  );
});
HeaderLogo.displayName = 'HeaderLogo';

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation('navigation');

  const mobileMenuId = 'mobile-nav-menu';

  const navigation = [
    { name: t('publicNav.features'), href: '/features' },
    { name: t('publicNav.pricing'), href: '/pricing' },
    { name: t('publicNav.documentation'), href: '/documentation' },
    { name: t('publicNav.about'), href: '/about' },
    { name: t('publicNav.blog'), href: '/blog' },
    { name: t('publicNav.contact'), href: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip Link — WCAG 2.4.1 */}
      <a href="#main-content" className="skip-link">
        {t('publicNav.skipToContent', 'Skip to main content')}
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <HeaderLogo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label={t('publicNav.mainNav', 'Main navigation')}>
              {navigation.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors text-foreground/80 hover:text-foreground active:scale-[0.97]"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Button variant="ghost" size={isMobile ? "sm" : "default"} onClick={() => navigate('/auth')}>
                {t('publicNav.login')}
              </Button>
              <Button
                size={isMobile ? "sm" : "default"}
                onClick={() => navigate('/auth')}
                className="active:scale-[0.97]"
              >
                {t('publicNav.freeTrial')}
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? t('publicNav.closeMenu') : t('publicNav.openMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
            >
              {mobileMenuOpen
                ? <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                : <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              }
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            id={mobileMenuId}
            className="md:hidden border-t bg-background animate-in slide-in-from-top-2 duration-200"
            aria-label={t('publicNav.mobileNav', 'Mobile navigation')}
          >
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto pb-safe">
              {navigation.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-sm sm:text-base font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-colors active:scale-[0.97] min-h-[44px] flex items-center"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-3 space-y-2 border-t">
                <Button variant="outline" size="lg" className="w-full h-12 text-sm sm:text-base" onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}>
                  {t('publicNav.login')}
                </Button>
                <Button size="lg" className="w-full h-12 text-sm sm:text-base" onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}>
                  {t('publicNav.freeTrial')}
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full" aria-label={t('publicNav.mainContent', 'Main content')}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Footer */}
      <FooterNavigation />
    </div>
  );
}
