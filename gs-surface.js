import * as THREE from './vendor/three.module.js';

// Use perspective-correct 2D surfel rendering, rather than treating surfels as 3D ellipsoids.
export async function loadSurfaceGS(renderer, camera) {
  const { DropInViewer, SplatRenderMode, SceneRevealMode, SceneFormat } = await import('./vendor/gaussian-splats-3d.module.js');
  const group = new DropInViewer({
    splatRenderMode: SplatRenderMode.TwoD,
    sphericalHarmonicsDegree: 1,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    integerBasedSort: false,
    enableOptionalEffects: true,
    sceneRevealMode: SceneRevealMode.Instant,
  });
  // The room uses an inset viewport, not the entire canvas.
  const viewport = new THREE.Vector4();
  group.viewer.getRenderDimensions = dimensions => {
    renderer.getViewport(viewport);
    dimensions.set(viewport.z, viewport.w);
  };
  await group.addSplatScene('surface-gs-half.ksplat?v=half1', { format: SceneFormat.KSplat, showLoadingUI: false, splatAlphaRemovalThreshold: 1 });
  const material = group.splatMesh.material;
  material.uniforms.cutRoof = { value: 1 };
  material.vertexShader = 'uniform float cutRoof;\n' + material.vertexShader.replace(
    'vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));',
    `vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));
     if(cutRoof > 0.5 && splatCenter.y > 2.59){gl_Position=vec4(0.,0.,2.,1.);return;}`,
  );
  material.needsUpdate = true;
  group.setAppearance = (opacity, cut) => {
    group.splatMesh.getScene(0).opacity = opacity;
    material.uniforms.cutRoof.value = cut ? 1 : 0;
  };
  group.visible = false;
  return group;
}
