import { Upload, Link, FileSpreadsheet, Image, Globe, Puzzle, Chrome } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ImportMethod {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  premium?: boolean
}

interface ImportMethodsProps {
  selectedMethod: string
  onMethodSelect: (method: string) => void
}

export const ImportMethods = ({ selectedMethod, onMethodSelect }: ImportMethodsProps) => {
  const methods: ImportMethod[] = [
    {
      id: "csv",
      title: "CSV/Excel",
      description: "Import via fichier avec mapping IA automatique",
      icon: <FileSpreadsheet className="w-8 h-8" />,
      color: "text-green-600"
    },
    {
      id: "url",
      title: "URL Produit",
      description: "Extraction automatique depuis n'importe quel site",
      icon: <Link className="w-8 h-8" />,
      color: "text-blue-600"
    },
    {
      id: "image",
      title: "Image/OCR",
      description: "Reverse image search et extraction de données",
      icon: <Image className="w-8 h-8" />,
      color: "text-purple-600"
    },
    {
      id: "api",
      title: "API Fournisseur",
      description: "BigBuy, EPROLO, Aliexpress et plus",
      icon: <Globe className="w-8 h-8" />,
      color: "text-orange-600",
      premium: true
    },
    {
      id: "xml",
      title: "XML/FTP",
      description: "Import automatique des flux fournisseurs",
      icon: <Puzzle className="w-8 h-8" />,
      color: "text-red-600",
      premium: true
    },
    {
      id: "extension",
      title: "Extension Chrome",
      description: "Import en 1 clic depuis n'importe quel site",
      icon: <Chrome className="w-8 h-8" />,
      color: "text-indigo-600",
      premium: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {methods.map((method) => (
        <Card 
          key={method.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedMethod === method.id 
              ? "ring-2 ring-primary shadow-lg bg-primary/5" 
              : "hover:bg-muted/30"
          }`}
          onClick={() => onMethodSelect(method.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={method.color}>
                {method.icon}
              </div>
              {method.premium && (
                <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                  PRO
                </div>
              )}
            </div>
            <CardTitle className="text-lg">{method.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{method.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}