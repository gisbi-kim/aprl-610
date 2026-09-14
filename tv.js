import * as THREE from './vendor/three.module.js';
import {screenLayerRoot,orderScreenLayer} from './screen-layers.js';
import videos from './aprl-videos.json' with {type:'json'};

let youtubeAPI;
function loadYouTube() {
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(!youtubeAPI)youtubeAPI=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
    script.onerror=()=>{youtubeAPI=null;reject(new Error('YouTube unavailable'));};
    document.head.append(script);
  });
  return youtubeAPI;
}

export function installTV(viewer,toast) {
  const {cute,camera,renderer}=viewer,canvas=renderer.domElement;
  const screen=cute.getObjectByName('TV_Display');if(!screen)return;
  cute.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(screen),center=b.getCenter(new THREE.Vector3());
  const planeX=b.min.x-.001,width=b.max.z-b.min.z,height=b.max.y-b.min.y;
  const pxWidth=960,pxHeight=960*height/width;
  const artwork=[];cute.traverse(o=>{if(/^(TV_Display|TV_Window_|TV_Code_|TV_Lab_|TV_APRL_)/.test(o.name))artwork.push([o,o.visible]);});
  const hole=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({color:0,opacity:0,transparent:true,blending:THREE.NoBlending,depthWrite:true}));
  hole.name='TV_Video_Surface';hole.rotation.y=-Math.PI/2;hole.position.set(planeX,center.y,center.z);hole.visible=false;hole.renderOrder=-100;cute.add(hole);
  // An actual YouTube iframe sits behind an alpha opening in the WebGL screen.
  // WebGL depth testing keeps foreground furniture and the character in front.
  const layer=document.createElement('div');layer.id='tvVideoLayer';
  Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'0',pointerEvents:'none',overflow:'hidden'});
  const surface=document.createElement('div');surface.id='tvVideoSurface';
  Object.assign(surface.style,{position:'absolute',left:'0',top:'0',width:pxWidth+'px',height:pxHeight+'px',transformOrigin:'0 0',background:'#000',pointerEvents:'none'});
  layer.append(surface);screenLayerRoot().append(layer);layer.hidden=true;
  document.querySelector('#canvas').style.zIndex='1';
  for(const el of document.querySelectorAll('header,aside,footer,#loading,#toast'))if(getComputedStyle(el).zIndex==='auto')el.style.zIndex='3';
  const remote=document.createElement('div');remote.id='tvRemote';remote.setAttribute('role','group');remote.setAttribute('aria-label','APRL TV');
  Object.assign(remote.style,{position:'fixed',right:'24px',bottom:'72px',zIndex:'4',display:'flex',gap:'6px',padding:'5px',borderRadius:'12px',background:'#fffffff0'});
  const nextButton=document.createElement('button'),soundButton=document.createElement('button'),offButton=document.createElement('button');
  for(const button of [nextButton,soundButton,offButton]){button.type='button';button.style.padding='8px 10px';button.style.fontSize='12px';remote.append(button);}
  document.body.append(remote);remote.hidden=true;
  const ko=()=>document.documentElement.lang.startsWith('ko');
  const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
  let active=false,iframe,player,ready=false,current=null,deck=[],previousId=null,pausedByView=false,muted=false,failed=new Set(),generation=0;
  function choose() {
    if(!deck.length) {
      deck=videos.filter(v=>!failed.has(v.id));
      for(let i=deck.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[deck[i],deck[k]]=[deck[k],deck[i]];}
      if(deck.length>1&&deck.at(-1).id===previousId)[deck[0],deck[deck.length-1]]=[deck.at(-1),deck[0]];
    }
    current=deck.pop();if(current)previousId=current.id;return current;
  }
  function restoreArt(){for(const [o,visible] of artwork)o.visible=visible;hole.visible=false;}
  function off() {
    active=false;generation++;player?.destroy();player=null;ready=false;iframe?.remove();iframe=null;
    layer.hidden=true;remote.hidden=true;surface.replaceChildren();restoreArt();canvas.style.pointerEvents='';pausedByView=false;
  }
  function failedVideo() {
    if(!active)return;failed.add(current.id);deck=deck.filter(v=>!failed.has(v.id));
    if(failed.size>=videos.length){off();toast(ko()?'현재 유튜브 영상을 불러올 수 없습니다. 잠시 후 다시 눌러주세요.':'YouTube is unavailable. Please try again shortly.');return;}
    next();
  }
  async function mount(video) {
    const ticket=++generation;
    iframe=document.createElement('iframe');iframe.id='aprlTVPlayer';iframe.width=String(pxWidth);iframe.height=String(pxHeight);
    iframe.title='APRL — '+video.title;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    Object.assign(iframe.style,{display:'block',border:'0',width:'100%',height:'100%',pointerEvents:'auto'});
    const params=new URLSearchParams({enablejsapi:'1',autoplay:'1',playsinline:'1',rel:'0',origin:location.origin});
    iframe.src='https://www.youtube-nocookie.com/embed/'+video.id+'?'+params;
    surface.replaceChildren(iframe);
    try {
      const YT=await loadYouTube();if(!active||ticket!==generation)return;
      player=new YT.Player(iframe,{events:{
        onReady:e=>{if(!active||ticket!==generation)return;ready=true;e.target.playVideo();},
        onStateChange:e=>{if(active&&ticket===generation&&e.data===YT.PlayerState.ENDED)next();},
        onAutoplayBlocked:e=>{if(!active||ticket!==generation)return;e.target.mute();muted=true;e.target.playVideo();},
        onError:()=>{if(ticket===generation)failedVideo();}
      }});
    } catch {if(ticket===generation)toast(ko()?'TV의 유튜브 재생 버튼을 눌러주세요.':'Press the YouTube play button on the TV.');}
  }
  function next() {
    if(!active){active=true;failed.clear();deck=[];}
    const video=choose();if(!video){off();return;}
    if(ready&&player){player.loadVideoById(video.id);iframe.title='APRL — '+video.title;}
    else {player?.destroy();player=null;ready=false;mount(video);}
    pausedByView=false;
  }
  nextButton.onclick=next;offButton.onclick=off;
  soundButton.onclick=()=>{if(!ready)return;if(player.isMuted()){player.unMute();player.setVolume(70);muted=false;}else{player.mute();muted=true;}};

  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),vp=new THREE.Vector4(),size=new THREE.Vector2();
  function hit(x,y,surfaceOnly=false) {
    if(viewer.mode!=='cute'||document.pointerLockElement)return false;
    const rect=canvas.getBoundingClientRect();renderer.getViewport(vp);renderer.getSize(size);
    const sx=(x-rect.left)*size.x/rect.width,sy=(rect.bottom-y)*size.y/rect.height;
    if(sx<vp.x||sx>vp.x+vp.z||sy<vp.y||sy>vp.y+vp.w)return false;
    pointer.set((sx-vp.x)/vp.z*2-1,(sy-vp.y)/vp.w*2-1);camera.updateMatrixWorld(true);cute.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
    const targets=[];viewer.scene.traverse(o=>{if(!o.isMesh||!o.visible)return;let p=o.parent;while(p&&p.visible)p=p.parent;if(!p)targets.push(o);});
    const first=ray.intersectObjects(targets,false)[0]?.object;
    return first&&(surfaceOnly?first===hole:(first===hole||first.name==='TV_Body'||artwork.some(([o])=>o===first)))&&camera.position.x<planeX;
  }
  let down=null;const pointers=new Set();
  canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);down=e.button===0&&pointers.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;});
  canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>=5)down.moved=true;if(!active&&!pointers.size&&hit(e.clientX,e.clientY))canvas.style.cursor='pointer';});
  canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(down&&!down.moved&&down.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&hit(e.clientX,e.clientY)&&!active){next();canvas.style.pointerEvents='none';}down=null;});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
  // Let the official player receive controls through the transparent canvas area.
  window.addEventListener('pointermove',e=>{canvas.style.pointerEvents=active&&!pointers.size&&hit(e.clientX,e.clientY,true)?'none':'';});
  window.addEventListener('blur',()=>{canvas.style.pointerEvents='';});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)off();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&ready){player.pauseVideo();pausedByView=true;}});

  const basis=new THREE.Matrix4().set(0,0,1,planeX,0,-height/pxHeight,0,b.max.y,width/pxWidth,0,0,b.min.z,0,0,0,1);
  const projection=new THREE.Matrix4(),css=new Array(16).fill(0);
  return {
    next,off,get active(){return active;},get videoId(){return current?.id;},get player(){return player;},hole,
    tick() {
      if(!active)return;
      const showing=viewer.mode==='cute'&&camera.position.x<planeX-.015&&!document.hidden;
      layer.hidden=!showing;remote.hidden=viewer.mode!=='cute';hole.visible=showing;
      for(const [o,visible] of artwork)o.visible=showing?false:visible;
      if(!showing){canvas.style.pointerEvents='';if(ready&&player.getPlayerState()===1){player.pauseVideo();pausedByView=true;}return;}
      if(pausedByView&&ready){player.playVideo();pausedByView=false;}
      if(ready)muted=player.isMuted();
      text(nextButton,ko()?'다른 영상':'Next video');text(offButton,ko()?'TV 끄기':'Turn off TV');text(soundButton,ko()?(muted?'소리 켜기':'음소거'):(muted?'Sound on':'Mute'));
      renderer.getViewport(vp);renderer.getSize(size);camera.updateMatrixWorld(true);
      orderScreenLayer(layer,center,camera);
      projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(basis);
      const e=projection.elements,rect=canvas.getBoundingClientRect(),rx=rect.width/size.x,ry=rect.height/size.y;
      remote.style.right=Math.max(16,innerWidth-rect.left-(vp.x+vp.z)*rx+16)+'px';
      remote.style.bottom=Math.max(16,innerHeight-rect.bottom+vp.y*ry+8)+'px';
      const ax=vp.z*.5*rx,bx=rect.left+(vp.x+vp.z*.5)*rx,ay=vp.w*.5*ry,by=rect.bottom-(vp.y+vp.w*.5)*ry;
      css.fill(0);css[10]=1;
      for(const k of [0,4,12]){css[k]=ax*e[k]+bx*e[k+3];css[k+1]=-ay*e[k+1]+by*e[k+3];css[k+3]=e[k+3];}
      surface.style.transform='matrix3d('+css.join(',')+')';
      layer.style.clipPath=`inset(${rect.bottom-(vp.y+vp.w)*ry}px ${innerWidth-rect.left-(vp.x+vp.z)*rx}px ${innerHeight-rect.bottom+vp.y*ry}px ${rect.left+vp.x*rx}px)`;
    }
  };
}
