# Gaussian delivery compression

3D Gaussian files are encoded as SPZ using the bundled Spark transcodeSpz implementation. All Gaussians retained, original SH degrees retained(3 for RaDe/PGSR,2 for Brush), fractionalBits12, opacity threshold0. Coordinate clipping count0. SPZ is lossy quantization, not lossless. Decoded position maximum error0.211mm; this measures coordinates only, not total appearance error. Color/opacity/scale/rotation/SH quantization can alter appearance. Same-view RaDe screenshots showed some furniture shading/detail differences; original PLY files remain available in repository for recovery. Renderer initialization and splat counts verified locally for all methods.

2DGS uses KSplat compression level1, preserving its original TwoD renderer and SH degree2. All283503surfels retained.

|Model|Original bytes|Compressed bytes|
|---|---:|---:|
|RaDe SPZ|186540931|19173738|
|PGSR SPZ|120448931|13221219|
|Brush SPZ|66419098|8704841|
|2DGS KSplat|41959471|20430652|

Total415368431 ->61530450bytes,85.19%reduction in selected GS payloads. Original assets retained but no longer fetched by default. Network savings do not imply equivalent GPU memory/render speed improvements.
