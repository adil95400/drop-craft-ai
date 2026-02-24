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
import { useTranslation } from 'react-i18next';

const FooterNavigation = () => {
  const { t } = useTranslation('navigation');
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('footer.product'),
      links: [
        { name: t('footer.features'), href: "/features" },
        { name: t('footer.pricing'), href: "/pricing" },
        { name: t('footer.documentation'), href: "/documentation" },
        { name: t('footer.api'), href: "/integrations/api/documentation" },
        { name: t('footer.gettingStarted'), href: "/guides/getting-started" }
      ]
    },
    {
      title: t('footer.solutions'),
      links: [
        { name: t('footer.aiOptimization'), href: "/features/ai-optimization" },
        { name: t('footer.multiMarketplace'), href: "/features/multi-marketplace" },
        { name: t('footer.analytics'), href: "/features/analytics" },
        { name: t('footer.automation'), href: "/automation" },
        { name: t('footer.crmMarketing'), href: "/marketing" }
      ]
    },
    {
      title: t('footer.resources'),
      links: [
        { name: t('footer.blog'), href: "/blog" },
        { name: t('footer.academy'), href: "/academy" },
        { name: t('footer.helpCenter'), href: "/faq" },
        { name: t('footer.support'), href: "/contact" },
        { name: t('footer.extensions'), href: "/extensions" }
      ]
    },
    {
      title: t('footer.company'), 
      links: [
        { name: t('footer.about'), href: "/about" },
        { name: t('footer.contact'), href: "/contact" },
        { name: t('footer.enterprise'), href: "/pricing" },
        { name: t('footer.partners'), href: "/about" },
        { name: t('footer.careers'), href: "/about" }
      ]
    },
    {
      title: t('footer.legal'),
      links: [
        { name: t('footer.legalNotice'), href: "/terms" },
        { name: t('footer.privacy'), href: "/privacy" },
        { name: t('footer.terms'), href: "/terms" },
        { name: t('footer.gdpr'), href: "/privacy" },
        { name: t('footer.cookies'), href: "/privacy" }
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
                className="h-14 w-auto object-contain"
                loading="lazy"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
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
            <h3 className="font-semibold mb-2">{t('footer.stayInformed')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.newsletterDesc')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.yourEmail')}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
              <Button size="sm" aria-label={t('footer.subscribe')}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} ShopOpti+. {t('footer.allRightsReserved')}
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
            <span>🌍 {t('footer.language')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterNavigation;