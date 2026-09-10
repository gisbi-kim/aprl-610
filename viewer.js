import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
const D=window.CUTE_LAB,$=s=>document.querySelector(s),names={cute:'3D 모델',scan:'MVS',lingbot:'Pointcloud'};
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0xecebe5);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;$('#canvas').appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.03,150);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=40;controls.minDistance=.12;controls.maxPolarAngle=Math.PI*.92;
scene.add(new THREE.HemisphereLight(0xfff5e4,0x99abb3,.9));
const key=new THREE.DirectionalLight(0xffedd4,2.3);key.position.set(-1,8,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4,right:4,top:5,bottom:-5,near:.1,far:18});key.shadow.normalBias=.013;key.shadow.bias=-.00015;key.shadow.radius=3;scene.add(key);
const fill=new THREE.DirectionalLight(0xd9efff,.9);fill.position.set(3,5,-5);scene.add(fill);
const envScene=new THREE.Scene();envScene.background=new THREE.Color(0xe8edf0);envScene.add(new THREE.Mesh(new THREE.BoxGeometry(20,15,20),new THREE.MeshBasicMaterial({color:0xdde2e1,side:THREE.BackSide})));
for(const [at,size,col] of [[[0,6,0],[8,.1,8],0xffffff],[[-8,2,0],[.1,9,8],0xf2e4ce],[[7,2,0],[.1,7,8],0xccdfed]]){const o=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color:col}));o.position.set(...at);envScene.add(o);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.08).texture;pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xecebe5,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.218;ground.receiveShadow=true;scene.add(ground);
const loader=new GLTFLoader(),roofClip=new THREE.Plane(new THREE.Vector3(0,-1,0),2.59);
let cute,scan,lingbot,scanPromise,mapPromise,mapMaterial,mapCameraGroup,qualityValues,mode='cute',currentView='all',requestNumber=0;
const cuteBytes=new Uint8Array(await (await fetch('model.glb')).arrayBuffer());
function toast(msg){$('#toast').textContent=msg;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',4500);}
loader.parse(cuteBytes.buffer,'',g=>{cute=g.scene;cute.traverse(o=>{if(o.isMesh){o.castShadow=!o.name.startsWith('Carpet_');o.receiveShadow=true;if(o.material)o.material.envMapIntensity=.75;}});scene.add(cute);$('#loading').remove();document.querySelectorAll('[data-model]').forEach(b=>b.disabled=false);applyMode('cute');window.viewerReady=true;},e=>{$('#loading').textContent='모델을 열지 못했습니다. 페이지를 새로고침해 주세요.';console.error(e);});
const viewpoints=[...D.cameras].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
let viewIndex=Math.max(0,viewpoints.findIndex(c=>c.name==='14.jpg'));
function viewLabel(label){
  $('#viewPosition').textContent=label||`View ${viewIndex+1} / ${viewpoints.length}`;
}
function selectView(index){
  viewIndex=(index+viewpoints.length)%viewpoints.length;
  const c=viewpoints[viewIndex];
  const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
  camera.fov=83;camera.position.fromArray(c.position);
  controls.target.copy(camera.position).add(new THREE.Vector3(...c.forward).multiplyScalar(2));
  camera.updateProjectionMatrix();controls.update();controls.enableDamping=damping;
  currentView=c.name==='05.jpg'?'entry':c.name==='14.jpg'?'window':'camera';
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));
  viewLabel();
}
function preset(kind){
  if(kind==='entry'||kind==='window'){
    selectView(viewpoints.findIndex(c=>c.name===(kind==='entry'?'05.jpg':'14.jpg')));return;
  }
  currentView=kind;camera.fov=36;
  if(kind==='all'){camera.position.set(6.2,7.2,-8.5);controls.target.set(-.10,.65,.18);}
  else{camera.position.set(0,12.2,.165);controls.target.set(0,0,.16501);}
  camera.updateProjectionMatrix();controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===kind));
  viewLabel(kind==='all'?'미니어처':'평면 보기');
}
$('#viewPrevious').onclick=()=>selectView(viewIndex-1);
$('#viewNext').onclick=()=>selectView(viewIndex+1);
$('#viewNavigator').onkeydown=e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();selectView(viewIndex+(e.key==='ArrowLeft'?-1:1));}
};
controls.addEventListener('start',()=>viewLabel(`자유 시점 · ${viewIndex+1} / ${viewpoints.length}`));
preset('window');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>preset(b.dataset.view));

function loadScan(){if(scanPromise)return scanPromise;scanPromise=new Promise((resolve,reject)=>loader.load('mvs.glb',g=>{scan=g.scene;scan.traverse(o=>{if(o.isMesh){const old=o.material;o.material=new THREE.MeshBasicMaterial({map:old.map,vertexColors:!!o.geometry.attributes.color,side:THREE.DoubleSide,clippingPlanes:$('#cutaway').checked?[roofClip]:[]});}});scan.visible=false;scene.add(scan);resolve();},undefined,reject)).catch(e=>{scanPromise=null;throw e;});return scanPromise;}
function cameraMarkers(cameras){const verts=[];for(const c of cameras){const p=new THREE.Vector3(...c.position),f=new THREE.Vector3(...c.forward),r=new THREE.Vector3(...c.right),u=new THREE.Vector3(...c.up),dist=.13;
const center=p.clone().addScaledVector(f,dist),w=dist*Math.tan(c.horizontal_fov/2),h=dist*Math.tan(c.vertical_fov/2),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>center.clone().addScaledVector(r,a*w).addScaledVector(u,b*h));
for(let i=0;i<4;i++)verts.push(...p.toArray(),...corners[i].toArray(),...corners[i].toArray(),...corners[(i+1)%4].toArray());}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));return new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xdf9851,transparent:true,opacity:.85,depthTest:true}));}
async function loadMap(){if(mapPromise)return mapPromise;mapPromise=(async()=>{
if(!D.lingbot)throw new Error('Pointcloud metadata unavailable');const response=await fetch(D.lingbot.asset);if(!response.ok)throw new Error('Map HTTP '+response.status);
const buffer=await response.arrayBuffer(),view=new DataView(buffer);if(String.fromCharCode(...new Uint8Array(buffer,0,4))!=='LBM1')throw new Error('Invalid map format');
const n=view.getUint32(4,true),xyz=new Float32Array(buffer,8,n*3),rgbOffset=8+n*12,rgb=new Uint8Array(buffer,rgbOffset,n*3),qOffset=Math.ceil((rgbOffset+n*3)/4)*4;
if(buffer.byteLength!==qOffset+n*4)throw new Error('Incomplete map');qualityValues=new Float32Array(buffer,qOffset,n);
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(xyz,3));geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3,true));geometry.setAttribute('confidence',new THREE.BufferAttribute(qualityValues,1));geometry.computeBoundingSphere();
mapMaterial=new THREE.ShaderMaterial({vertexColors:true,uniforms:{threshold:{value:6.5},pointSize:{value:3.5},pixelRatio:{value:renderer.getPixelRatio()},cutRoof:{value:$('#cutaway').checked?1:0}},vertexShader:`
attribute float confidence; varying vec3 vColor; varying float vConfidence; varying float vHeight; uniform float pointSize; uniform float pixelRatio;
void main(){vColor=color;vConfidence=confidence;vHeight=position.y;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=pointSize*pixelRatio;}
`,fragmentShader:`
varying vec3 vColor; varying float vConfidence; varying float vHeight; uniform float threshold; uniform float cutRoof;
void main(){if(vConfidence<threshold||(cutRoof>0.5&&vHeight>2.59))discard;vec2 p=gl_PointCoord-vec2(0.5);if(dot(p,p)>0.25)discard;
vec3 linearColor=mix(vColor/12.92,pow((vColor+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),vColor));gl_FragColor=vec4(linearColor,1.0);
#include <colorspace_fragment>
}
`});
lingbot=new THREE.Group();lingbot.name='Pointcloud';lingbot.add(new THREE.Points(geometry,mapMaterial));mapCameraGroup=cameraMarkers(D.lingbot.cameras);mapCameraGroup.visible=$('#mapCameras').checked;lingbot.add(mapCameraGroup);lingbot.visible=false;scene.add(lingbot);
$('#confidence').max=Math.ceil(D.lingbot.confidence_quantiles['99']);$('#confidence').value=D.lingbot.default_confidence;updateMapSettings();
})().catch(e=>{mapPromise=null;throw e;});return mapPromise;}
function applyMode(next){mode=next;cute.visible=mode==='cute';if(scan)scan.visible=mode==='scan';if(lingbot)lingbot.visible=mode==='lingbot';ground.visible=mode==='cute';
document.querySelectorAll('[data-model]').forEach(b=>{const active=b.dataset.model===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#canvas').setAttribute('aria-label',names[mode]);$('#canvas').setAttribute('aria-labelledby','model-'+mode);
$('#mapControls').hidden=mode!=='lingbot';$('#modeNote').textContent={cute:'기존 복원 좌표를 기준으로 가구를 다듬은 모델입니다.',scan:'SfM/MVS로 복원한 표면 모델입니다. 다른 탭과 같은 시점으로 비교할 수 있습니다.',lingbot:'여러 시점에서 구성한 점군입니다. MVS 모델과 같은 좌표에 정렬했습니다.'}[mode];
$('#modePill').textContent=names[mode]+(mode==='lingbot'?'':' · 약 4 m 폭');$('#modelStatus').textContent='';resize();}
async function selectModel(next){if(!cute)return;const ticket=++requestNumber;$('#modelStatus').textContent=(next==='scan'&&!scan||next==='lingbot'&&!lingbot)?names[next]+' 불러오는 중…':'';
try{if(next==='scan')await loadScan();if(next==='lingbot')await loadMap();if(ticket===requestNumber)applyMode(next);}catch(e){if(ticket===requestNumber){$('#modelStatus').textContent='';toast('모델 파일을 불러오지 못했습니다. 로컬 웹 주소에서 다시 시도해 주세요.');}console.error(e);}}
const tabs=[...document.querySelectorAll('[data-model]')];tabs.forEach((b,index)=>{b.onclick=()=>selectModel(b.dataset.model);b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();selectModel(tabs[next].dataset.model);};});
function updateMapSettings(){if(!mapMaterial)return;const threshold=Number($('#confidence').value),size=Number($('#pointSize').value);mapMaterial.uniforms.threshold.value=threshold;mapMaterial.uniforms.pointSize.value=size;$('#confidenceValue').textContent=threshold.toFixed(1);$('#pointSizeValue').textContent=size.toFixed(1);mapCameraGroup.visible=$('#mapCameras').checked;let count=0;for(const q of qualityValues)if(q>=threshold)count++;$('#mapCount').textContent=count.toLocaleString('ko-KR')+'개 점 · 카메라 좌표 정렬 오차 '+(D.lingbot.alignment.camera_rmse_m*100).toFixed(1)+' cm';}
$('#confidence').oninput=updateMapSettings;$('#pointSize').oninput=updateMapSettings;$('#mapCameras').onchange=updateMapSettings;
$('#cutaway').onchange=()=>{if(mapMaterial)mapMaterial.uniforms.cutRoof.value=$('#cutaway').checked?1:0;if(scan)scan.traverse(o=>{if(o.isMesh){o.material.clippingPlanes=$('#cutaway').checked?[roofClip]:[];o.material.needsUpdate=true;}});};
function cutaway(){if(!cute)return;const cut=$('#cutaway').checked,x=camera.position.x,z=camera.position.z;cute.traverse(o=>{const n=o.name;let hide=false;if(cut){if(n.startsWith('Wall_Left'))hide=x<-2.05;if(n.startsWith('Wall_Right'))hide=x>2.04;if(n.startsWith('Wall_Front')||n.startsWith('Wall_DoorHeader')||n.startsWith('Door_'))hide=z>2.96;if(n.startsWith('Window_')&&!n.startsWith('Window_Tree')&&!n.startsWith('Window_Console')&&!n.startsWith('Window_Stool'))hide=z<-2.63;if(n.startsWith('Wall_Window'))hide=z<-2.63;}if(n.startsWith('Wall_')||n.startsWith('Door_')||(n.startsWith('Window_')&&!n.startsWith('Window_Tree')&&!n.startsWith('Window_Console')&&!n.startsWith('Window_Stool')))o.visible=!hide;});}
function resize(){const mobile=innerWidth<=720,width=mobile?innerWidth:Math.max(300,innerWidth-290),bottom=mobile?innerHeight-$('aside').getBoundingClientRect().top+14:45,top=mobile?91:65,height=Math.max(150,innerHeight-bottom-top);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setViewport(0,bottom,width,height);$('footer').style.bottom=(mobile?bottom+4:24)+'px';}
window.addEventListener('resize',resize);resize();
function animate(){requestAnimationFrame(animate);controls.update();cutaway();renderer.render(scene,camera);}animate();
window.labViewer={scene,camera,renderer,controls,preset,selectModel,get mode(){return mode;},get cute(){return cute;},get scan(){return scan;},get lingbot(){return lingbot;}};
