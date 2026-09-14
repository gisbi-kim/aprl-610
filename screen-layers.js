export function screenLayerRoot() {
  let root=document.getElementById('sceneScreenLayers');
  if(!root){root=document.createElement('div');root.id='sceneScreenLayers';Object.assign(root.style,{position:'fixed',inset:'0',zIndex:'0',pointerEvents:'none'});document.body.prepend(root);}
  return root;
}

export function orderScreenLayer(layer,center,camera) {
  const depth=center.clone().applyMatrix4(camera.matrixWorldInverse).z;
  layer.style.zIndex=String(Math.max(0,100000+Math.round(depth*100)));
}
