import React, { useState } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const AuthDebug: React.FC = () => {
  const { user, profile, isAdmin, loading, effectivePlan } = useUnifiedAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Debug Auth State</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> <Badge variant={loading ? "destructive" : "secondary"}>{loading ? "true" : "false"}</Badge>
        </div>
        <div>
          <strong>User ID:</strong> {user?.id || "null"}
        </div>
        <div>
          <strong>Email:</strong> {user?.email || "null"}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? "loaded" : "null"}
        </div>
        {profile && (
          <>
            <div>
              <strong>is_admin:</strong> <Badge variant={profile.is_admin ? "default" : "secondary"}>{profile.is_admin ? "true" : "false"}</Badge>
            </div>
            <div>
              <strong>Admin Mode:</strong> <Badge variant="outline">{profile.admin_mode || "null"}</Badge>
            </div>
            <div>
              <strong>isAdmin (computed):</strong> <Badge variant={isAdmin ? "default" : "destructive"}>{isAdmin ? "true" : "false"}</Badge>
            </div>
            <div>
              <strong>Effective Plan:</strong> <Badge variant="secondary">{effectivePlan}</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};