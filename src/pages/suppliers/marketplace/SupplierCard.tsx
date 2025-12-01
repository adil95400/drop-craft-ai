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
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-6 gap-3 sm:gap-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-shrink-0">
              {supplier.logo ? (
                <img 
                  src={supplier.logo} 
                  alt={supplier.displayName}
                  className="h-10 w-10 sm:h-16 sm:w-16 object-contain rounded-lg"
                />
              ) : (
                <div className="h-10 w-10 sm:h-16 sm:w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 sm:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {supplier.displayName}
                </h3>
                {isConnected && (
                  <Badge variant="default" className="bg-green-500 text-[10px] px-1.5 py-0">
                    Connecté
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {supplier.category}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
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
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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

          <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
            <Button 
              onClick={onConnect}
              variant={isConnected ? "outline" : "default"}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
              size="sm"
            >
              <Plug className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isConnected ? "Gérer" : "Connecter"}
            </Button>
            {isConnected && onDisconnect && (
              <Button 
                onClick={onDisconnect}
                variant="destructive"
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Unplug className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0 mr-1" />
                <span className="sm:hidden">Déco</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          {supplier.logo ? (
            <img 
              src={supplier.logo} 
              alt={supplier.displayName}
              className="h-8 w-8 sm:h-12 sm:w-12 object-contain rounded-lg"
            />
          ) : (
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            </div>
          )}
          {isConnected && (
            <Badge variant="default" className="bg-green-500 text-[10px] sm:text-xs px-1.5 py-0">
              <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Connecté</span>
              <span className="sm:hidden">OK</span>
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm sm:text-lg leading-tight">{supplier.displayName}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs sm:text-sm min-h-[32px] sm:min-h-[40px]">
          {supplier.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2">
          <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs">
            {supplier.category}
          </Badge>
          <div className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground pt-1 sm:pt-2">
            {supplier.country && (
              <div className="flex items-center gap-1 sm:gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{supplier.country}</span>
              </div>
            )}
            {supplier.rating && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span>{supplier.rating}/5</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 p-3 sm:p-6 pt-0">
        <Button 
          onClick={onConnect}
          variant={isConnected ? "outline" : "default"}
          className="flex-1 text-xs sm:text-sm h-8 sm:h-10"
          size="sm"
        >
          <Plug className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {isConnected ? "Gérer" : "Connecter"}
        </Button>
        {isConnected && onDisconnect && (
          <Button 
            onClick={onDisconnect}
            variant="destructive"
            className="text-xs sm:text-sm h-8 sm:h-10"
            size="sm"
          >
            <Unplug className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Déconnecter</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
