
import { User, Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FactionAvatarProps {
  faction: "oni" | "mud" | "ustur" | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const FactionAvatar = ({ faction, size = "md", className }: FactionAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const imageSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  const factionConfig = {
    oni: {
      image: "/assets/Factions/oni.png",
      alt: "ONI Faction - Alien",
      icon: User,
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
      text: "text-blue-400"
    },
    mud: {
      image: "/assets/Factions/mud.png",
      alt: "MUD Faction - Human",
      icon: Bot,
      bg: "bg-green-500/20",
      border: "border-green-500/50",
      text: "text-green-400"
    },
    ustur: {
      image: "/assets/Factions/ustur.png",
      alt: "USTUR Faction - Robot",
      icon: Zap,
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
      text: "text-purple-400"
    },
    null: {
      image: null,
      alt: "No Faction",
      icon: User,
      bg: "bg-gray-500/20",
      border: "border-gray-500/50",
      text: "text-gray-400"
    }
  };

  const config = factionConfig[faction || 'null'];
  const Icon = config.icon;
  const shouldShowImage = config.image && !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {shouldShowImage ? (
        <img
          src={config.image!}
          alt={config.alt}
          className={cn(
            "object-cover rounded-full",
            imageSizes[size]
          )}
          onError={handleImageError}
        />
      ) : (
        <Icon className={iconSizes[size]} />
      )}
    </div>
  );
};

export default FactionAvatar;
