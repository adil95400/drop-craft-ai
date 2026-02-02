/**
 * TrustedBySection - Section logos partenaires pour crédibilité
 * Affiche les logos des plateformes et partenaires intégrés
 */
import React from "react";
import Logo from "@/components/brand/Logo";
import type { LogoKey } from "@/data/logos";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

// Logos partenaires clés pour la crédibilité
const partnerLogos: LogoKey[] = [
  "shopify",
  "woocommerce",
  "stripe",
  "prestashop",
  "aliexpress",
  "amazon",
];

// Logos plateformes intégrées
const platformLogos: LogoKey[] = [
  "google",
  "facebook",
  "tiktok",
  "ebay",
  "etsy",
  "zapier",
];

export function TrustedBySection() {
  return (
    <section className="py-12 sm:py-16 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-8">
          <Badge variant="outline" className="px-4 py-1.5">
            <Shield className="h-3.5 w-3.5 mr-2" />
            Intégrations certifiées
          </Badge>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connectez-vous aux principales plateformes e-commerce et marketplaces
          </p>
        </div>

        {/* Logos partenaires principaux */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mb-8">
          {partnerLogos.map((logoKey) => (
            <div
              key={logoKey}
              className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200 grayscale hover:grayscale-0"
            >
              <Logo name={logoKey} height={32} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 my-6">
          <div className="h-px flex-1 bg-border max-w-[100px]" />
          <span className="text-xs text-muted-foreground">+ 20 autres</span>
          <div className="h-px flex-1 bg-border max-w-[100px]" />
        </div>

        {/* Logos secondaires */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {platformLogos.map((logoKey) => (
            <div
              key={logoKey}
              className="flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity duration-200 grayscale hover:grayscale-0"
            >
              <Logo name={logoKey} height={24} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustedBySection;
