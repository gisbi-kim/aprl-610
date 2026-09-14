import * as THREE from './vendor/three.module.js';

export function installFridge(viewer) {
  const {cute, camera, renderer} = viewer;
  const body = cute.getObjectByName('Fridge_Body');
  const door = cute.getObjectByName('Fridge_Door');
  if (!body || !door) return;
  cute.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(body);
  const doorBounds = new THREE.Box3().setFromObject(door);
  const {min, max} = bounds, cx = (min.x + max.x) / 2;
  const front = min.z, back = max.z;
  body.visible = false;
  const interior = new THREE.Group();
  interior.name = 'Fridge_Interior';
  cute.add(interior);
  const white = new THREE.MeshStandardMaterial({color:0xf1f4f1, roughness:.55});
  const lining = new THREE.MeshStandardMaterial({color:0xe4eeec, roughness:.65, emissive:0xcce5df, emissiveIntensity:.12});
  const silver = new THREE.MeshStandardMaterial({color:0xb7c4c5, metalness:.7, roughness:.3});
  const plastic = new THREE.MeshStandardMaterial({color:0xb5dce7, roughness:.28, metalness:.05});
  const blue = new THREE.MeshStandardMaterial({color:0x317cac, roughness:.45});
  const red = new THREE.MeshStandardMaterial({color:0xb92e34, roughness:.35, metalness:.25});
  const green = new THREE.MeshStandardMaterial({color:0x4b9471, roughness:.35, metalness:.25});
  function mesh(name, geometry, material, p, parent=interior) {
    const m = new THREE.Mesh(geometry, material);
    m.name = name; m.position.set(...p); m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  function box(name, p, size, material=lining, parent=interior) {
    return mesh(name, new THREE.BoxGeometry(...size), material, p, parent);
  }
  const width = max.x-min.x, height = max.y-min.y, depth = back-front;
  box('Fridge_Liner_Left',[min.x+.017,(min.y+max.y)/2,(front+back)/2],[.034,height,depth],white);
  box('Fridge_Liner_Right',[max.x-.017,(min.y+max.y)/2,(front+back)/2],[.034,height,depth],white);
  box('Fridge_Liner_Back',[cx,(min.y+max.y)/2,back-.022],[width-.068,height,.044]);
  box('Fridge_Liner_Top',[cx,max.y-.02,(front+back)/2],[width,.04,depth],white);
  box('Fridge_Liner_Bottom',[cx,min.y+.042,(front+back)/2],[width,.084,depth],white);
  for (const y of [.42,.81,1.20]) {
    box('Fridge_Shelf',[cx,y,front+.20],[width-.073,.018,.345]);
    box('Fridge_Shelf_Edge',[cx,y,front+.029],[width-.073,.022,.018],white);
  }
  const glow = new THREE.MeshStandardMaterial({color:0xf5fff8,emissive:0xc8ffe7,emissiveIntensity:.75});
  box('Fridge_Light_Strip',[cx,max.y-.044,front+.10],[width-.15,.012,.035],glow);
  const light = new THREE.PointLight(0xe1fff0,.16,.85,2);
  light.position.set(cx,1.39,front+.14); interior.add(light);

  function label(text, color) {
    const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=128;
    const ctx=canvas.getContext('2d'); ctx.fillStyle=color; ctx.fillRect(0,0,512,128);
    ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.font='bold 30px sans-serif';
    for(const x of [128,384]) {ctx.fillText(text,x,57);ctx.font='18px sans-serif';ctx.fillText(text==='WATER'?'500 mL':text==='COLA'?'355 mL':'330 mL',x,89);ctx.font='bold 30px sans-serif';}
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({map:texture,roughness:.5});
  }
  const waterLabel=label('WATER','#438dae'), colaLabel=label('COLA','#bd3039'), sparklingLabel=label('SPARKLING','#428064');
  const bottleShape=new THREE.LatheGeometry([[0,0],[.025,0],[.032,.012],[.032,.15],[.027,.172],[.014,.19],[.014,.207],[0,.207]].map(([x,y])=>new THREE.Vector2(x,y)),16);
  const bottleBand=new THREE.CylinderGeometry(.0325,.0325,.064,16);
  const bottleCap=new THREE.CylinderGeometry(.0155,.0155,.019,16);
  const canShape=new THREE.CylinderGeometry(.029,.029,.115,20);
  const canBand=new THREE.CylinderGeometry(.0295,.0295,.09,20);
  const canLid=new THREE.CylinderGeometry(.0275,.0275,.004,20);
  for(let row=0;row<2;row++) for(let col=0;col<4;col++) {
    const x=cx+(col-1.5)*.105, z=front+.10+row*.15, y=1.209;
    const g=new THREE.Group();g.name='Fridge_Water_500ml';g.position.set(x,y,z);interior.add(g);
    mesh('Water_Bottle',bottleShape,plastic,[0,0,0],g);
    mesh('Water_Label',bottleBand,waterLabel,[0,.097,0],g);
    mesh('Water_Cap',bottleCap,blue,[0,.210,0],g);
  }
  for(const [name,y,material,band] of [['Cola',.429,red,colaLabel],['Sparkling_Water',.819,green,sparklingLabel]]) {
    for(let row=0;row<2;row++) for(let col=0;col<4;col++) {
      const g=new THREE.Group();g.name='Fridge_'+name;g.position.set(cx+(col-1.5)*.105,y,front+.10+row*.15);interior.add(g);
      mesh(name+'_Can',canShape,material,[0,.0575,0],g);
      mesh(name+'_Label',canBand,band,[0,.0575,0],g);
      mesh(name+'_Lid',canLid,silver,[0,.116,0],g);
      box(name+'_Tab',[0,.120,-.004],[.009,.003,.016],silver,g);
    }
  }

  const hinge=new THREE.Group();hinge.name='Fridge_Door_Hinge';
  hinge.position.set(doorBounds.max.x,0,doorBounds.max.z);cute.add(hinge);
  for(const name of ['Fridge_Door','Fridge_Handle','Fridge_Door_Seam']) {
    const part=cute.getObjectByName(name);if(part)hinge.attach(part);
  }
  box('Fridge_Door_Liner',[cx,.86,doorBounds.max.z+.008],[width-.075,1.47,.016],lining);
  hinge.attach(cute.getObjectByName('Fridge_Door_Liner'));
  let opened=false, angle=0;
  const canvas=renderer.domElement, ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const button=document.createElement('button');button.id='fridgeToggle';button.type='button';
  Object.assign(button.style,{position:'fixed',right:'24px',bottom:'24px',zIndex:'4',padding:'9px 14px',fontSize:'12px',background:'#fffffff0',boxShadow:'0 2px 12px #30403820'});
  document.body.append(button);
  const korean=()=>document.documentElement.lang.startsWith('ko');
  function toggle(){opened=!opened;button.setAttribute('aria-expanded',String(opened));}
  button.addEventListener('click',toggle);
  const viewport=new THREE.Vector4(), renderSize=new THREE.Vector2();
  function pick(x,y) {
    const r=canvas.getBoundingClientRect();
    renderer.getViewport(viewport);renderer.getSize(renderSize);
    // The scene occupies a sub-viewport below the header and beside the menu.
    // Both renderer APIs use logical pixels; convert CSS coordinates once, with
    // the viewport's bottom-left origin, independently of device pixel ratio.
    const px=(x-r.left)*renderSize.x/r.width, py=(r.bottom-y)*renderSize.y/r.height;
    if(px<viewport.x||px>viewport.x+viewport.z||py<viewport.y||py>viewport.y+viewport.w)return false;
    pointer.set((px-viewport.x)/viewport.z*2-1,(py-viewport.y)/viewport.w*2-1);
    camera.updateMatrixWorld(true);cute.updateMatrixWorld(true);
    ray.setFromCamera(pointer,camera);
    // Respect intervening furniture and cutaway visibility.
    const targets=[];cute.traverse(o=>{if(o.isMesh&&o.visible){let p=o.parent;while(p&&p.visible)p=p.parent;if(!p)targets.push(o);}});
    const hit=ray.intersectObjects(targets,false)[0];if(!hit)return false;
    for(let p=hit.object;p;p=p.parent)if(p===hinge)return true;
    return false;
  }
  let down=null;
  const pointers=new Set();
  canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);down=e.button===0&&pointers.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;});
  canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(down&&!down.moved&&e.pointerId===down.id&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&viewer.mode==='cute'&&!document.pointerLockElement&&pick(e.clientX,e.clientY))toggle();down=null;});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
  canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>=5)down.moved=true;if(!pointers.size)canvas.style.cursor=viewer.mode==='cute'&&!document.pointerLockElement&&pick(e.clientX,e.clientY)?'pointer':'';});
  const anchor=new THREE.Vector3(cx,.95,front-.05), projected=new THREE.Vector3();
  button.setAttribute('aria-expanded','false');
  return {
    toggle, get opened(){return opened;}, get angle(){return angle;}, hinge, interior,
    tick(dt) {
      angle=THREE.MathUtils.damp(angle,opened?-Math.PI*.55:0,8,Math.min(dt,.05));
      if(Math.abs(angle-(opened?-Math.PI*.55:0))<.0001)angle=opened?-Math.PI*.55:0;
      hinge.rotation.y=angle;
      light.visible=Math.abs(angle)>.08;
      const label=korean()?(opened?'냉장고 닫기':'냉장고 열기'):(opened?'Close fridge':'Open fridge');
      if(button.textContent!==label)button.textContent=label;
      projected.copy(anchor).project(camera);
      const visible=viewer.mode==='cute'&&!document.pointerLockElement&&camera.position.z<front&&camera.position.distanceTo(anchor)<3.2&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.9&&projected.z<1;
      if(button.hidden===visible)button.hidden=!visible;
    }
  };
}
