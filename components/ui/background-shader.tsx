"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export default function BackgroundShader() {
  return (
    <div className="absolute inset-0">
      <MeshGradient
        style={{ height: "100%", width: "100%" }}
        distortion={0.15}
        swirl={0.02}
        offsetX={0}
        offsetY={0}
        scale={1.2}
        rotation={0}
        speed={0.3}
        colors={[
          "hsl(216, 55%, 8%)",
          "hsl(217, 83%, 53%)",
          "hsl(217, 91%, 60%)",
          "hsl(213, 94%, 68%)",
        ]}
      />
    </div>
  );
}
