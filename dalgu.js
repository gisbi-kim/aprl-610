import * as T from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// Supplied Dalgu OBJ/PBR asset, converted to embedded-texture GLB at one metre.
async function createDalgu(){
  const gltf=await new GLTFLoader().loadAsync('./dalgu.glb');
  const root=new T.Group();root.name='Dalgu';root.add(gltf.scene);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.envMapIntensity=.55;}});
  return {root,eyeHeight:.80};
}

export async function installDalgu(viewer){
  const {scene,camera,controls,renderer}=viewer;
  const avatar=await createDalgu();scene.add(avatar.root);
  const panel=document.createElement('section');panel.id='dalguPanel';
  panel.innerHTML='<hr><div class="label">달구와 산책</div><div class="dalgu-buttons"><button id="dalguEyes">달구 시점</button><button id="dalguFollow">따라가기</button><button id="dalguExit" hidden>둘러보기로</button></div><p id="dalguSize">키 1.0 m</p><p id="dalguHelp">WASD · 방향키 이동<br>화면 클릭 후 마우스로 시선 조절 · Esc 해제</p><button id="dalguReset" class="wide">달구 위치 초기화</button>';
  document.querySelector('aside').append(panel);
  const style=document.createElement('style');style.textContent='#dalguPanel{grid-column:1/-1}#dalguPanel .label{margin-top:12px}.dalgu-buttons{display:flex;gap:6px;flex-wrap:wrap}.dalgu-buttons button{flex:1;white-space:nowrap}#dalguSize{font-size:11px;color:#738479;margin:12px 0}#dalguHelp{font-size:11px;line-height:1.7;color:#738479}body.dalgu-walk #viewNavigator,body.dalgu-walk .views{opacity:.5}';document.head.append(style);
  const $=id=>document.getElementById(id),keys=new Set();
  let active=false,follow=false,yaw=0,pitch=0,phase=0,saved=null,drag=null;
  const height=1.0;
  const radius=.22,position=new T.Vector3(),boxes=[];
  viewer.cute.updateMatrixWorld(true);
  viewer.cute.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o);
    // Ignore floor coverings and geometry above Dalgu. Individual mesh bounds keep passages open.
    if(b.max.y>.09&&b.min.y<1.5&&!/Floor|Carpet|Plinth|Ceiling/i.test(o.name))boxes.push(b);
  });
  function blocked(x,z){if(x< -1.98+radius||x>1.98-radius||z< -2.57+radius||z>2.9-radius)return true;
    return boxes.some(b=>b.min.y<height&&b.max.y>.09&&Math.hypot(x-T.MathUtils.clamp(x,b.min.x,b.max.x),z-T.MathUtils.clamp(z,b.min.z,b.max.z))<radius);
  }
  function reset(){
    keys.clear();yaw=0;pitch=0;phase=0;

    avatar.root.position.set(0,.016,0);avatar.root.rotation.y=Math.PI;
    avatar.root.updateMatrixWorld(true);
    // Include head, tail, arms and fish, plus room to start walking.
    const footprint=new T.Box3().setFromObject(avatar.root);
    footprint.min.x-=.10;footprint.max.x+=.10;footprint.min.z-=.10;footprint.max.z+=.10;
    let best=null;
    for(let z=2.4;z> -2.3;z-=.06)for(let x=-1.6;x<1.7;x+=.06){
      const candidate=footprint.clone().translate(new T.Vector3(x,0,z));
      if(blocked(x,z)||candidate.min.x< -1.98||candidate.max.x>1.98||candidate.min.z< -2.57||candidate.max.z>2.9||boxes.some(b=>b.intersectsBox(candidate)))continue;
      const score=x*x+(z-1.8)**2;
      if(!best||score<best.score)best={x,z,score};
    }
    if(best)position.set(best.x,.016,best.z);
    avatar.root.position.copy(position);return !!best;
  }
  function viewUpdate(){avatar.root.position.copy(position);avatar.root.rotation.y=yaw+Math.PI;
    avatar.root.visible=!active||follow;
    if(!active)return;camera.fov=75;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
    camera.position.copy(position).add(new T.Vector3(0,avatar.eyeHeight,0));
    if(follow){const target=camera.position.clone();const offset=new T.Vector3(0,.42,1.8).applyAxisAngle(new T.Vector3(0,1,0),yaw);const ray=new T.Raycaster(target,offset.clone().normalize(),0,offset.length());const hits=ray.intersectObject(viewer.cute,true);const dist=hits.length?Math.max(.12,hits[0].distance-.12):offset.length();camera.position.addScaledVector(offset.normalize(),dist);camera.lookAt(target);}
    camera.updateProjectionMatrix();
  }
  function enter(third=false){if(!active){saved={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};controls.enabled=false;active=true;}follow=third;keys.clear();document.body.classList.add('dalgu-walk');$('dalguExit').hidden=false;$('dalguEyes').classList.toggle('active',!third);$('dalguFollow').classList.toggle('active',third);viewUpdate();}
  function exit(){if(!active)return;active=false;keys.clear();if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();controls.enabled=true;camera.position.copy(saved.pos);controls.target.copy(saved.target);camera.fov=saved.fov;camera.updateProjectionMatrix();controls.update();avatar.root.visible=true;document.body.classList.remove('dalgu-walk');$('dalguExit').hidden=true;$('dalguEyes').classList.remove('active');$('dalguFollow').classList.remove('active');}
  $('dalguEyes').onclick=()=>enter(false);$('dalguFollow').onclick=()=>enter(true);$('dalguExit').onclick=exit;$('dalguReset').onclick=()=>{reset();viewUpdate();};
  document.querySelectorAll('[data-view],#viewPrevious,#viewNext').forEach(b=>b.addEventListener('click',exit,{capture:true}));
  const moving=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
  window.addEventListener('keydown',e=>{if(!active||e.target.closest?.('input,button,select,textarea'))return;if(moving.includes(e.code)){e.preventDefault();keys.add(e.code);}});
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
  renderer.domElement.addEventListener('click',()=>{if(!active)return;document.activeElement?.blur();try{renderer.domElement.requestPointerLock()?.catch(()=>{});}catch{}});
  document.addEventListener('pointerlockchange',()=>{keys.clear();$('dalguHelp').innerHTML=document.pointerLockElement?'WASD · 방향키 이동 · 마우스 시선<br>Esc를 누르면 마우스가 풀립니다.':'WASD · 방향키 이동<br>화면 클릭 후 마우스로 시선 조절 · Esc 해제';});
  renderer.domElement.addEventListener('pointerdown',e=>{if(active){drag=[e.clientX,e.clientY];document.activeElement?.blur();}});
  window.addEventListener('pointerup',()=>drag=null);
  document.addEventListener('mousemove',e=>{if(!active)return;let dx=0,dy=0;if(document.pointerLockElement===renderer.domElement){dx=e.movementX;dy=e.movementY;}else if(drag&&e.buttons){dx=e.clientX-drag[0];dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];}else return;yaw-=dx*.0025;pitch=T.MathUtils.clamp(pitch-dy*.0025,-1.25,1.25);viewUpdate();});
  function tick(dt){if(!active)return;dt=Math.min(dt,.05);let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
    const length=Math.hypot(x,z);if(length){const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))/length*.85*dt,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))/length*.85*dt;const steps=Math.ceil(Math.hypot(dx,dz)/.02);for(let i=0;i<steps;i++){if(!blocked(position.x+dx/steps,position.z))position.x+=dx/steps;if(!blocked(position.x,position.z+dz/steps))position.z+=dz/steps;}phase+=dt*9;}
    viewUpdate();
  }
  reset();viewUpdate();
  return {tick,enter,exit,reset,blocked,avatar:avatar.root,get active(){return active;},get position(){return position.clone();},get height(){return height;}};
}
