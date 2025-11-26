import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Globe, MapPin, Package, CheckCircle2, Plug, Unplug } from "lucide-react";
import type { BaseSupplier } from "@/types/suppliers";

interface SupplierCardProps {
  supplier: BaseSupplier;
  viewMode: "grid" | "list";
  onConnect: () => void;
  onDisconnect?: () => void;
}

export function SupplierCard({ supplier, viewMode, onConnect, onDisconnect }: SupplierCardProps) {
  const isConnected = supplier.status === "connected";

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-center p-6 gap-6">
          <div className="flex-shrink-0">
            {supplier.logo ? (
              <img 
                src={supplier.logo} 
                alt={supplier.displayName}
                className="h-16 w-16 object-contain rounded-lg"
              />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {supplier.displayName}
              </h3>
              {isConnected && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              )}
              <Badge variant="secondary" className="capitalize">
                {supplier.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {supplier.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {supplier.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{supplier.country}</span>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>Site web</span>
                </div>
              )}
              {supplier.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{supplier.rating}/5</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button 
              onClick={onConnect}
              variant={isConnected ? "outline" : "default"}
            >
              <Plug className="h-4 w-4 mr-2" />
              {isConnected ? "Gérer" : "Connecter"}
            </Button>
            {isConnected && onDisconnect && (
              <Button 
                onClick={onDisconnect}
                variant="destructive"
                size="icon"
              >
                <Unplug className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          {supplier.logo ? (
            <img 
              src={supplier.logo} 
              alt={supplier.displayName}
              className="h-12 w-12 object-contain rounded-lg"
            />
          ) : (
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          )}
          {isConnected && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{supplier.displayName}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {supplier.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <Badge variant="secondary" className="capitalize">
            {supplier.category}
          </Badge>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-2">
            {supplier.country && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{supplier.country}</span>
              </div>
            )}
            {supplier.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{supplier.rating}/5</span>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a 
                  href={supplier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary truncate"
                >
                  Site web
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          onClick={onConnect}
          variant={isConnected ? "outline" : "default"}
          className="flex-1"
        >
          <Plug className="h-4 w-4 mr-2" />
          {isConnected ? "Gérer" : "Connecter"}
        </Button>
        {isConnected && onDisconnect && (
          <Button 
            onClick={onDisconnect}
            variant="destructive"
          >
            <Unplug className="h-4 w-4 mr-2" />
            Déconnecter
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
