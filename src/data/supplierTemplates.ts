import type { BaseSupplier } from "@/types/suppliers";

export const SUPPLIER_TEMPLATES: BaseSupplier[] = [
  // Priority Suppliers
  {
    id: "bigbuy",
    name: "BigBuy",
    displayName: "BigBuy",
    description: "Leader européen du dropshipping B2B avec 100 000+ produits et expédition depuis l'UE",
    category: "wholesale",
    logo: "/logos/bigbuy.png",
    website: "https://www.bigbuy.eu",
    country: "Spain",
    status: "active",
    rating: 4.5
  },
  {
    id: "vidaxl",
    name: "VidaXL",
    displayName: "VidaXL",
    description: "Grossiste néerlandais spécialisé dans l'ameublement et les articles de maison",
    category: "wholesale",
    logo: "/logos/vidaxl.png",
    website: "https://www.vidaxl.com",
    country: "Netherlands",
    status: "active",
    rating: 4.3
  },
  {
    id: "aliexpress",
    name: "AliExpress",
    displayName: "AliExpress",
    description: "Plateforme mondiale de dropshipping avec des millions de produits à prix compétitifs",
    category: "marketplace",
    logo: "/logos/aliexpress.png",
    website: "https://www.aliexpress.com",
    country: "China",
    status: "active",
    rating: 4.2
  },
  {
    id: "alibaba",
    name: "Alibaba",
    displayName: "Alibaba",
    description: "Leader mondial du B2B pour l'approvisionnement en gros depuis la Chine",
    category: "marketplace",
    logo: "/logos/alibaba.png",
    website: "https://www.alibaba.com",
    country: "China",
    status: "active",
    rating: 4.4
  },
  {
    id: "dropshipping-europe",
    name: "Dropshipping Europe",
    displayName: "Dropshipping Europe",
    description: "Fournisseur européen spécialisé dans le dropshipping avec expédition rapide",
    category: "dropshipping",
    logo: "/logos/dropshipping-europe.png",
    website: "https://www.dropshipping-europe.com",
    country: "Germany",
    status: "active",
    rating: 4.1
  },
  {
    id: "btswholesaler",
    name: "BTS Wholesaler",
    displayName: "BTS Wholesaler",
    description: "Grossiste européen de produits technologiques et électroniques",
    category: "electronics",
    logo: "/logos/btswholesaler.png",
    website: "https://www.btswholesaler.com",
    country: "United Kingdom",
    status: "active",
    rating: 4.0
  },
  {
    id: "matterhorn",
    name: "Matterhorn",
    displayName: "Matterhorn",
    description: "Grossiste suisse de montres et accessoires de luxe",
    category: "luxury",
    logo: "/logos/matterhorn.png",
    website: "https://www.matterhorn.com",
    country: "Switzerland",
    status: "active",
    rating: 4.6
  },
  {
    id: "b2bsportswholesale",
    name: "B2B Sports Wholesale",
    displayName: "B2B Sports Wholesale",
    description: "Grossiste spécialisé dans les équipements et vêtements de sport",
    category: "sports",
    logo: "/logos/b2bsportswholesale.png",
    website: "https://www.b2bsportswholesale.com",
    country: "Germany",
    status: "active",
    rating: 4.2
  },
  {
    id: "watchimport",
    name: "Watch Import",
    displayName: "Watch Import",
    description: "Importateur et distributeur de montres de qualité",
    category: "watches",
    logo: "/logos/watchimport.png",
    website: "https://www.watchimport.com",
    country: "Hong Kong",
    status: "active",
    rating: 4.3
  },

  // Additional Popular Suppliers
  {
    id: "syncee",
    name: "Syncee",
    displayName: "Syncee",
    description: "Plateforme B2B connectant détaillants et fournisseurs mondiaux",
    category: "platform",
    logo: "/logos/syncee.png",
    website: "https://www.syncee.com",
    country: "Hungary",
    status: "active",
    rating: 4.4
  },
  {
    id: "eprolo",
    name: "Eprolo",
    displayName: "Eprolo",
    description: "Plateforme de dropshipping tout-en-un avec produits sourcés et personnalisés",
    category: "dropshipping",
    logo: "/logos/eprolo.png",
    website: "https://www.eprolo.com",
    country: "China",
    status: "active",
    rating: 4.2
  },
  {
    id: "printful",
    name: "Printful",
    displayName: "Printful",
    description: "Leader du print-on-demand avec impression et expédition automatisées",
    category: "print-on-demand",
    logo: "/logos/printful.png",
    website: "https://www.printful.com",
    country: "United States",
    status: "active",
    rating: 4.7
  },
  {
    id: "cdiscount",
    name: "CDiscount",
    displayName: "CDiscount Pro",
    description: "Marketplace française avec programme B2B pour revendeurs",
    category: "marketplace",
    logo: "/logos/cdiscount.png",
    website: "https://www.cdiscount.com",
    country: "France",
    status: "active",
    rating: 4.0
  },
  {
    id: "spocket",
    name: "Spocket",
    displayName: "Spocket",
    description: "Dropshipping de produits US et EU avec expédition rapide",
    category: "dropshipping",
    logo: "/logos/spocket.png",
    website: "https://www.spocket.co",
    country: "United States",
    status: "active",
    rating: 4.3
  },
  {
    id: "modalyst",
    name: "Modalyst",
    displayName: "Modalyst",
    description: "Plateforme de dropshipping premium avec marques établies",
    category: "dropshipping",
    logo: "/logos/modalyst.png",
    website: "https://www.modalyst.co",
    country: "United States",
    status: "active",
    rating: 4.1
  }
];

export const SUPPLIER_CATEGORIES = [
  { id: "all", label: "Tous les fournisseurs" },
  { id: "wholesale", label: "Grossistes" },
  { id: "marketplace", label: "Marketplaces" },
  { id: "dropshipping", label: "Dropshipping" },
  { id: "electronics", label: "Électronique" },
  { id: "luxury", label: "Luxe" },
  { id: "sports", label: "Sports" },
  { id: "watches", label: "Montres" },
  { id: "platform", label: "Plateformes" },
  { id: "print-on-demand", label: "Print-on-Demand" }
];
