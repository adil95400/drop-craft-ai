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

const FooterNavigation = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Produit",
      links: [
        { name: "Fonctionnalités", href: "/features" },
        { name: "Tarifs", href: "/pricing" },
        { name: "Documentation", href: "/documentation" },
        { name: "API", href: "/api-docs" },
        { name: "Changelog", href: "/changelog" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Centre d'aide", href: "/support" },
        { name: "Guides", href: "/guides" },
        { name: "Blog", href: "/blog" },
        { name: "Communauté", href: "/community" },
        { name: "Webinaires", href: "/webinars" }
      ]
    },
    {
      title: "Entreprise", 
      links: [
        { name: "À propos", href: "/about" },
        { name: "Équipe", href: "/company" },
        { name: "Carrières", href: "/careers" },
        { name: "Partenaires", href: "/partners" },
        { name: "Presse", href: "/press" }
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Conditions d'utilisation", href: "/terms" },
        { name: "Politique de confidentialité", href: "/privacy" },
        { name: "Mentions légales", href: "/legal" },
        { name: "RGPD", href: "/gdpr" },
        { name: "Cookies", href: "/cookies" }
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">Notre Plateforme</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              La solution complète pour optimiser votre e-commerce avec l'intelligence artificielle. 
              Importez, optimisez et gérez vos produits en toute simplicité.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@exemple.fr</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+33 1 23 45 67 89</span>
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
              <Button size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} Notre Plateforme. Tous droits réservés.
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