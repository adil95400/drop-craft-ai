import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeButtonProps {
  feature: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function UpgradeButton({ 
  feature, 
  variant = "default", 
  size = "default",
  className 
}: UpgradeButtonProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/choose-plan");
  };

  return (
    <Button
      onClick={handleUpgrade}
      variant={variant}
      size={size}
      className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 ${className}`}
    >
      <Crown className="w-4 h-4 mr-2" />
      Passer à Ultra Pro
      <Sparkles className="w-4 h-4 ml-2" />
    </Button>
  );
}