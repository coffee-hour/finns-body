# Cypher Terminal v8.0.0

High-Resolution 3D Mesh Engine with Diffuse Shading.

## Technical Specifications
- **High-Resolution Topology:** Significantly increased vertex and face density to provide realistic human geometry (detailed eyes, refined nose/lips, and contoured cheekbones).
- **Diffuse Lighting Model:** Implementation of a custom flat-shading system. Calculates surface normals for every face and applies a dot product against a static light source (top-right-front).
- **Advanced Rendering:** Combines Painter's Algorithm depth-sorting with dynamic opacity mapping based on light incidence, making the high-res structure "pop" with realistic shadows and highlights.
- **Interactivity:** Fluid lerp-based mouse gaze-tracking and reactive transmission pulses.

## Deployment
Compatible with all static hosting providers. Live at `finn.xavier.poke.site`.