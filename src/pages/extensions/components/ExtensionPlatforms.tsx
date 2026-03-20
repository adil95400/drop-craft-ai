/**
 * Supported platforms display
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Globe, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const platforms = [
  { name: 'AliExpress', color: 'bg-warning', logo: '🛒', popular: true },
  { name: 'Amazon', color: 'bg-warning', logo: '📦', popular: true },
  { name: 'Temu', color: 'bg-warning', logo: '🎯', popular: true },
  { name: 'CJDropshipping', color: 'bg-success', logo: '🚀' },
  { name: 'eBay', color: 'bg-info', logo: '🏷️' },
  { name: '1688', color: 'bg-orange-400', logo: '🏭' },
  { name: 'Taobao', color: 'bg-orange-300', logo: '🛍️' },
  { name: 'DHgate', color: 'bg-blue-400', logo: '🌐' },
  { name: 'Banggood', color: 'bg-destructive', logo: '🔧' },
  { name: 'Wish', color: 'bg-cyan-500', logo: '⭐' },
  { name: 'Shein', color: 'bg-pink-500', logo: '👗' },
  { name: 'Walmart', color: 'bg-info', logo: '🏪' },
]

interface ExtensionPlatformsProps {
  className?: string
}

export function ExtensionPlatforms({ className }: ExtensionPlatformsProps) {
  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Plateformes supportées</CardTitle>
              <CardDescription>
                Importez depuis les plus grandes marketplaces mondiales
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            {platforms.length}+ plateformes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Badge 
                className={cn(
                  "text-sm py-2 px-4 gap-2 cursor-default hover:scale-105 transition-transform",
                  platform.color, 
                  "text-white border-0"
                )}
              >
                <span className="text-base">{platform.logo}</span>
                {platform.name}
                {platform.popular && (
                  <span className="ml-1 text-xs opacity-80">★</span>
                )}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
