"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "mark" | "full";

const DIMENSIONS = {
  mark: { src: "/healthplus-cross-icon.png" as const, width: 128, height: 128 },
  full: { src: "/logo-healthplus.png" as const, width: 400, height: 120 },
} as const;

export function BrandLogo({
  variant,
  className,
  priority,
}: {
  variant: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { src, width, height } = DIMENSIONS[variant];
  return (
    <Image
      src={src}
      alt="HealthPlus"
      width={width}
      height={height}
      className={cn(
        variant === "mark"
          ? "h-9 w-9 object-contain"
          : "h-auto w-full max-w-[min(100%,280px)] object-contain object-left",
        className,
      )}
      priority={priority}
    />
  );
}
