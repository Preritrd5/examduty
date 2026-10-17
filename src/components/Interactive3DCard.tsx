import React, { useRef, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Interactive3DCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  maxRotation?: number; // max tilt angle in degrees (default: 10)
  glareEffect?: boolean;
  depthOffset?: number; // translateZ for elevated layer
}

export function Interactive3DCard({
  children,
  className = "",
  maxRotation = 8,
  glareEffect = true,
  depthOffset = 16,
  ...props
}: Interactive3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        // Calculate rotation (-0.5 to 0.5 normalized)
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        const rotateX = -yPct * maxRotation;
        const rotateY = xPct * maxRotation;

        setTransformStyle(
          `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02) translateY(-3px)`
        );

        if (glareEffect) {
          const glareX = (mouseX / width) * 100;
          const glareY = (mouseY / height) * 100;
          setGlareStyle({
            opacity: 0.65,
            background: `radial-gradient(circle 260px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 80%)`,
          });
        }
      });
    },
    [maxRotation, glareEffect]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setTransformStyle(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)"
    );
    setGlareStyle({ opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-2xl transition-transform duration-200 ease-out will-change-transform transform-gpu group",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        transform: transformStyle || "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      }}
      {...props}
    >
      {/* 3D Depth Layer */}
      <div
        className="h-full w-full"
        style={{
          transform: isHovered ? `translateZ(${depthOffset}px)` : "translateZ(0px)",
          transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>

      {/* Dynamic Specular Glare Layer */}
      {glareEffect && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-30"
          style={{
            ...glareStyle,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}
