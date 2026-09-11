# LingBot-only small-hole repair (local experiment)

Original assets are preserved. Choose **MVS → LingBot only · 작은 구멍 보정** to compare with **LingBot only · 표면**.

The untextured input mesh contains 449,999 faces. Closed, non-branching boundary loops are projected into a local PCA plane and triangulated using ear clipping. Limits: 20 cm bounding diagonal, 85 cm perimeter, 0.025 m² area, 100 boundary edges, and at most 15 mm plane deviation (also limited to 12% of diagonal). This closes 36 holes using 229 new triangles. Original vertex positions and original triangles are unchanged; no global smoothing is applied.

Much of the black speckling was missing texture rather than missing geometry: 155,964 original faces had degenerate (0,0) UV coordinates. After retexturing the repaired mesh with the original aligned photo cameras, 45,431 unassigned faces receive nearby photographic colors. Small connected patches must fit within 25 cm and 0.035 m². Narrow defects connected to larger missing regions require their centroids to lie within 18 mm of known texture. Interpolation is bounded to 10 cm for small isolated patches and 35 mm for narrow defects, with a normal-similarity threshold. glTF vertex colors are exported in linear color space.

Final mesh: 450,228 faces. Large openings and uncertain texture regions remain; this is conservative local interpolation, not newly observed geometry. Existing LingBot-only and image-based reconstruction variants remain available.

Validation: original geometry invariance assertions, unchanged total face count through export, local browser load, and before/after screenshots from identical camera coordinates. Screenshots and scripts are in `work/lingbot-surface/repaired` and `work/lingbot-surface`. Nothing was pushed or published.

Heavy jobs were sequential: the G4Splat build container was paused throughout reconstruction/texturing and resumed only after mesh processing ended.
