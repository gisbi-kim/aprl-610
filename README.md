# APRL 610 — public viewer

Serve this directory only: `python -m http.server 8612 --bind 127.0.0.1`.
The directory is ready for static hosting; no server-side computation is needed.

Default: 3D model, window viewpoint, confidence 6.5, point size 3.5,
camera locations visible, cutaway enabled. Reload restores these defaults.

Tabs: 3D 모델 / MVS / Pointcloud. The MVS model was reconstructed using
COLMAP SfM, multi-view stereo, Poisson surface reconstruction and texture mapping.
The pointcloud was generated with LingBot-Map; the UI uses a generic representation name.
Three.js is distributed under the included MIT license.

No original/reference photos, embedded photo gallery, PLY files, Blender source,
or old private archives are included. GLB texture atlases needed to display the
MVS reconstruction remain. The pointcloud binary is necessary for rendering and
is accessible to browsers; removing PLY download is not a copy-protection feature.

Publish only this directory, not the original reconstruction workspace or private repository.
