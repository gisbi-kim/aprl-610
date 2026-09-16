import * as THREE from './vendor/three.module.js';
import {screenLayerRoot,orderScreenLayer} from './screen-layers.js';

export const GAME_URL='https://gisbi-kim.github.io/turtle-mapper/';
const GAME_ORIGIN=new URL(GAME_URL).origin;
const GAME_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyP','KeyR','KeyL','Enter','Escape']);

export function installMacBookGame(viewer,screen,isOpen) {
  const {camera,renderer,controls}=viewer,canvas=renderer.domElement;
  const width=.267,height=.167,pxWidth=960,pxHeight=600;
  const originalMaterial=screen.material,originalOrder=screen.renderOrder;
  // The transparent, depth-writing screen exposes the projected HTML underneath
  // the WebGL canvas while furniture in front still occludes it correctly.
  const holeMaterial=new THREE.MeshBasicMaterial({color:0,opacity:0,transparent:true,blending:THREE.NoBlending,depthWrite:true});
  const layer=document.createElement('div');layer.id='macbookGameLayer';layer.hidden=true;
  Object.assign(layer.style,{position:'fixed',inset:'0',overflow:'hidden',pointerEvents:'none'});screenLayerRoot().append(layer);
  const surface=document.createElement('div');
  Object.assign(surface.style,{position:'absolute',left:'0',top:'0',width:pxWidth+'px',height:pxHeight+'px',transformOrigin:'0 0',background:'#091219',pointerEvents:'none'});layer.append(surface);
  const frame=document.createElement('iframe');frame.id='macbookGameFrame';frame.title='꼬부기 LiDAR 탐사';
  frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.tabIndex=-1;
  Object.assign(frame.style,{border:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none'});surface.append(frame);
  const panel=document.createElement('div');panel.id='macbookGameControls';panel.hidden=true;
  Object.assign(panel.style,{position:'fixed',left:'18px',top:'216px',zIndex:'5',display:'flex',gap:'6px',maxWidth:'calc(100vw - 36px)',flexWrap:'wrap'});
  const play=document.createElement('button');play.type='button';
  const external=document.createElement('a');external.className='btn';external.href=GAME_URL;external.target='_blank';external.rel='noopener';external.textContent='게임 새 창';
  panel.append(play,external);document.body.append(panel);
  let requested=false,ready=false,focused=false,showing=false,lastHost=null,saved=null,travel=null,heldPointer=null;
  const vp=new THREE.Vector4(),size=new THREE.Vector2(),pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
  const center=new THREE.Vector3(),normal=new THREE.Vector3(),up=new THREE.Vector3();
  const basis=new THREE.Matrix4().set(width/pxWidth,0,0,-width/2,0,-height/pxHeight,0,height/2,0,0,1,0,0,0,0,1);
  const worldBasis=new THREE.Matrix4(),matrix=new THREE.Matrix4(),css=new Array(16).fill(0);
  function send(message){frame.contentWindow?.postMessage(message,GAME_ORIGIN);}
  function host(){send({type:'turtle:host',visible:showing});lastHost=showing;}
  frame.addEventListener('load',host);
  function release(restore=true) {
    send({type:'turtle:release'});focused=false;heldPointer=null;
    if(saved){controls.enabled=saved.enabled;controls.enableDamping=saved.damping;
      if(restore){camera.position.copy(saved.position);controls.target.copy(saved.target);camera.fov=saved.fov;camera.updateProjectionMatrix();controls.update();}
    }
    saved=null;travel=null;
  }
  function focus() {
    if(focused||!ready||!showing||viewer.dalgu?.active||document.pointerLockElement)return;
    focused=true;
    saved={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,enabled:controls.enabled,damping:controls.enableDamping};
    controls.enabled=false;controls.enableDamping=false;
    const distance=Math.max(.33,height*1.25/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)),width*1.25/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect));
    travel={position:center.clone().addScaledVector(normal,distance),target:center.clone()};
    canvas.tabIndex=0;canvas.focus({preventScroll:true});send({type:'turtle:activate'});
  }
  play.addEventListener('click',()=>focused?release():focus());
  window.addEventListener('message',e=>{
    if(e.source!==frame.contentWindow||e.origin!==GAME_ORIGIN)return;
    if(e.data?.type==='turtle:ready'){ready=true;}
    if(e.data?.type==='turtle:release')release();
  });
  function hit(x,y) {
    if(!showing||!ready||document.pointerLockElement||viewer.dalgu?.active)return null;
    renderer.getViewport(vp);renderer.getSize(size);const r=canvas.getBoundingClientRect();
    const sx=(x-r.left)*size.x/r.width,sy=(r.bottom-y)*size.y/r.height;
    if(sx<vp.x||sx>vp.x+vp.z||sy<vp.y||sy>vp.y+vp.w)return null;
    pointer.set((sx-vp.x)/vp.z*2-1,(sy-vp.y)/vp.w*2-1);
    camera.updateMatrixWorld(true);viewer.scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
    const targets=[];viewer.scene.traverseVisible(o=>{if(o.isMesh)targets.push(o);});
    const first=ray.intersectObjects(targets,false)[0];return first?.object===screen?first:null;
  }
  const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const picked=hit(e.clientX,e.clientY);
    if(!picked){if(focused)release();return;}
    consume(e);focus();heldPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);
    send({type:'turtle:pointer',down:true,x:picked.uv.x,y:1-picked.uv.y});
  },true);
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{
    if(heldPointer!==e.pointerId)return;consume(e);heldPointer=null;
    send({type:'turtle:pointer',down:false});
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  },true);
  canvas.addEventListener('pointermove',e=>{if(heldPointer!==null){consume(e);return;}if(hit(e.clientX,e.clientY))canvas.style.cursor='pointer';});
  canvas.addEventListener('wheel',e=>{if(focused)consume(e);},{capture:true,passive:false});
  window.addEventListener('keydown',e=>{
    if(!focused||!GAME_KEYS.has(e.code)||e.ctrlKey||e.metaKey||e.altKey)return;consume(e);
    if(e.code==='Escape'){release();return;}
    send({type:'turtle:key',code:e.code,down:true,repeat:e.repeat});
  },true);
  window.addEventListener('keyup',e=>{if(focused&&GAME_KEYS.has(e.code)){consume(e);send({type:'turtle:key',code:e.code,down:false});}},true);
  window.addEventListener('blur',()=>{if(focused)release();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&focused)release();});
  return {
    frame,focus,release,get ready(){return ready;},get focused(){return focused;},
    tick(dt) {
      screen.updateWorldMatrix(true,false);screen.getWorldPosition(center);
      normal.set(0,0,1).transformDirection(screen.matrixWorld);up.copy(camera.position).sub(center);
      showing=isOpen()&&viewer.mode==='cute'&&normal.dot(up)>.015;
      if(showing&&!requested){requested=true;frame.src=GAME_URL+'?embed=1';}
      if(requested&&lastHost!==showing)host();
      if(!showing&&focused)release();
      layer.hidden=!showing;screen.material=showing?holeMaterial:originalMaterial;screen.renderOrder=showing?-100:originalOrder;
      const projected=center.clone().project(camera);
      panel.hidden=!(showing&&camera.position.distanceTo(center)<3.2&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.9&&projected.z<1&&!viewer.dalgu?.active&&!document.pointerLockElement);
      play.disabled=!ready;play.textContent=focused?'Esc · 게임 조작 끝내기':ready?'화면 클릭 · 게임 조작':'게임 불러오는 중…';
      if(!showing)return;
      if(focused&&travel){const t=1-Math.exp(-10*Math.min(dt,.05));camera.position.lerp(travel.position,t);controls.target.lerp(travel.target,t);camera.lookAt(controls.target);}
      renderer.getViewport(vp);renderer.getSize(size);camera.updateMatrixWorld(true);orderScreenLayer(layer,center,camera);
      worldBasis.multiplyMatrices(screen.matrixWorld,basis);matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(worldBasis);
      const e=matrix.elements,r=canvas.getBoundingClientRect(),rx=r.width/size.x,ry=r.height/size.y;
      const ax=vp.z*.5*rx,bx=r.left+(vp.x+vp.z*.5)*rx,ay=vp.w*.5*ry,by=r.bottom-(vp.y+vp.w*.5)*ry;
      css.fill(0);css[10]=1;for(const k of [0,4,12]){css[k]=ax*e[k]+bx*e[k+3];css[k+1]=-ay*e[k+1]+by*e[k+3];css[k+3]=e[k+3];}
      surface.style.transform='matrix3d('+css.join(',')+')';
      layer.style.clipPath=`inset(${r.bottom-(vp.y+vp.w)*ry}px ${innerWidth-r.left-(vp.x+vp.z)*rx}px ${innerHeight-r.bottom+vp.y*ry}px ${r.left+vp.x*rx}px)`;
      panel.style.left=(r.left+vp.x*rx+18)+'px';panel.style.top=(r.bottom-(vp.y+vp.w)*ry+108)+'px';
    }
  };
}
