# LingBot-only surface comparison

Local-only experiment, 2026-09-11. Select **MVS → LingBot only · 표면**.

Geometry is constructed exclusively from LingBot depth predictions: confidence >= 2, agreement with at least one other view within max(5 cm, 3% depth), 1.2 cm voxel sampling and a local neighborhood filter. The result has 575,955 input points and 449,999 textured mesh triangles.

No COLMAP sparse points, dense MVS points, existing MVS mesh, MVS ICP correction or MVS depth filtering are used in this candidate. The previously established camera alignment is retained so all comparison modes share coordinates. Texture mapping uses the original photos and aligned COLMAP camera calibration.

This is LingBot point-to-surface reconstruction with photo texturing, not a new photometric PatchMatch MVS run. Multi-view consistency is checked within LingBot predictions. Missing observations and erroneous surfaces remain possible.

All existing image-based and hybrid MVS variants are preserved. MVS saturation now defaults to 65%, with a 0–120% slider that affects only mesh appearance and does not alter source textures or other tabs.

Reproduction: parent workspace `work/lingbot-surface/fuse.py`, then `mesh.py`. Intermediate Poisson output is reusable. Face connected components are filtered using a sparse graph to avoid materializing thousands of separate meshes. Run this pipeline alone; do not overlap G4Splat builds, weight downloads or training.
