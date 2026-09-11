import { MeshoptDecoder } from './vendor/meshopt_decoder.mjs';
import { installDalgu } from './dalgu.js?v=platform-jump-2';
import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
const D=window.CUTE_LAB,$=s=>document.querySelector(s),names={cute:'3D 모델',scan:'MVS',lingbot:'Pointcloud',gs:'GS'};
document.querySelector('#pointSize').value='5';document.querySelector('#pointSizeValue').textContent='5';
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
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),roofClip=new THREE.Plane(new THREE.Vector3(0,-1,0),2.59);
let dalgu;
let cute,scan,lingbot,scanPromise,mapPromise,mapMaterial,mapCameraGroup,qualityValues,mode='cute',currentView='all',requestNumber=0;
const cuteBytes=new Uint8Array(await (await fetch('model-compact.glb?v=monitor-arm-2')).arrayBuffer());
function toast(msg){$('#toast').textContent=msg;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',4500);}
loader.parse(cuteBytes.buffer,'',g=>{cute=g.scene;cute.traverse(o=>{if(o.isMesh){o.castShadow=!o.name.startsWith('Carpet_');o.receiveShadow=true;if(o.material)o.material.envMapIntensity=.75;}});scene.add(cute);$('#loading').remove();document.querySelectorAll('[data-model]').forEach(b=>b.disabled=false);applyMode('cute');installDalgu(window.labViewer).then(d=>{dalgu=d;window.labViewer.dalgu=d;window.viewerReady=true;}).catch(e=>{console.error(e);toast('달구 모델을 불러오지 못했습니다. 새로고침해 주세요.');});},e=>{$('#loading').textContent='모델을 열지 못했습니다. 페이지를 새로고침해 주세요.';console.error(e);});
const viewpoints=[...D.cameras].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
let viewIndex=Math.max(0,viewpoints.findIndex(c=>c.name==='14.jpg'));
let tourPlaying=false,tourElapsed=0,tourDestination=0,tourFromPosition=new THREE.Vector3(),tourFromQuaternion=new THREE.Quaternion(),tourFromFov=36;
const tourButton=document.createElement('button');tourButton.id='autoTour';tourButton.className='wide';tourButton.textContent='자동 둘러보기 재생';tourButton.setAttribute('aria-pressed','false');
$('#viewNavigator').after(tourButton);
function stopTour(){
 if(!tourPlaying)return;
 tourPlaying=false;tourButton.textContent='자동 둘러보기 재생';tourButton.setAttribute('aria-pressed','false');controls.enableDamping=true;
 viewLabel();
}
function tourSegment(index){tourDestination=index%viewpoints.length;tourElapsed=0;tourFromPosition.copy(camera.position);tourFromQuaternion.copy(camera.quaternion);tourFromFov=camera.fov;}
tourButton.onclick=()=>{
 if(tourPlaying){stopTour();return;}
 if(viewpoints.length<2)return;
 dalgu?.exit();controls.enableDamping=false;controls.update();tourPlaying=true;
 tourButton.textContent='자동 둘러보기 정지';tourButton.setAttribute('aria-pressed','true');
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));
 tourSegment(viewIndex);
};
controls.addEventListener('start',stopTour);
document.addEventListener('click',e=>{if(e.target.closest('#dalguEyes,#dalguFollow,#dalguReset'))stopTour();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTour();});
window.addEventListener('keydown',e=>{if(e.key==='Escape')stopTour();});
const tourLook=new THREE.Object3D(),tourTarget=new THREE.Vector3(),tourForward=new THREE.Vector3();
function tickTour(dt){
 if(!tourPlaying)return;
 tourElapsed+=Math.min(dt,.1);
 const destination=viewpoints[tourDestination],t=Math.min(tourElapsed/6,1),u=t*t*(3-2*t);
 tourTarget.fromArray(destination.position);tourForward.fromArray(destination.forward).normalize();
 tourLook.position.copy(tourTarget);tourLook.lookAt(tourTarget.clone().add(tourForward));
 // Camera faces -Z, whereas Object3D.lookAt faces +Z.
 tourLook.rotateY(Math.PI);
 camera.position.lerpVectors(tourFromPosition,tourTarget,u);camera.quaternion.slerpQuaternions(tourFromQuaternion,tourLook.quaternion,u);
 camera.fov=THREE.MathUtils.lerp(tourFromFov,83,u);camera.updateProjectionMatrix();
 controls.target.copy(camera.position).add(camera.getWorldDirection(tourForward).multiplyScalar(2));
 viewLabel(`자동 둘러보기 · View ${tourDestination+1} / ${viewpoints.length}`);
 if(t>=1){viewIndex=tourDestination;if(tourElapsed>=7)tourSegment(tourDestination+1);}
}

function viewLabel(label){
  $('#viewPosition').textContent=label||`View ${viewIndex+1} / ${viewpoints.length}`;
}
function selectView(index){
 stopTour();
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
 stopTour();
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
preset('all');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>preset(b.dataset.view));

const mvsSaturation={value:1};
function softenMVS(material){material.onBeforeCompile=shader=>{shader.uniforms.mvsSaturation=mvsSaturation;shader.fragmentShader='uniform float mvsSaturation;\n'+shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat mvsLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(mvsLuma),diffuseColor.rgb,mvsSaturation);');};material.customProgramCacheKey=()=> 'mvs-saturation-v1';}
const modelFileBytes={"mvs-balanced.glb": 11494388, "mvs-complete.glb": 11669628, "mvs-hybrid-additions.glb": 3729080, "mvs-hybrid-more-additions.glb": 3852604, "mvs-hybrid-more.glb": 18071616, "mvs-hybrid.glb": 17025396, "mvs-lingbot-bundle.glb": 17198756, "mvs-lingbot-half.glb": 8434408, "mvs-lingbot-only.glb": 17105028, "mvs-lingbot-repaired.glb": 18808136, "mvs-sfm-half.glb": 5014876, "surface": 9374035, "brush": 3995716};
function modelSize(bytes){return (bytes/1e6).toFixed(1)+" MB";}
function updateTabSize(mode,bytes){if(bytes)$("#model-"+mode+" .model-size").textContent=modelSize(bytes);}
const mvsCache=new Map();let mvsAsset='mvs-lingbot-half.glb';
const mvsPanel=document.createElement('section');mvsPanel.id='mvsControls';mvsPanel.hidden=true;
mvsPanel.innerHTML='<label for="mvsVariant">MVS 비교</label><select id="mvsVariant" style="width:100%;padding:9px;border:1px solid #dde3de;border-radius:9px;background:#f7f8f4;color:#4e625d"><option value="mvs-lingbot-half.glb" selected>LingBot points 기반 · 8.4 MB</option><option value="mvs-sfm-half.glb">SfM/MVS 기반 · 5.0 MB</option></select><label style="display:block;margin-top:12px">채도 <output id="mvsSaturationValue">100%</output><input id="mvsSaturation" type="range" min="0" max="1.2" step="0.05" value="1" style="width:100%"></label><label id="hybridHighlightRow" hidden><input type="checkbox" id="hybridHighlight">LingBot 보완 부분 표시</label><p id="mvsCompareNote" style="font-size:11px;line-height:1.6;color:#7d8580">같은 깊이맵에서 표면 융합 조건을 비교합니다. 큰 미관측 영역은 남아 있습니다.</p>';
document.querySelector('aside').insertBefore(mvsPanel,$('#mapControls'));
$('#mvsSaturation').oninput=e=>{mvsSaturation.value=Number(e.target.value);$('#mvsSaturationValue').textContent=Math.round(mvsSaturation.value*100)+'%';};
$('#mvsVariant').onchange=e=>{mvsAsset=e.target.value;updateTabSize('scan',modelFileBytes[mvsAsset]);selectModel('scan');};
let hybridOverlay;
const overlayCache=new Map();
async function updateHybridOverlay(){
 const asset=mvsAsset;
 const wanted=()=>mode==='scan'&&mvsAsset===asset&&asset.startsWith('mvs-hybrid')&&$('#hybridHighlight').checked;
 if(hybridOverlay)hybridOverlay.visible=false;
 if(!wanted())return;
 if(!overlayCache.has(asset))overlayCache.set(asset,new Promise((resolve,reject)=>loader.load(asset.replace('.glb','-additions.glb'),g=>{g.scene.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshBasicMaterial({color:0xf5a63a,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,clippingPlanes:$('#cutaway').checked?[roofClip]:[]});o.renderOrder=2;}});g.scene.visible=false;scene.add(g.scene);resolve(g.scene);},undefined,reject)));
 try{const overlay=await overlayCache.get(asset);if(wanted()){hybridOverlay=overlay;overlay.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=$('#cutaway').checked?[roofClip]:[];});overlay.visible=true;}}catch(e){overlayCache.delete(asset);toast('보완 영역을 불러오지 못했습니다.');console.error(e);}
}
$('#hybridHighlight').onchange=updateHybridOverlay;
function loadScan(){const asset=mvsAsset;if(mvsCache.has(asset))return mvsCache.get(asset);const pending=new Promise((resolve,reject)=>loader.load(asset+(asset==='mvs-hybrid.glb'?'?v=2':''),g=>{const model=g.scene;model.traverse(o=>{if(o.isMesh){const old=o.material;o.material=new THREE.MeshBasicMaterial({map:old.map,vertexColors:!!o.geometry.attributes.color,side:THREE.DoubleSide,clippingPlanes:$('#cutaway').checked?[roofClip]:[]});softenMVS(o.material);}});model.visible=false;scene.add(model);resolve(model);},undefined,reject)).catch(e=>{mvsCache.delete(asset);throw e;});mvsCache.set(asset,pending);return pending;}
function cameraMarkers(cameras){const verts=[];for(const c of cameras){const p=new THREE.Vector3(...c.position),f=new THREE.Vector3(...c.forward),r=new THREE.Vector3(...c.right),u=new THREE.Vector3(...c.up),dist=.13;
const center=p.clone().addScaledVector(f,dist),w=dist*Math.tan(c.horizontal_fov/2),h=dist*Math.tan(c.vertical_fov/2),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>center.clone().addScaledVector(r,a*w).addScaledVector(u,b*h));
for(let i=0;i<4;i++)verts.push(...p.toArray(),...corners[i].toArray(),...corners[i].toArray(),...corners[(i+1)%4].toArray());}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));return new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xdf9851,transparent:true,opacity:.85,depthTest:true}));}
async function loadMap(){if(mapPromise)return mapPromise;mapPromise=(async()=>{
if(!D.lingbot)throw new Error('Pointcloud metadata unavailable');const response=await fetch(D.lingbot.asset);if(!response.ok)throw new Error('Map HTTP '+response.status);
const {decodePointcloud}=await import('./pointcloud-codec.js');const {n,xyz,rgb,quality}=await decodePointcloud(await response.arrayBuffer());qualityValues=quality;
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(xyz,3));geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3,true));geometry.setAttribute('confidence',new THREE.BufferAttribute(qualityValues,1));geometry.computeBoundingSphere();
mapMaterial=new THREE.ShaderMaterial({vertexColors:true,uniforms:{threshold:{value:6.5},pointSize:{value:5},pixelRatio:{value:renderer.getPixelRatio()},cutRoof:{value:$('#cutaway').checked?1:0}},vertexShader:`
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
let gs,gsPromise,spark,gsRoof,surfaceGS,surfacePromise;let gsVariant='rade';
const extraGS=new Map(),extraGSPromises=new Map();let extraGSReports={};
const gsPanel=document.createElement('section');gsPanel.id='gsControls';gsPanel.hidden=true;
gsPanel.innerHTML='<label for="gsVariant">GS 비교</label><select id="gsVariant" style="width:100%;padding:9px;border:1px solid #dde3de;border-radius:9px;background:#f7f8f4;color:#4e625d"><option value="surface">2DGS · 표면 제약 · 9.4 MB</option><option value="brush">기존 3DGS · Brush · 4.0 MB</option></select><p id="gsStats" style="font-size:12px;line-height:1.6">Gaussian Splatting<br>LingBot 초기화 · 사진 24장<br>6,000단계 · 209,741 splats</p><label>불투명도 <output id="gsOpacityValue">1.0</output><input id="gsOpacity" type="range" min="0.1" max="1" step="0.05" value="1" style="width:100%"></label><p style="font-size:11px;color:#7d8580;line-height:1.6">사진으로 학습한 시각 표현입니다. 빈 영역과 잔상은 남을 수 있으며 충돌용 표면은 아닙니다.</p>';
document.querySelector('aside').insertBefore(gsPanel,$('#mapControls'));
const gsReportsReady=fetch('gs-results.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{extraGSReports=data;for(const [id,report] of Object.entries(data)){const opt=document.createElement('option');opt.value=id;opt.textContent=report.label+" · "+modelSize(report.bytes);$('#gsVariant').appendChild(opt);}$('#gsVariant').value=gsVariant;updateTabSize('gs',extraGSReports[gsVariant]?.bytes||modelFileBytes[gsVariant]);}).catch(()=>{});
$('#gsVariant').onchange=e=>{gsVariant=e.target.value;updateTabSize('gs',modelFileBytes[gsVariant]||extraGSReports[gsVariant]?.bytes);selectModel('gs');};
function updateGSSettings(){const value=Number($('#gsOpacity').value);if(gs)gs.opacity=value;for(const item of extraGS.values()){item.mesh.opacity=value;item.roof.opacity=$('#cutaway').checked?0:1;}if(surfaceGS)surfaceGS.setAppearance(value,$('#cutaway').checked);}
$('#gsOpacity').oninput=()=>{updateGSSettings();$('#gsOpacityValue').textContent=Number($('#gsOpacity').value).toFixed(2);};
async function loadGS(){
 await gsReportsReady;
 if(gsVariant==='rade'&&!extraGSReports.rade)throw new Error('RaDe-GS manifest unavailable');
 if(extraGSReports[gsVariant])return loadExtraGS(gsVariant);
 if(gsVariant==='brush')return loadBrushGS();
 if(!surfacePromise)surfacePromise=(async()=>{const {loadSurfaceGS}=await import('./gs-surface.js');surfaceGS=await loadSurfaceGS(renderer,camera);scene.add(surfaceGS);updateGSSettings();})().catch(e=>{surfacePromise=null;throw e;});
 return surfacePromise;
}
async function loadBrushGS(){
 if(gsPromise)return gsPromise;
 gsPromise=(async()=>{
 const {SparkRenderer,SplatMesh,SplatEdit,SplatEditSdf}=await import('./vendor/spark.module.js');
 if(!spark){spark=new SparkRenderer({renderer});scene.add(spark);}
 const loaded=new SplatMesh({url:'gs-brush-half.spz',editable:true,onProgress:e=>{if(requestNumber&&e.total&&mode!=='gs')$('#modelStatus').textContent='GS 불러오는 중… '+Math.round(e.loaded/e.total*100)+'%';}});
 await loaded.initialized;
 gsRoof=new SplatEditSdf({type:'plane',opacity:0});gsRoof.position.y=2.59;gsRoof.rotation.x=Math.PI/2;
 const edit=new SplatEdit({sdfs:[gsRoof]});loaded.add(edit);edit.add(gsRoof);gsRoof.opacity=$('#cutaway').checked?0:1;
 loaded.visible=false;scene.add(loaded);gs=loaded;
 })().catch(e=>{gsPromise=null;throw e;});return gsPromise;
}
async function loadExtraGS(id){
 if(extraGSPromises.has(id))return extraGSPromises.get(id);
 const pending=(async()=>{const {SparkRenderer,SplatMesh,SplatEdit,SplatEditSdf}=await import('./vendor/spark.module.js');if(!spark){spark=new SparkRenderer({renderer});scene.add(spark);}const report=extraGSReports[id];let options;if(report.parts){const chunks=[];for(const part of report.parts){const response=await fetch(part);if(!response.ok)throw new Error('GS fetch '+response.status);chunks.push(new Uint8Array(await response.arrayBuffer()));}const total=chunks.reduce((n,c)=>n+c.length,0);if(total!==report.bytes)throw new Error('GS size mismatch');const fileBytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){fileBytes.set(chunk,offset);offset+=chunk.length;}options={fileBytes,fileType:'ply'};}else options={url:report.asset};const mesh=new SplatMesh({...options,editable:true});await mesh.initialized;const roof=new SplatEditSdf({type:'plane',opacity:0});roof.position.y=2.59;roof.rotation.x=Math.PI/2;const edit=new SplatEdit({sdfs:[roof]});mesh.add(edit);edit.add(roof);mesh.visible=false;scene.add(mesh);extraGS.set(id,{mesh,roof});updateGSSettings();})().catch(e=>{extraGSPromises.delete(id);throw e;});extraGSPromises.set(id,pending);return pending;
}
function applyMode(next){if(next==='gs'&&mode!=='gs'&&!tourPlaying)preset('entry');mode=next;for(const [id,item] of extraGS)item.mesh.visible=mode==='gs'&&gsVariant===id;if(gs)gs.visible=mode==='gs'&&gsVariant==='brush';if(surfaceGS)surfaceGS.visible=mode==='gs'&&gsVariant==='surface';$('#gsControls').hidden=mode!=='gs';cute.visible=mode==='cute';if(scan)scan.visible=mode==='scan';if(lingbot)lingbot.visible=mode==='lingbot';ground.visible=mode==='cute';
document.querySelectorAll('[data-model]').forEach(b=>{const active=b.dataset.model===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#canvas').setAttribute('aria-label',names[mode]);$('#canvas').setAttribute('aria-labelledby','model-'+mode);
$('#gsStats').innerHTML=gsVariant==='surface'?'2D Gaussian Splatting<br>MVS + 검증된 LingBot 초기화<br>6,000단계 · 283,503 surfels<br>깊이 · 법선 · 바닥 평면 제약':'3D Gaussian Splatting<br>LingBot 초기화 · 사진 24장<br>6,000단계 · 209,741 splats';$('#mvsControls').hidden=mode!=='scan';$('#hybridHighlightRow').hidden=!mvsAsset.startsWith('mvs-hybrid');$('#mvsCompareNote').textContent=mvsAsset.startsWith('mvs-hybrid')?(mvsAsset==='mvs-hybrid-more.glb'?'신뢰도 2 이상 · 보완 점 422,571개. 기존보다 약 2.3배 많은 점을 사용했습니다. 빈 곳이 줄어드는 대신 잘못된 표면이 늘 수 있습니다.':'보수적 보완 · 181,575개 점. 기존 MVS 표면을 유지합니다.'):'같은 깊이맵에서 표면 융합 조건을 비교합니다. 큰 미관측 영역은 남아 있습니다.';updateHybridOverlay();$('#mapControls').hidden=mode!=='lingbot';$('#modeNote').textContent={cute:'기존 복원 좌표를 기준으로 가구를 다듬은 모델입니다.',scan:'SfM/MVS로 복원한 표면 모델입니다. 다른 탭과 같은 시점으로 비교할 수 있습니다.',lingbot:'여러 시점에서 구성한 점군입니다. MVS 모델과 같은 좌표에 정렬했습니다.',gs:'LingBot 점군으로 초기화하고 COLMAP 카메라와 원본 사진으로 학습한 Gaussian Splatting입니다.'}[mode];
if(mode==='scan'&&mvsAsset.startsWith('mvs-hybrid'))$('#modeNote').textContent='MVS 기반 표면에 LingBot 예측으로 누락 영역을 보완한 혼합 복원입니다.';if(mode==='scan'&&mvsAsset==='mvs-lingbot-only.glb'){$('#modeNote').textContent='LingBot 점만으로 만든 표면입니다. COLMAP/MVS 점이나 기존 메시를 합치지 않았습니다.';$('#mvsCompareNote').textContent='형상: LingBot 575,955개 점 → 표면화. 사진 텍스처에는 정렬된 COLMAP 카메라를 사용했습니다. 사진 기반 MVS 재학습과는 다른 비교 후보입니다.';}if(mode==='scan'&&mvsAsset==='mvs-lingbot-repaired.glb'){$('#modeNote').textContent='LingBot only 표면의 작은 구멍과 텍스처 누락 패치를 보정했습니다.';$('#mvsCompareNote').textContent='작은 경계 구멍 36개를 메우고, 텍스처 누락 면 45,431개를 주변 사진 색으로 보간했습니다. 큰 개구부와 원래 형상은 유지했습니다.';}if(mode==='scan'&&mvsAsset==='mvs-sfm-half.glb'){document.querySelector('#modeNote').textContent='SfM/MVS 기반 · 기존 사진 복원';document.querySelector('#mvsCompareNote').textContent='SfM으로 카메라 자세를 추정하고, MVS로 사진 간 깊이를 복원한 기존 표면입니다.';}if(mode==='scan'&&mvsAsset==='mvs-lingbot-half.glb'){document.querySelector('#modeNote').textContent='LingBot points 기반 · 큰 구멍 보정';document.querySelector('#mvsCompareNote').textContent='최대 40cm 경계 구멍 38개, 400개 면 추가. 텍스처 누락 면 50,270개를 주변 색으로 보간했습니다. 실제 개구부 보존 여부를 비교 검토하는 후보입니다.';}if(mode==='scan'&&mvsAsset==='mvs-lingbot-bundle.glb'){document.querySelector('#modeNote').textContent='LingBot · GPU BA + 국소 보정 실험';document.querySelector('#mvsCompareNote').textContent='사진 대응점 37,872개를 카메라와 함께 최적화하고, 주변 90,242개 점에 최대 4cm 보정을 전달했습니다. 전체 점 직접 BA가 아닌 별도 표면 비교 후보입니다.';}if(mode==='gs'&&gsVariant==='surface')$('#modeNote').textContent='표면형 Gaussian을 깊이·법선·바닥 평면 제약으로 학습한 실험입니다. 기존 GS와 같은 시점에서 비교할 수 있습니다.';if(mode==='gs'&&extraGSReports[gsVariant]){const r=extraGSReports[gsVariant];$('#gsStats').textContent=r.label+' · '+r.iteration.toLocaleString()+'단계 · '+r.gaussians.toLocaleString()+' splats';$('#modeNote').textContent='LingBot 초기 점과 사진 24장으로 학습한 비교 결과입니다. 깊이·법선 및 여러 시점의 일관성을 이용합니다.';}$('#modePill').textContent=(mode==='scan'&&mvsAsset.startsWith('mvs-hybrid')?'MVS + LingBot':names[mode])+(mode==='lingbot'?'':' · 약 4 m 폭');$('#modelStatus').textContent='';resize();}
async function selectModel(next){if(!cute)return;const ticket=++requestNumber;$('#modelStatus').textContent=(next==='scan'&&!scan||next==='lingbot'&&!lingbot||next==='gs'&&!gs)?names[next]+' 불러오는 중…':'';
try{if(next==='scan'){const loaded=await loadScan();if(ticket===requestNumber){if(scan)scan.visible=false;scan=loaded;scan.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=$('#cutaway').checked?[roofClip]:[];});}}if(next==='lingbot')await loadMap();if(next==='gs')await loadGS();if(ticket===requestNumber)applyMode(next);}catch(e){if(ticket===requestNumber){$('#modelStatus').textContent='';toast('모델 파일을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');}console.error(e);}}
const tabs=[...document.querySelectorAll('[data-model]')];tabs.forEach((b,index)=>{b.onclick=()=>selectModel(b.dataset.model);b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();selectModel(tabs[next].dataset.model);};});
function updateMapSettings(){if(!mapMaterial)return;const threshold=Number($('#confidence').value),size=Number($('#pointSize').value);mapMaterial.uniforms.threshold.value=threshold;mapMaterial.uniforms.pointSize.value=size;$('#confidenceValue').textContent=threshold.toFixed(1);$('#pointSizeValue').textContent=size.toFixed(1);mapCameraGroup.visible=$('#mapCameras').checked;let count=0;for(const q of qualityValues)if(q>=threshold)count++;$('#mapCount').textContent=count.toLocaleString('ko-KR')+'개 점 · 카메라 좌표 정렬 오차 '+(D.lingbot.alignment.camera_rmse_m*100).toFixed(1)+' cm';}
$('#confidence').oninput=updateMapSettings;$('#pointSize').oninput=updateMapSettings;$('#mapCameras').onchange=updateMapSettings;
$('#cutaway').onchange=()=>{updateGSSettings();if(gsRoof)gsRoof.opacity=$('#cutaway').checked?0:1;if(hybridOverlay)hybridOverlay.traverse(o=>{if(o.isMesh){o.material.clippingPlanes=$('#cutaway').checked?[roofClip]:[];o.material.needsUpdate=true;}});if(mapMaterial)mapMaterial.uniforms.cutRoof.value=$('#cutaway').checked?1:0;if(scan)scan.traverse(o=>{if(o.isMesh){o.material.clippingPlanes=$('#cutaway').checked?[roofClip]:[];o.material.needsUpdate=true;}});};
function cutaway(){if(!cute)return;const cut=$('#cutaway').checked,x=camera.position.x,z=camera.position.z;cute.traverse(o=>{const n=o.name;let hide=false;if(cut){if(n.startsWith('Wall_Left'))hide=x<-2.05;if(n.startsWith('Wall_Right'))hide=x>2.04;if(n.startsWith('Wall_Front')||n.startsWith('Wall_DoorHeader')||n.startsWith('Door_'))hide=z>2.96;if(n.startsWith('Window_')&&!n.startsWith('Window_Tree')&&!n.startsWith('Window_Console')&&!n.startsWith('Window_Stool'))hide=z<-2.63;if(n.startsWith('Wall_Window'))hide=z<-2.63;}if(n.startsWith('Wall_')||n.startsWith('Door_')||(n.startsWith('Window_')&&!n.startsWith('Window_Tree')&&!n.startsWith('Window_Console')&&!n.startsWith('Window_Stool')))o.visible=!hide;});}
const embeddedViewer=window.self!==window.top;
const menuPanel=$('aside');menuPanel.id='viewerMenu';
const menuButton=document.createElement('button');menuButton.id='menuToggle';menuButton.setAttribute('aria-controls','viewerMenu');document.body.append(menuButton);
let menuPinned=!embeddedViewer,menuHover=false,menuCloseTimer;
function updateMenu(){
 const open=menuPinned||menuHover;
 document.body.classList.toggle('menu-collapsed',!open);document.body.classList.toggle('menu-overlay',embeddedViewer||!menuPinned);
 menuPanel.inert=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'메뉴 접기':'메뉴';
 resize();
}
function previewMenu(){clearTimeout(menuCloseTimer);if(!menuPinned){menuHover=true;updateMenu();}}
function leaveMenu(){clearTimeout(menuCloseTimer);menuCloseTimer=setTimeout(()=>{if(!menuPinned&&!menuPanel.matches(':hover')&&!menuButton.matches(':hover')&&!menuPanel.contains(document.activeElement)){menuHover=false;updateMenu();}},220);}
menuButton.onclick=()=>{clearTimeout(menuCloseTimer);menuPinned=!menuPinned;menuHover=false;updateMenu();};
for(const element of [menuButton,menuPanel]){element.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')previewMenu();});element.addEventListener('pointerleave',leaveMenu);}
menuPanel.addEventListener('focusout',leaveMenu);
const fullscreenButton=document.createElement('button');fullscreenButton.id='sceneFullscreen';fullscreenButton.textContent='전체화면';fullscreenButton.setAttribute('aria-pressed','false');document.body.append(fullscreenButton);
let expandedScene=false;
function setExpanded(value){expandedScene=value;document.body.classList.toggle('scene-expanded',value);fullscreenButton.textContent=value?'전체화면 닫기':'전체화면';fullscreenButton.setAttribute('aria-pressed',String(value));resize();}
fullscreenButton.onclick=async()=>{
 if(expandedScene){if(document.fullscreenElement)await document.exitFullscreen();setExpanded(false);return;}
 setExpanded(true);
 try{await document.documentElement.requestFullscreen();}catch{/* Keep an in-page expanded view when fullscreen is unavailable. */}
};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)setExpanded(false);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&expandedScene&&!document.fullscreenElement)setExpanded(false);});
function resize(){if(expandedScene){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setViewport(0,0,innerWidth,innerHeight);return;}const mobile=innerWidth<=720,width=(mobile||embeddedViewer||!menuPinned)?innerWidth:Math.max(300,innerWidth-290),bottom=(mobile&&menuPinned&&!embeddedViewer)?innerHeight-$('aside').getBoundingClientRect().top+14:45,top=Math.ceil($('header').getBoundingClientRect().bottom)+(mobile?12:18),height=Math.max(150,innerHeight-bottom-top);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setViewport(0,bottom,width,height);$('footer').style.bottom=(mobile?bottom+4:24)+'px';}
updateMenu();window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('header'));resize();
let lastFrame=performance.now();
function animate(){requestAnimationFrame(animate);const now=performance.now(),dt=(now-lastFrame)/1000;lastFrame=now;if(tourPlaying)tickTour(dt);else if(!dalgu?.active)controls.update();dalgu?.tick(dt);cutaway();renderer.render(scene,camera);}animate();
window.labViewer={scene,camera,renderer,controls,preset,selectModel,get mode(){return mode;},get cute(){return cute;},get scan(){return scan;},get lingbot(){return lingbot;},get gs(){return extraGS.get(gsVariant)?.mesh||(gsVariant==='surface'?surfaceGS:gs);},get gsVariant(){return gsVariant;}};
