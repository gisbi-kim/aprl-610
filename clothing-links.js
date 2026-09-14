import * as THREE from './vendor/three.module.js';

export function installClothingLinks(viewer) {
  const {scene,cute,camera,renderer}=viewer, canvas=renderer.domElement;
  const links=new Map();
  cute.traverse(object=>{
    if(!object.isMesh||/_(Hanger|Hook)$/.test(object.name))return;
    if(object.name.startsWith('ICRA_TShirt_'))links.set(object,'https://2027.ieee-icra.org/');
    else if(object.name.startsWith('Cabinet_DGIST_Jacket_')||object.name.startsWith('Jacket_'))links.set(object,'https://www.dgist.ac.kr/');
  });
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),viewport=new THREE.Vector4(),size=new THREE.Vector2();
  function pick(x,y) {
    if(viewer.mode!=='cute'||document.pointerLockElement)return null;
    const rect=canvas.getBoundingClientRect();
    renderer.getViewport(viewport);renderer.getSize(size);
    const px=(x-rect.left)*size.x/rect.width,py=(rect.bottom-y)*size.y/rect.height;
    if(px<viewport.x||px>viewport.x+viewport.z||py<viewport.y||py>viewport.y+viewport.w)return null;
    pointer.set((px-viewport.x)/viewport.z*2-1,(py-viewport.y)/viewport.w*2-1);
    camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
    ray.setFromCamera(pointer,camera);
    const visible=[];
    scene.traverse(object=>{
      if(!object.isMesh||!object.visible)return;
      let parent=object.parent;
      while(parent&&parent.visible)parent=parent.parent;
      if(!parent)visible.push(object);
    });
    return links.get(ray.intersectObjects(visible,false)[0]?.object)||null;
  }
  let down=null;
  const pointers=new Set();
  canvas.addEventListener('pointerdown',event=>{
    pointers.add(event.pointerId);
    down=event.button===0&&pointers.size===1?{
      id:event.pointerId,x:event.clientX,y:event.clientY,
      url:pick(event.clientX,event.clientY),moved:false
    }:null;
  });
  canvas.addEventListener('pointermove',event=>{
    if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>=5)down.moved=true;
    if(!pointers.size&&pick(event.clientX,event.clientY))canvas.style.cursor='pointer';
  });
  canvas.addEventListener('pointerup',event=>{
    if(down?.url&&!down.moved&&down.id===event.pointerId&&
       Math.hypot(event.clientX-down.x,event.clientY-down.y)<5&&
       pick(event.clientX,event.clientY)===down.url) {
      window.open(down.url,'_blank','noopener,noreferrer');
    }
    down=null;
  });
  for(const type of ['pointerup','pointercancel'])window.addEventListener(type,event=>{
    pointers.delete(event.pointerId);down=null;
  });
  window.addEventListener('blur',()=>{pointers.clear();down=null;});
}
