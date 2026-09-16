import * as THREE from './vendor/three.module.js';

export function installMacBook(viewer) {
  const {cute, camera, renderer} = viewer;
  const base = cute.getObjectByName('MacBook_Base');
  const lid = cute.getObjectByName('MacBook_Lid');
  const joint = cute.getObjectByName('MacBook_Hinge');
  if (!base || !lid || !joint) return;
  cute.updateMatrixWorld(true);

  // The shell's yaw is baked into its vertices; the hinge retains that rotation.
  const frame = new THREE.Group();
  frame.name = 'MacBook_Frame';
  frame.position.copy(cute.worldToLocal(joint.getWorldPosition(new THREE.Vector3())));
  frame.quaternion.copy(cute.getWorldQuaternion(new THREE.Quaternion()).invert()
    .multiply(joint.getWorldQuaternion(new THREE.Quaternion())));
  cute.add(frame);
  const hinge = new THREE.Group();
  hinge.name = 'MacBook_Lid_Pivot';
  frame.add(hinge);
  frame.updateMatrixWorld(true);
  for (const name of ['MacBook_Lid', 'MacBook_Lid_Seam', 'MacBook_Apple', 'MacBook_Apple_Leaf']) {
    const part = cute.getObjectByName(name);
    if (part) hinge.attach(part);
  }

  const interior = new THREE.Group();
  interior.name = 'MacBook_Keyboard_Deck';
  frame.add(interior);
  const dark = new THREE.MeshStandardMaterial({color:0x20252a, roughness:.65});
  const silver = new THREE.MeshStandardMaterial({color:0x9ca6ad, metalness:.55, roughness:.42});
  function box(name, size, position, material, parent=interior) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box('MacBook_Keyboard_Well', [.253,.0005,.096], [0,.0008,.065], dark);
  const keyMaterial = new THREE.MeshStandardMaterial({color:0x42484d, roughness:.7});
  for (let row=0; row<5; row++) {
    for (let col=0; col<14; col++) {
      box('MacBook_Key', [.015,.0007,.014], [(col-6.5)*.0175,.0014,.026+row*.017], keyMaterial);
    }
  }
  box('MacBook_Spacebar', [.09,.0007,.012], [0,.0014,.106], keyMaterial);
  box('MacBook_Trackpad_Border', [.114,.0004,.064], [0,.00075,.156], dark);
  box('MacBook_Trackpad', [.112,.0005,.062], [0,.001,.156], silver);
  for (const x of [-.136,.136]) {
    for (let row=0; row<18; row++) {
      box('MacBook_Speaker_Grille', [.005,.0004,.0013], [x,.001,.023+row*.0048], dark);
    }
  }

  const screenBack = box('MacBook_Screen_Bezel', [.285,.0006,.194], [0,.00015,.102], dark, hinge);
  const wallpaper = document.createElement('canvas');
  wallpaper.width=960; wallpaper.height=600;
  const ctx=wallpaper.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,960,600);
  gradient.addColorStop(0,'#142e59'); gradient.addColorStop(.5,'#306c96'); gradient.addColorStop(1,'#71bcad');
  ctx.fillStyle=gradient; ctx.fillRect(0,0,960,600);
  for (let i=0;i<3;i++) {
    ctx.fillStyle=['#398bab','#59b0b2','#86cbb8'][i];
    ctx.beginPath(); ctx.moveTo(0,410+i*45);
    ctx.bezierCurveTo(270,160+i*65,570,620-i*70,960,250+i*90);
    ctx.lineTo(960,600); ctx.lineTo(0,600); ctx.fill();
  }
  ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.font='500 64px sans-serif';
  ctx.fillText('APRL',480,250); ctx.font='22px sans-serif'; ctx.fillText('610',480,290);
  ctx.fillStyle='#ffffff38'; ctx.fillRect(320,536,320,44);
  for (let i=0;i<6;i++) {
    ctx.fillStyle=['#63adf3','#e8ebef','#7ccaad','#f1bd72','#b9a0db','#e67f86'][i];
    ctx.fillRect(334+i*50,545,30,26);
  }
  const texture=new THREE.CanvasTexture(wallpaper);
  texture.colorSpace=THREE.SRGBColorSpace;
  const screenMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.267,.167),screenMaterial);
  screen.name='MacBook_Display'; screen.rotation.x=Math.PI/2;
  screen.position.set(0,-.0002,.106); hinge.add(screen);

  const button=document.createElement('button');
  button.id='macbookToggle'; button.type='button'; button.hidden=true;
  button.setAttribute('aria-expanded','false');
  Object.assign(button.style,{position:'fixed',left:'24px',top:'174px',zIndex:'5',padding:'9px 14px',fontSize:'12px',background:'#fffffff0',boxShadow:'0 2px 12px #30403820'});
  document.body.append(button);
  let opened=false, angle=0;
  function toggle() {
    if (viewer.mode!=='cute' || document.pointerLockElement) return;
    opened=!opened;
    button.setAttribute('aria-expanded',String(opened));
  }
  button.addEventListener('click',toggle);

  const canvas=renderer.domElement, ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const viewport=new THREE.Vector4(), renderSize=new THREE.Vector2();
  function pick(x,y) {
    const r=canvas.getBoundingClientRect();
    renderer.getViewport(viewport); renderer.getSize(renderSize);
    const px=(x-r.left)*renderSize.x/r.width, py=(r.bottom-y)*renderSize.y/r.height;
    if(px<viewport.x||px>viewport.x+viewport.z||py<viewport.y||py>viewport.y+viewport.w)return false;
    pointer.set((px-viewport.x)/viewport.z*2-1,(py-viewport.y)/viewport.w*2-1);
    camera.updateMatrixWorld(true); cute.updateMatrixWorld(true);
    ray.setFromCamera(pointer,camera);
    const targets=[];
    cute.traverseVisible(o=>{if(o.isMesh)targets.push(o);});
    const hit=ray.intersectObjects(targets,false)[0];
    return !!hit && hit.object.name.startsWith('MacBook_');
  }
  let down=null;
  const pointers=new Set();
  canvas.addEventListener('pointerdown',e=>{
    pointers.add(e.pointerId);
    down=e.button===0&&pointers.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;
  });
  canvas.addEventListener('pointermove',e=>{
    if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>=5)down.moved=true;
    if(!pointers.size&&viewer.mode==='cute'&&!document.pointerLockElement&&pick(e.clientX,e.clientY))canvas.style.cursor='pointer';
  });
  canvas.addEventListener('pointerup',e=>{
    pointers.delete(e.pointerId);
    if(down&&!down.moved&&e.pointerId===down.id&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&viewer.mode==='cute'&&!document.pointerLockElement&&pick(e.clientX,e.clientY))toggle();
    down=null;
  });
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
  const anchor=base.getWorldPosition(new THREE.Vector3()), projected=new THREE.Vector3();
  return {
    toggle, hinge, frame, screen, interior,
    get opened(){return opened;}, get angle(){return angle;},
    tick(dt) {
      const target=opened?-THREE.MathUtils.degToRad(110):0;
      // Keep this user-triggered hinge motion continuous on every device.
      angle=THREE.MathUtils.damp(angle,target,8,Math.min(dt,.05));
      if(Math.abs(angle-target)<.0001)angle=target;
      hinge.rotation.x=angle;
      interior.visible=screenBack.visible=screen.visible=Math.abs(angle)>.025;
      const korean=document.documentElement.lang.startsWith('ko');
      const label=korean?(opened?'맥북 닫기':'맥북 열기'):(opened?'Close MacBook':'Open MacBook');
      if(button.textContent!==label)button.textContent=label;
      projected.copy(anchor).project(camera);
      button.hidden=!(viewer.mode==='cute'&&!document.pointerLockElement&&camera.position.distanceTo(anchor)<3.2&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.9&&projected.z>-1&&projected.z<1);
      if(!button.hidden) {
        renderer.getViewport(viewport); renderer.getSize(renderSize);
        const r=canvas.getBoundingClientRect();
        button.style.left=(r.left+viewport.x*r.width/renderSize.x+18)+'px';
        button.style.top=(r.bottom-(viewport.y+viewport.w)*r.height/renderSize.y+62)+'px';
      }
    }
  };
}
