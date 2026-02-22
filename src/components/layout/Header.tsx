import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Package, 
  BarChart3, 
  Settings, 
  Zap,
  ShoppingCart,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuthOptimized();
  const location = useLocation();
  const navigate = useNavigate();

  const productItems = [
    {
      title: "Import Produits",
      href: "/products/import",
      description: "Importez depuis AliExpress, BigBuy, Cdiscount",
      icon: Package
    },
    {
      title: "Catalogue",
      href: "/products",
      description: "Gérez votre catalogue de produits",
      icon: ShoppingCart
    },
    {
      title: "Commandes",
      href: "/orders", 
      description: "Suivez vos commandes en temps réel",
      icon: TrendingUp
    },
    {
      title: "Analytics",
      href: "/analytics",
      description: "Analysez vos performances",
      icon: BarChart3
    }
  ];

  const solutionsItems = [
    {
      title: "CRM",
      href: "/crm",
      description: "Gérez vos clients et prospects",
      icon: Users
    },
    {
      title: "Automation",
      href: "/automation", 
      description: "Automatisez vos processus",
      icon: Zap
    },
    {
      title: "Marketing",
      href: "/marketing",
      description: "Outils marketing avancés",
      icon: TrendingUp
    },
    {
      title: "Sécurité",
      href: "/enterprise/security",
      description: "Protégez votre business",
      icon: Shield
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ShopOpti
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {productItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <div className="text-sm font-medium leading-none">
                                  {item.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {solutionsItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <div className="text-sm font-medium leading-none">
                                  {item.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/pricing" className={navigationMenuTriggerStyle()}>
                  Tarifs
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/about" className={navigationMenuTriggerStyle()}>
                  À propos
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/contact" className={navigationMenuTriggerStyle()}>
                  Contact
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth?mode=login">Connexion</Link>
                </Button>
                <Button size="sm" onClick={handleAuthAction}>
                  Commencer
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <Link 
                    to="/" 
                    className="text-lg font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Accueil
                  </Link>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Produits</h3>
                    <div className="pl-4 space-y-2">
                      {productItems.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="block text-sm hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Solutions</h3>
                    <div className="pl-4 space-y-2">
                      {solutionsItems.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="block text-sm hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link 
                    to="/pricing" 
                    className="text-sm hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tarifs
                  </Link>
                  
                  <Link 
                    to="/about" 
                    className="text-sm hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    À propos
                  </Link>
                  
                  <Link 
                    to="/contact" 
                    className="text-sm hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>

                  <div className="pt-4 border-t space-y-2">
                    {user ? (
                      <>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            navigate('/dashboard');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Dashboard
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            navigate('/auth?mode=login');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Connexion
                        </Button>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            handleAuthAction();
                            setMobileMenuOpen(false);
                          }}
                        >
                          Commencer
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;