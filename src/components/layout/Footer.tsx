import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '/features' },
        { label: 'Tarifs', href: '/pricing' },
        { label: 'Documentation', href: '/documentation' },
        { label: 'Guide de démarrage', href: '/guides/getting-started' },
        { label: 'API', href: '/integrations/api/documentation' },
        { label: 'Extensions', href: '/extensions' }
      ]
    },
    {
      title: 'Solutions',
      links: [
        { label: 'IA d\'optimisation', href: '/features/ai-optimization' },
        { label: 'Multi-marketplace', href: '/features/multi-marketplace' },
        { label: 'Analytics avancés', href: '/features/analytics' },
        { label: 'Automatisation', href: '/automation' },
        { label: 'CRM & Marketing', href: '/marketing' }
      ]
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Académie', href: '/academy' },
        { label: 'Centre d\'aide', href: '/faq' },
        { label: 'Support', href: '/contact' },
        { label: 'Communauté', href: '/blog' },
        { label: 'Changelog', href: '/blog' }
      ]
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Enterprise', href: '/pricing' },
        { label: 'Partenaires', href: '/about' },
        { label: 'Carrières', href: '/about' }
      ]
    },
    {
      title: 'Légal',
      links: [
        { label: 'Mentions légales', href: '/terms' },
        { label: 'Confidentialité', href: '/privacy' },
        { label: 'Conditions d\'utilisation', href: '/terms' },
        { label: 'RGPD', href: '/privacy' },
        { label: 'Cookies', href: '/privacy' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/shopopti', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/shopopti', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/shopopti', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com/shopopti', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@shopopti', label: 'YouTube' }
  ];

  return (
    <footer className="bg-secondary/30 border-t">
      <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Newsletter Section */}
        <div className="pb-12 border-b">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Restez informé</h3>
              <p className="text-muted-foreground">
                Recevez nos dernières actualités, conseils e-commerce et offres exclusives
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Votre email"
                className="flex-1"
              />
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                S'abonner
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                ShopOpti
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              La plateforme n°1 pour automatiser et développer votre e-commerce avec l'IA.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} ShopOpti. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">
                Conditions
              </Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <Link to="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
