import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight 
} from 'lucide-react';
import logoFull from '@/assets/logo-shopopti-full.png';

const FooterNavigation = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Produit",
      links: [
        { name: "Fonctionnalités", href: "/features" },
        { name: "Tarifs", href: "/pricing" },
        { name: "Documentation", href: "/documentation" },
        { name: "API", href: "/integrations/api/documentation" },
        { name: "Guide de démarrage", href: "/guides/getting-started" }
      ]
    },
    {
      title: "Solutions",
      links: [
        { name: "IA d'optimisation", href: "/features/ai-optimization" },
        { name: "Multi-marketplace", href: "/features/multi-marketplace" },
        { name: "Analytics", href: "/features/analytics" },
        { name: "Automatisation", href: "/automation" },
        { name: "CRM & Marketing", href: "/marketing" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Académie", href: "/academy" },
        { name: "Centre d'aide", href: "/faq" },
        { name: "Support", href: "/contact" },
        { name: "Extensions", href: "/extensions" }
      ]
    },
    {
      title: "Entreprise", 
      links: [
        { name: "À propos", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Enterprise", href: "/pricing" },
        { name: "Partenaires", href: "/about" },
        { name: "Carrières", href: "/about" }
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Mentions légales", href: "/terms" },
        { name: "Confidentialité", href: "/privacy" },
        { name: "Conditions", href: "/terms" },
        { name: "RGPD", href: "/privacy" },
        { name: "Cookies", href: "/privacy" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" }
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src={logoFull} 
                alt="ShopOpti" 
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              La plateforme e-commerce intelligente qui révolutionne le dropshipping. 
              Automatisez vos processus et développez votre business avec l'IA.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@shopopti.io</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+33 1 85 08 99 47</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-semibold text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t">
          <div className="max-w-md">
            <h3 className="font-semibold mb-2">Restez informé</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recevez les dernières actualités et conseils e-commerce directement dans votre boîte mail.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
              <Button size="sm" aria-label="S'abonner à la newsletter">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} ShopOpti+. Tous droits réservés.
          </div>

          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <IconComponent className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          {/* Language/Region Selector */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>🇫🇷 Français</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterNavigation;