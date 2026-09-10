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

## Dalgu walk mode

The user-supplied Dalgu OBJ and PBR maps are converted to `dalgu.glb` with
embedded diffuse, normal and metallic/roughness textures. The original shape is
preserved and uniformly scaled to one metre. `dalgu.js` loads this asset.
The supplied OBJ has no skeleton or animation, so navigation translates/turns
the character in its supplied pose rather than animating individual limbs.
Select 달구 시점 for first person or 따라가기 to see the character from behind.
WASD / arrow keys move relative to heading; click the canvas to capture the mouse,
then move it to look around. Escape releases the mouse. Drag-to-look works when
pointer lock is unavailable. Character height is fixed at 1.0 metre. The supplied proportions are preserved; mouse look turns the camera.
둘러보기로 returns to the previous orbit view; the reset button restores a clear spawn.

Movement uses a fixed-height circle against individual furniture mesh bounds and room
limits, with sliding and small movement steps. This is navigation collision, not rigid-body
physics: furniture cannot be pushed. MVS/Pointcloud use the same 3D model collision proxy.
The character is hidden in first person to avoid the face obscuring the camera.

To continue on another computer, clone this repository, serve it with Python as above,
and edit `dalgu.js`, `viewer.js`, or `index.html`. Pushing main updates GitHub Pages.

## MVS fusion comparison
The MVS selector preserves original mvs.glb and compares mvs-balanced.glb
(default for MVS) and mvs-complete.glb. Both reuse 24 camera poses and 1600px
geometric depth maps. Only fusion tolerances change, followed by the same crop,
neighborhood cleanup, Poisson depth 10/trim 7, distance filtering 0.14,
300000-face simplification and photo texturing. See mvs-comparison.json.
More occupied voxels do not imply accurate new surfaces. Large wall/floor gaps
remain. No higher-resolution PatchMatch run was made.
