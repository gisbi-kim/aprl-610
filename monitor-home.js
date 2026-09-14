import * as THREE from './vendor/three.module.js';
import {screenLayerRoot,orderScreenLayer} from './screen-layers.js';

const HOME='https://team-aprl.github.io/'; // Destination of aprl.dgist.ac.kr.

export function scrollOnlyHome(html) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  // Preserve the current home page's HTML/CSS, never its scripts or navigation.
  doc.querySelectorAll('script,base,meta[http-equiv],object,embed,video,audio').forEach(n=>n.remove());
  for(const frame of doc.querySelectorAll('iframe')) {
    const match=frame.getAttribute('src')?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/);
    if(match){const image=doc.createElement('img');image.src='https://i.ytimg.com/vi/'+match[1]+'/hqdefault.jpg';image.alt=frame.title;image.className=frame.className;image.style.cssText='width:100%;aspect-ratio:16/9;object-fit:cover;display:block';frame.replaceWith(image);}else frame.remove();
  }
  for(const el of doc.querySelectorAll('*')) {
    for(const attr of [...el.attributes])if(/^on/i.test(attr.name))el.removeAttribute(attr.name);
    el.removeAttribute('autofocus');el.removeAttribute('contenteditable');
    if(el.matches('a,area'))for(const attr of ['href','target','ping','download'])el.removeAttribute(attr);
    if(el.matches('form')){el.removeAttribute('action');el.removeAttribute('method');}
    if(el.matches('a,button,input,select,textarea,summary,[tabindex]'))el.setAttribute('tabindex','-1');
    if(el.matches('input,select,textarea,button'))el.setAttribute('disabled','');
  }
  const base=doc.createElement('base');base.href=HOME;doc.head.prepend(base);
  const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';
  policy.content="default-src 'none'; style-src https: 'unsafe-inline'; img-src https: data:; font-src https: data:; script-src 'none'; frame-src 'none'; connect-src 'none'; form-action 'none'; base-uri https://team-aprl.github.io";
  doc.head.prepend(policy);
  const style=doc.createElement('style');style.textContent='html,body{overscroll-behavior:none!important;scroll-behavior:auto!important}a,button,input,select,textarea{pointer-events:none!important;cursor:default!important}button:disabled{opacity:1}';doc.head.append(style);
  return '<!doctype html>'+doc.documentElement.outerHTML;
}

export function installMonitorHome(viewer) {
  const {cute,camera,renderer}=viewer,canvas=renderer.domElement;
  const display=cute.getObjectByName('Main_Monitor_Display');if(!display)return;
  cute.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(display),center=b.getCenter(new THREE.Vector3());
  const width=b.max.x-b.min.x,height=b.max.y-b.min.y,z=b.min.z-.001;
  const pxWidth=1100,pxHeight=pxWidth*height/width;
  const artwork=[];cute.traverse(o=>{if(o.name==='Main_Monitor_Display'||o.name.startsWith('Main_Monitor_UI'))artwork.push([o,o.visible]);});
  const hole=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({color:0,opacity:0,transparent:true,blending:THREE.NoBlending,depthWrite:true}));
  hole.name='Main_Monitor_Home_Surface';hole.rotation.y=Math.PI;hole.position.set(center.x,center.y,z);hole.renderOrder=-100;hole.visible=false;cute.add(hole);
  const layer=document.createElement('div');layer.id='monitorHomeLayer';Object.assign(layer.style,{position:'fixed',inset:'0',pointerEvents:'none',overflow:'hidden'});screenLayerRoot().append(layer);layer.hidden=true;
  const surface=document.createElement('div');surface.id='monitorHomeSurface';Object.assign(surface.style,{position:'absolute',left:'0',top:'0',width:pxWidth+'px',height:pxHeight+'px',transformOrigin:'0 0',background:'#fff',pointerEvents:'none'});layer.append(surface);
  const frame=document.createElement('iframe');frame.id='monitorHomePage';frame.title='APRL homepage — scroll only';frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('tabindex','-1');frame.referrerPolicy='strict-origin-when-cross-origin';
  Object.assign(frame.style,{display:'block',border:'0',width:'100%',height:'100%',pointerEvents:'none'});surface.append(frame);
  let loaded=false,loading=null,failed=false,drag=null,focused=false,retries=0;
  function load() {
    if(loading)return;
    loading=(async()=>{
      try {
        const response=await fetch(HOME,{credentials:'omit',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error('Homepage HTTP '+response.status);
        frame.srcdoc=scrollOnlyHome(await response.text());loaded=true;failed=false;
      }catch{failed=true;loading=null;if(retries++<1)setTimeout(load,1000);}
    })();
  }
  load();
  const vp=new THREE.Vector4(),size=new THREE.Vector2(),pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
  function hit(x,y) {
    if(!loaded||viewer.mode!=='cute'||document.pointerLockElement||camera.position.z>=z)return false;
    renderer.getViewport(vp);renderer.getSize(size);const r=canvas.getBoundingClientRect();
    const sx=(x-r.left)*size.x/r.width,sy=(r.bottom-y)*size.y/r.height;
    if(sx<vp.x||sx>vp.x+vp.z||sy<vp.y||sy>vp.y+vp.w)return false;
    pointer.set((sx-vp.x)/vp.z*2-1,(sy-vp.y)/vp.w*2-1);camera.updateMatrixWorld(true);cute.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
    const targets=[];viewer.scene.traverse(o=>{if(!o.isMesh||!o.visible)return;let p=o.parent;while(p&&p.visible)p=p.parent;if(!p)targets.push(o);});
    return ray.intersectObjects(targets,false)[0]?.object===hole;
  }
  function scrollBy(delta){const root=frame.contentDocument?.scrollingElement;if(root)root.scrollTop+=delta;}
  function consume(e){e.preventDefault();e.stopImmediatePropagation();}
  canvas.addEventListener('wheel',e=>{if(!hit(e.clientX,e.clientY))return;consume(e);scrollBy(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?pxHeight:1));},{capture:true,passive:false});
  canvas.addEventListener('pointerdown',e=>{
    focused=hit(e.clientX,e.clientY);if(!focused)return;consume(e);
    if(e.button===0){drag={id:e.pointerId,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});}
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(drag&&drag.id===e.pointerId){consume(e);const scale=surface.getBoundingClientRect().height/pxHeight;scrollBy((drag.y-e.clientY)/Math.max(.08,scale));drag.y=e.clientY;}
    else if(hit(e.clientX,e.clientY))canvas.style.cursor='ns-resize';
  },true);
  // The bubble listener follows the fridge/TV cursor handlers.
  canvas.addEventListener('pointermove',e=>{if(!drag&&hit(e.clientX,e.clientY))canvas.style.cursor='ns-resize';});
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{if(drag?.id===e.pointerId){consume(e);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);drag=null;}},true);
  canvas.addEventListener('click',e=>{if(hit(e.clientX,e.clientY))consume(e);},true);
  canvas.addEventListener('keydown',e=>{
    if(!focused||!loaded||viewer.mode!=='cute')return;
    if(e.key==='Escape'){focused=false;return;}
    const root=frame.contentDocument?.scrollingElement;
    const delta={ArrowDown:50,ArrowUp:-50,PageDown:pxHeight*.85,PageUp:-pxHeight*.85,' ':pxHeight*.85}[e.key];
    if(delta!==undefined){consume(e);scrollBy(e.shiftKey?-delta:delta);}
    else if(root&&(e.key==='Home'||e.key==='End')){consume(e);root.scrollTop=e.key==='Home'?0:root.scrollHeight;}
  },true);
  // Front faces -Z: screen-right is world -X and screen-down is world -Y.
  const basis=new THREE.Matrix4().set(-width/pxWidth,0,0,b.max.x,0,-height/pxHeight,0,b.max.y,0,0,1,z,0,0,0,1);
  const matrix=new THREE.Matrix4(),css=new Array(16).fill(0);
  return {
    get loaded(){return loaded;},get failed(){return failed;},get scrollTop(){return frame.contentDocument?.scrollingElement?.scrollTop||0;},frame,hole,
    tick() {
      const visible=loaded&&viewer.mode==='cute'&&camera.position.z<z-.01;
      layer.hidden=!visible;hole.visible=visible;for(const [o,wasVisible] of artwork)o.visible=visible?false:wasVisible;
      if(!visible){focused=false;return;}
      renderer.getViewport(vp);renderer.getSize(size);camera.updateMatrixWorld(true);orderScreenLayer(layer,center,camera);
      matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(basis);
      const e=matrix.elements,r=canvas.getBoundingClientRect(),rx=r.width/size.x,ry=r.height/size.y;
      const ax=vp.z*.5*rx,bx=r.left+(vp.x+vp.z*.5)*rx,ay=vp.w*.5*ry,by=r.bottom-(vp.y+vp.w*.5)*ry;
      css.fill(0);css[10]=1;for(const k of [0,4,12]){css[k]=ax*e[k]+bx*e[k+3];css[k+1]=-ay*e[k+1]+by*e[k+3];css[k+3]=e[k+3];}
      surface.style.transform='matrix3d('+css.join(',')+')';
      layer.style.clipPath=`inset(${r.bottom-(vp.y+vp.w)*ry}px ${innerWidth-r.left-(vp.x+vp.z)*rx}px ${innerHeight-r.bottom+vp.y*ry}px ${r.left+vp.x*rx}px)`;
    }
  };
}
