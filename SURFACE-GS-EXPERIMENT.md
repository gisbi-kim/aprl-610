# Surface-constrained 2DGS — local experiment, 2026-09-11

The GS tab now defaults to **2DGS · 표면 제약**. **기존 3DGS · Brush** remains available in the GS comparison selector. Initial page load still selects 3D model. No remote push or deployment was performed.

This is a custom geometry-guided trainer built on gsplat 1.5.3's CUDA `rasterization_2dgs`, not a reproduction of the full PGSR or G4Splat pipeline. The browser uses GaussianSplats3D 0.4.7 in `SplatRenderMode.TwoD`; the original Brush model still uses Spark.

## Data and training

- 283,503 initial oriented surfels: 164,533 from fused MVS and 118,970 from conservative, multi-view/free-space-checked LingBot additions, voxelized at 1.8 cm.
- MVS/LingBot normals orient the two tangent axes. Initial tangent radii derive from nearest-neighbor distances. Fixed dense surfel set; no densification in this experiment.
- Floor detection selects near-horizontal samples around the dominant floor height, y = 0.03127 m. Only these 14,388 floor samples receive explicit floor position/orientation constraints; furniture is not flattened.
- 24 undistorted photographs, 800 × 595, fixed COLMAP cameras. 6,000 steps with Adam; SH degree grows to 2.
- Losses: RGB L1/SSIM; projected reliable depth; surface-normal anchor; depth-derived normal consistency; 2DGS distortion; floor-plane constraints; tangent aspect ratio regularization. Tangent radii bounded to 3–65 mm.
- Depth priors use nearest projected verified surface samples, with discontinuities rejected. MVS receives weight 1; LingBot receives weight 0.35.

## Results and limits

The same indoor viewing direction shows a substantially smoother floor, with fewer needle-like streaks than the initial Brush model. Holes remain at windows, occlusions and low-evidence regions. Fine furniture appearance remains imperfect. Filling holes by stretching unsupported surfaces is deliberately discouraged by this objective.

Tangent-axis ratio percentiles (50/90/99): 1.19 / 2.00 / 4.47. Two tagged floor surfels exceed ratio 10. The floor anchor residual is tiny **because of the imposed constraint**, and is not a measurement of reconstruction accuracy. Counts are not directly comparable with the original 3DGS because the representation and initialization differ.

`surface-gs-report.json` contains diagnostic PSNR/depth errors on four **training views**; no held-out or ground-truth evaluation was performed. Neither these metrics nor the floor constraint certify robot collision accuracy. GS remains visual geometry; the existing navigation collider is separate.

## Reproduce locally

Scripts and artifacts in the parent workspace:

- `work/gs2/prepare.py` → `work/gs2/data/`
- `work/gs2/train.py --steps 6000` → `work/gs2/trained/`
- Checkpoints and PLY exports at 2,000/4,000/6,000 steps are retained.
- Runtime: official Python.org embedded 3.10.11, PyTorch 2.4.1+cu124, official gsplat 1.5.3+pt24cu124 Windows wheel, NumPy 1.26.4.
- Python executable: `work/gs2/python-official/python.exe`; packages are in `work/gs2/env/Lib/site-packages`. The alternate managed Python runtime was rejected by Windows and is not used.

The browser's inset viewport is passed to the renderer to keep camera geometry consistent. Ceiling clipping and opacity controls apply to both GS variants. Third-party renderer license is in `vendor/GAUSSIAN-SPLATS-3D-LICENSE.txt`.
