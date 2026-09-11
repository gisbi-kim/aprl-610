# Local reconstruction experiments — 2026-09-10

These comparison experiments are included in the public viewer. Serve this directory locally on port 8612 for development.
The initial tab remains 3D model. MVS defaults to the expanded hybrid; GS is the fourth tab.

## Expanded hybrid

`mvs-hybrid-more.glb` preserves 299,999 baseline MVS triangles and adds 179,999 triangles reconstructed from LingBot predictions. Confidence >= 2; agreement with at least one other view within max(5 cm, 3% depth); MVS free-space rejection remains enabled. 422,571 accepted supplemental points, versus 181,575 in the conservative variant. This relaxes evidence requirements and can add incorrect surfaces. Remaining gaps are not guaranteed to disappear. The displayed orange overlay isolates added geometry.

Full settings: `mvs-hybrid-more-report.json`. Reproduction scripts and intermediate data are in the parent workspace's `work/mvs-more/` directory: `fuse.py`, `check_freespace.py`, `mesh.py`.

## Gaussian Splatting

`lingbot-gs.ply` is an actual Brush training export, not a point cloud displayed as dots. Initialization: 447,463 LingBot points at confidence >= 2 and 2.5 cm voxel size, subsampled by 3 during training. Cameras: COLMAP undistorted intrinsics/poses, transformed into the viewer's Y-up frame. Images: 24, used for training; no held-out evaluation.

Brush settings: 6,000 steps, max resolution 960, SH degree 2, max splats 600,000, refinement every 150 steps, growth stop at 4,000. Final export: 436,961 Gaussians. Renderer: Spark 2.1.0 with Three.js r180. Opacity and ceiling cut are supported. GS provides appearance, not collision geometry. Blur, floaters and poor unobserved views remain; no claim of measured geometric accuracy.

Preparation script: parent workspace `work/gs/prepare.py`; input dataset: `work/gs/dataset/`; exports at steps 2,000/4,000/6,000: `work/gs/trained/`. Original photos are not included in the web directory. Spark's MIT license is included in `vendor/SPARK-LICENSE.txt`; Three's license is already in `vendor/LICENSE.txt`.
