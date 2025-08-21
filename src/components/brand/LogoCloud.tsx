import React from "react";
import Logo from "./Logo";
import type { LogoKey } from "@/data/logos";

type Props = {
  items: LogoKey[];
  title?: string;
  subdued?: boolean; // réduit l'opacité pour un effet "confiance"
  dense?: boolean;   // grille plus serrée
};

export default function LogoCloud({ items, title, subdued = true, dense = false }: Props) {
  return (
    <section aria-label={title ?? "Partenaires et intégrations"} className="py-8">
      {title && <h3 className="sr-only">{title}</h3>}
      <div className={`grid items-center justify-items-center ${
        dense 
          ? "grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4" 
          : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
      }`}>
        {items.map((logoKey) => (
          <div 
            key={logoKey} 
            className={`flex items-center justify-center transition-opacity duration-200 ${
              subdued ? "opacity-60 hover:opacity-100" : "opacity-90 hover:opacity-100"
            }`}
          >
            <Logo name={logoKey} height={dense ? 24 : 28} />
          </div>
        ))}
      </div>
    </section>
  );
}