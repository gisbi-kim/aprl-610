const translations = [["모델 비교", "Compare models"], ["3D 모델 선택", "Select a 3D model"], ["3D 모델", "3D Model"], ["연구실 둘러보기", "Explore the lab"], ["미니어처", "Miniature"], ["평면 보기", "Top view"], ["입구에서", "From entrance"], ["창가에서", "From window"], ["촬영 시점 둘러보기", "Browse camera views"], ["이전 시점", "Previous view"], ["다음 시점", "Next view"], ["벽·천장 열어 보기", "Hide walls and ceiling"], ["Pointcloud 표시 설정", "Pointcloud settings"], ["신뢰도 필터", "Confidence filter"], ["점 크기", "Point size"], ["촬영 위치 표시", "Show camera positions"], ["드래그 회전 · 휠 확대 · 오른쪽 드래그 이동", "Drag to orbit · Scroll to zoom · Right-drag to pan"], ["모델 탭을 바꾸어도 현재 시점이 유지됩니다.", "Your viewpoint stays the same when switching models."], ["연구실을 여는 중…", "Loading the lab…"], ["달구와 산책", "Walk with Dalgu"], ["달구 시점", "Dalgu's view"], ["따라가기", "Follow Dalgu"], ["둘러보기로", "Back to overview"], ["키 1.0 m", "Height: 1.0 m"], ["WASD · 방향키 이동 · 마우스 시선", "WASD / Arrow keys to move · Mouse to look"], ["WASD · 방향키 이동", "WASD / Arrow keys to move"], ["화면 클릭 후 마우스로 시선 조절 · Esc 해제", "Click the scene to look with the mouse · Esc to release"], ["Esc를 누르면 마우스가 풀립니다.", "Press Esc to release the mouse."], ["달구 위치 초기화", "Reset Dalgu's position"], ["달구 모델을 불러오지 못했습니다. 새로고침해 주세요.", "Could not load Dalgu. Please refresh the page."], ["모델을 열지 못했습니다. 페이지를 새로고침해 주세요.", "Could not open the model. Please refresh the page."], ["모델 파일을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.", "Could not load the model file. Refresh and try again."], ["보완 영역을 불러오지 못했습니다.", "Could not load the supplementary region."], ["자유 시점", "Free view"], ["MVS 비교", "Compare MVS"], ["GS 비교", "Compare GS"], ["LingBot points 기반", "LingBot points"], ["SfM/MVS 기반", "SfM/MVS"], ["채도", "Saturation"], ["LingBot 보완 부분 표시", "Highlight LingBot additions"], ["같은 깊이맵에서 표면 융합 조건을 비교합니다. 큰 미관측 영역은 남아 있습니다.", "Compare surface fusion settings using the same depth maps. Large unobserved areas remain."], ["표면 제약", "Surface constraints"], ["기존 3DGS", "Original 3DGS"], ["LingBot 초기화 · 사진 24장", "LingBot initialization · 24 photos"], ["MVS + 검증된 LingBot 초기화", "MVS + validated LingBot initialization"], ["깊이 · 법선 · 바닥 평면 제약", "Depth, normal and floor-plane constraints"], ["불투명도", "Opacity"], ["사진으로 학습한 시각 표현입니다. 빈 영역과 잔상은 남을 수 있으며 충돌용 표면은 아닙니다.", "A visual representation learned from photos. Gaps and ghosting may remain; this is not a collision surface."], ["기존 복원 좌표를 기준으로 가구를 다듬은 모델입니다.", "A furnished 3D model aligned with the reconstructed room."], ["SfM/MVS로 복원한 표면 모델입니다. 다른 탭과 같은 시점으로 비교할 수 있습니다.", "A surface reconstructed with SfM/MVS. Compare models from the same viewpoint."], ["여러 시점에서 구성한 점군입니다. MVS 모델과 같은 좌표에 정렬했습니다.", "A point cloud built from multiple views, aligned with the MVS model."], ["LingBot 점군으로 초기화하고 COLMAP 카메라와 원본 사진으로 학습한 Gaussian Splatting입니다.", "Gaussian Splatting initialized from LingBot points and trained with COLMAP cameras and the original photos."], ["SfM으로 카메라 자세를 추정하고, MVS로 사진 간 깊이를 복원한 기존 표면입니다.", "The original surface, using SfM camera poses and multi-view stereo depth reconstruction."], ["최대 40cm 경계 구멍 38개, 400개 면 추가. 텍스처 누락 면 50,270개를 주변 색으로 보간했습니다. 실제 개구부 보존 여부를 비교 검토하는 후보입니다.", "Filled 38 boundary holes up to 40 cm with 400 faces. Colors on 50,270 untextured faces were interpolated from their surroundings. Inspect whether real openings are preserved."], ["표면형 Gaussian을 깊이·법선·바닥 평면 제약으로 학습한 실험입니다. 기존 GS와 같은 시점에서 비교할 수 있습니다.", "Surface Gaussians trained with depth, normal and floor-plane constraints. Compare against the other GS models from the same viewpoint."], ["LingBot 초기 점과 사진 24장으로 학습한 비교 결과입니다. 깊이·법선 및 여러 시점의 일관성을 이용합니다.", "Trained from LingBot seed points and 24 photos, using depth, normals and multi-view consistency."], ["기존 사진 복원", "Original photo reconstruction"], ["큰 구멍 보정", "Larger-hole repair"], ["약 4 m 폭", "Approx. 4 m wide"], ["개 점 · 카메라 좌표 정렬 오차", " points · Camera alignment error"], ["불러오는 중…", "loading…"], ["단계", " steps"]];
// Keep source text per DOM node so live status updates and language changes remain reversible.
let language = 'en';
try { language = localStorage.getItem('aprl-language') === 'ko' ? 'ko' : 'en'; } catch {}
translations.push(['Space 점프 · 공중에서 한 번 더 누르면 2단 점프','Space to jump · Press again in midair to double jump'],['점프 · 2단 점프','Jump / Double jump'],['GS 탭은 입구 시점으로 시작합니다.','The GS tab starts from the entrance.'],['자동 둘러보기 재생','Play auto tour'],['자동 둘러보기 정지','Stop auto tour'],['자동 둘러보기','Auto tour']);
const sources = new WeakMap();
const rules = translations.sort((a,b)=>b[0].length-a[0].length);
function translate(value) { return rules.reduce((s,[ko,en])=>s.split(ko).join(en),value); }
const switcher = document.createElement('div');
switcher.id='languageSwitcher';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Language / 언어');
switcher.innerHTML='<button type="button" data-language="en">English</button><button type="button" data-language="ko">한국어</button>';
document.querySelector('aside').prepend(switcher);
const observer = new MutationObserver(render);
function render() {
 observer.disconnect();
 document.documentElement.lang=language;
 for (const root of document.querySelectorAll('aside,footer,#loading,#toast')) {
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
   const node=walker.currentNode;if(switcher.contains(node))continue;
   let entry=sources.get(node);
   if(!entry || node.nodeValue!==entry.rendered)entry={source:node.nodeValue};
   entry.rendered=language==='en'?translate(entry.source):entry.source;
   if(node.nodeValue!==entry.rendered)node.nodeValue=entry.rendered;
   sources.set(node,entry);
  }
  for(const element of [root,...root.querySelectorAll('[aria-label],[title]')]){
   if(switcher.contains(element))continue;
   for(const name of ['aria-label','title']){
    const attr=element.getAttributeNode(name);if(!attr)continue;
    let entry=sources.get(attr);if(!entry||attr.value!==entry.rendered)entry={source:attr.value};
    entry.rendered=language==='en'?translate(entry.source):entry.source;attr.value=entry.rendered;sources.set(attr,entry);
   }
  }
 }
 for(const button of switcher.querySelectorAll('button')){const active=button.dataset.language===language;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});
}
switcher.addEventListener('click',event=>{const next=event.target.dataset.language;if(!next)return;language=next;try{localStorage.setItem('aprl-language',language);}catch{}render();});
render();
