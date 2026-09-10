import * as T from './vendor/three.module.js';

// Original, procedural interpretation of the supplied Dalgu reference. Metres, Y up.
function createDalgu(){
  const root=new T.Group();root.name='Dalgu';
  const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.72});
  const blue=mat('#7893d0'),cream=mat('#fff2d8'),black=mat('#18212a'),white=mat('#ffffff'),pink=mat('#ed93ad'),gold=mat('#f2cf60');
  function ball(parent,name,p,s,m){const mesh=new T.Mesh(new T.SphereGeometry(1,32,24),m);mesh.name=name;mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function line(parent,points,r,m){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,24,r,8,false),m);parent.add(mesh);return mesh;}
  ball(root,'Body',[0,.43,0],[.255,.31,.18],blue);
  ball(root,'Belly',[0,.46,.23],[.19,.20,.035],cream);
  const legs=[];for(const sign of [-1,1])legs.push(ball(root,'Foot',[sign*.12,.12,.035],[.105,.12,.15],blue));
  const tail=ball(root,'Tail',[-.12,.18,-.22],[.13,.055,.27],blue);tail.rotation.y=-.45;
  const head=new T.Group();head.name='Head';root.add(head);
  ball(head,'Head blue',[0,.88,0],[.37,.295,.215],blue);
  for(const sign of [-1,1]){ball(head,'Ear',[sign*.26,1.07,-.025],[.075,.079,.052],blue);ball(head,'Inner ear',[sign*.26,1.072,.017],[.038,.044,.012],blue);}
  const muzzle=ball(head,'Muzzle',[0,.775,.125],[.36,.15,.165],cream);
  // Broad, softly squared cream cheeks rather than a projecting oval snout.
  const cheekPositions=muzzle.geometry.attributes.position;
  for(let i=0;i<cheekPositions.count;i++){
    for(const axis of ['X','Y']){const v=cheekPositions['get'+axis](i);cheekPositions['set'+axis](i,Math.sign(v)*Math.pow(Math.abs(v),.65));}
  }
  muzzle.geometry.computeVertexNormals();
  for(const sign of [-1,1]){
    ball(head,'Eye',[sign*.137,.948,.214],[.036,.041,.025],black);
    ball(head,'Eye sparkle',[sign*.137-.009,.962,.237],[.010,.011,.004],white);
    const brow=ball(head,'Eyebrow',[sign*.12,.993,.212],[.034,.019,.012],cream);brow.rotation.z=sign*.3;
    for(const k of [-1,1])line(head,[[sign*.22,.81+k*.014,.272],[sign*.279,.812+k*.027,.242]],.006,black);
  }
  ball(head,'Nose',[0,.839,.292],[.045,.025,.019],black);
  
  
  ball(head,'Smile opening',[0,.756,.293],[.038,.040,.012],black);
  ball(head,'Tongue',[0,.750,.305],[.026,.025,.007],pink);
  line(head,[[-.118,.806,.282],[-.095,.778,.294],[-.045,.779,.302],[0,.800,.310],[.045,.779,.302],[.095,.778,.294],[.118,.806,.282]],.006,black);
  line(head,[[-.018,1.16,0],[-.027,1.20,0],[-.045,1.22,0]],.006,black);
  line(head,[[.018,1.16,0],[.028,1.21,0],[.045,1.23,0]],.006,black);
  const arms=[];for(const sign of [-1,1]){const arm=new T.Group();arm.position.set(sign*.20,.59,0);root.add(arm);const hand=ball(arm,'Arm',[sign*.095,-.035,.01],[.16,.075,.085],blue);hand.rotation.z=-sign*.3;arms.push(arm);}
  line(root,[[-.19,.67,.205],[-.13,.50,.26],[.03,.34,.275],[.24,.27,.16]],.028,white);
  ball(root,'White bag',[.22,.29,.09],[.12,.115,.083],white);
  for(const [x,y] of [[-.025,.425],[.055,.39]]){const ring=new T.Mesh(new T.TorusGeometry(.045,.013,10,32),white);ring.position.set(x,y,.282);ring.rotation.z=-.5;root.add(ring);}
  const fish=new T.Group();fish.position.set(-.43,.64,.04);fish.rotation.z=-.12;arms[0].add(fish);fish.position.sub(arms[0].position);
  ball(fish,'Fish',[0,0,0],[.13,.082,.044],gold);
  for(const y of [-.04,.04]){const fin=ball(fish,'Fish tail',[.13,y,0],[.055,.048,.025],gold);fin.rotation.z=y>0?.6:-.6;}
  ball(fish,'Fish eye',[-.077,.025,.04],[.009,.009,.005],black);
  for(const x of [-.025,.025,.07])line(fish,[[x,-.035,.041],[x+.015,0,.047],[x,.035,.041]],.004,black);
  // Each section occupies exactly 0.5 m in the neutral pose, including ears/hair.
  const body=new T.Group();body.name='BodySection';
  for(const child of [...root.children])if(child!==head)body.add(child);
  root.add(body);
  const headBounds=new T.Box3().setFromObject(head),bodyBounds=new T.Box3().setFromObject(body);
  const headScale=.5/(headBounds.max.y-headBounds.min.y),bodyScale=.5/(bodyBounds.max.y-bodyBounds.min.y);
  const headContent=new T.Group();headContent.name='HeadGeometry';
  for(const child of [...head.children])headContent.add(child);
  head.add(headContent);headContent.scale.setScalar(headScale);headContent.position.y=-headBounds.min.y*headScale;head.position.y=.5;
  body.scale.setScalar(bodyScale);body.position.y=-bodyBounds.min.y*bodyScale;
  // The reference has no exposed neck: shoulders continue inside the lower head.
  // This hidden overlap keeps the visible 0.5 m head / 0.5 m body split without tangent-only contact.
  const torso=root.getObjectByName('Body');torso.scale.set(.34,.35,.22);torso.position.y=.59;
  const eyeHeight=.5+(.948-headBounds.min.y)*headScale;
  return {root,head,legs,arms,eyeHeight};
}

export function installDalgu(viewer){
  const {scene,camera,controls,renderer}=viewer;
  const avatar=createDalgu();scene.add(avatar.root);
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
    avatar.head.rotation.x=0;avatar.legs.forEach(o=>o.rotation.x=0);avatar.arms.forEach(o=>o.rotation.x=0);
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
    avatar.root.visible=!active||follow;avatar.head.rotation.x=0;
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
    avatar.legs.forEach((leg,i)=>leg.rotation.x=length?Math.sin(phase+i*Math.PI)*.32:0);avatar.arms.forEach((arm,i)=>arm.rotation.x=length?Math.sin(phase+i*Math.PI)*.15:0);viewUpdate();
  }
  reset();viewUpdate();
  return {tick,enter,exit,reset,blocked,avatar:avatar.root,get active(){return active;},get position(){return position.clone();},get height(){return height;}};
}
