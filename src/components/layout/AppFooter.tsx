import { VersionBadge } from '@/components/shared/VersionBadge';

export function AppFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-10 items-center justify-between px-4">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ShopOpti
        </span>
        <VersionBadge showFull />
      </div>
    </footer>
  );
}
