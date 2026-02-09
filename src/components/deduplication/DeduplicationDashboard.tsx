import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useDuplicateDetection, DuplicateGroup } from '@/hooks/useDuplicateDetection';
import {
  Target, Zap, RefreshCw, CheckCircle2, AlertTriangle, Merge, X, Eye, Loader2
} from 'lucide-react';

function DuplicateGroupCard({
  group,
  onMerge,
  onDismiss,
  isMerging,
}: {
  group: DuplicateGroup;
  onMerge: (keepId: string, removeIds: string[]) => void;
  onDismiss: (groupId: string) => void;
  isMerging: boolean;
}) {
  const [selectedKeep, setSelectedKeep] = useState(group.primary.id);

  const allProducts = [
    { ...group.primary, similarity: 1, reasons: ['Original'] },
    ...group.duplicates,
  ];
  const removeIds = allProducts.filter((p) => p.id !== selectedKeep).map((p) => p.id);

  return (
    <Card className="border-l-4 border-l-orange-400">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={group.matchType === 'exact_sku' ? 'destructive' : 'secondary'}>
              {group.matchType === 'exact_sku' ? 'SKU identique' : 'Titre similaire'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {allProducts.length} produits
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDismiss(group.groupId)}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Ignorer
            </Button>
            <Button
              size="sm"
              onClick={() => onMerge(selectedKeep, removeIds)}
              disabled={isMerging}
              className="text-xs"
            >
              {isMerging ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Merge className="h-3 w-3 mr-1" />
              )}
              Fusionner
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {allProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedKeep(product.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selectedKeep === product.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            {/* Image */}
            <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  N/A
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {product.sku && <span>SKU: {product.sku}</span>}
                {product.price && <span>{product.price.toFixed(2)}€</span>}
                {product.brand && <span>{product.brand}</span>}
              </div>
            </div>

            {/* Similarity & badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedKeep === product.id && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conserver
                </Badge>
              )}
              {product.similarity < 1 && (
                <Badge variant="outline" className="text-xs">
                  {(product.similarity * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
        {/* Reasons */}
        <div className="flex flex-wrap gap-1 pt-1">
          {group.duplicates[0]?.reasons.map((reason, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DeduplicationDashboard() {
  const { groups, stats, isScanning, isMerging, scanDuplicates, mergeGroup, dismissGroup } =
    useDuplicateDetection();
  const [threshold, setThreshold] = useState([75]);

  const handleScan = () => scanDuplicates(threshold[0] / 100);
  const handleMergeAll = async () => {
    for (const group of groups) {
      const removeIds = group.duplicates.map((d) => d.id);
      await mergeGroup(group.primary.id, removeIds);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Détection de doublons
          </CardTitle>
          <CardDescription>
            Scannez votre catalogue pour détecter et fusionner les produits en double
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-6">
            <div className="flex-1 space-y-2">
              <Label>Seuil de similarité: {threshold[0]}%</Label>
              <Slider
                value={threshold}
                onValueChange={setThreshold}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Plus le seuil est bas, plus de doublons potentiels seront détectés
              </p>
            </div>
            <Button onClick={handleScan} disabled={isScanning} className="gap-2">
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-sm text-muted-foreground">Produits analysés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.totalDuplicates}</div>
              <p className="text-sm text-muted-foreground">Doublons détectés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.duplicateGroups}</div>
              <p className="text-sm text-muted-foreground">Groupes de doublons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.executionMs}ms</div>
              <p className="text-sm text-muted-foreground">Temps d'exécution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk actions */}
      {groups.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {groups.length} groupe(s) de doublons à traiter
          </p>
          <Button
            variant="outline"
            onClick={handleMergeAll}
            disabled={isMerging}
            className="gap-2"
          >
            <Merge className="h-4 w-4" />
            Tout fusionner (conserver les originaux)
          </Button>
        </div>
      )}

      {/* Duplicate groups */}
      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <DuplicateGroupCard
              key={group.groupId}
              group={group}
              onMerge={mergeGroup}
              onDismiss={(gId) =>
                dismissGroup(gId, [group.primary.id, ...group.duplicates.map((d) => d.id)])
              }
              isMerging={isMerging}
            />
          ))}
        </div>
      ) : stats ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold">Aucun doublon détecté</h3>
            <p className="text-muted-foreground mt-1">
              Votre catalogue est propre ! Essayez de baisser le seuil pour une analyse plus stricte.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
