/* POINTS Question Hunter 3D — Three.js gameplay scenes */
(function(){
"use strict";
const THREE_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
let threePromise=null, active=null;
function loadThree(){
 if(window.THREE)return Promise.resolve(window.THREE);
 if(threePromise)return threePromise;
 threePromise=new Promise((resolve,reject)=>{
  const s=document.createElement("script");s.src=THREE_URL;s.onload=()=>window.THREE?resolve(window.THREE):reject(Error("تعذر تحميل محرك 3D"));
  s.onerror=()=>reject(Error("تعذر تحميل محرك 3D. تحقق من اتصال الإنترنت."));document.head.appendChild(s);
 });return threePromise;
}
function mat(T,color,rough=.75,metal=0){return new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function box(T,w,h,d,m,x=0,y=0,z=0){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
function sphere(T,r,m,x=0,y=0,z=0){const o=new T.Mesh(new T.SphereGeometry(r,18,14),m);o.position.set(x,y,z);o.castShadow=true;return o;}
function capsulePerson(T,group,uniform,skin,hat){
 const body=box(T,.62,.9,.38,uniform,0,1.05,0);group.add(body);
 const head=sphere(T,.27,skin,0,1.72,0);group.add(head);
 const cap=hat?sphere(T,.29,hat,0,1.94,0):null;if(cap){cap.scale.set(1,.35,1);group.add(cap);}
 const leg1=box(T,.2,.68,.23,uniform,-.18,.34,0),leg2=box(T,.2,.68,.23,uniform,.18,.34,0);group.add(leg1,leg2);
 const arm1=box(T,.17,.62,.2,uniform,-.4,1.12,0),arm2=box(T,.17,.62,.2,uniform,.4,1.12,0);group.add(arm1,arm2);
 return {body,head,leg1,leg2,arm1,arm2};
}
function makeButton(label,fn,host,cls=""){
 const b=document.createElement("button");b.type="button";b.textContent=label;b.style.cssText="border:0;border-radius:14px;padding:13px 16px;background:#0f766e;color:white;font-weight:900;font-size:15px;min-width:62px;box-shadow:0 4px 0 #115e59;touch-action:manipulation;"+cls;b.addEventListener("pointerdown",e=>{e.preventDefault();fn(true);});b.addEventListener("pointerup",()=>fn(false));b.addEventListener("pointerleave",()=>fn(false));b.addEventListener("pointercancel",()=>fn(false));host.appendChild(b);return b;
}
function createHost(T,opts){
 const root=document.getElementById("questionHunterContent");root.replaceChildren();
 const wrap=document.createElement("div");wrap.style.cssText="background:linear-gradient(145deg,#071b3a,#102e52);border-radius:20px;padding:12px;color:white;overflow:hidden;";
 const head=document.createElement("div");head.style.cssText="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 3px 12px;font-weight:900;";
 const title=document.createElement("span");title.textContent=opts.title;
 const score=document.createElement("span");score.textContent=opts.stats;
 head.append(title,score);
 const viewport=document.createElement("div");viewport.style.cssText="height:clamp(300px,58vw,490px);min-height:300px;position:relative;border-radius:15px;overflow:hidden;background:#7dd3fc;touch-action:none;";
 const hint=document.createElement("div");hint.textContent=opts.hint;hint.style.cssText="text-align:center;padding:10px 4px 6px;font-weight:800;line-height:1.7;color:#e0f2fe;";
 const controls=document.createElement("div");controls.style.cssText="display:flex;justify-content:center;align-items:center;gap:9px;flex-wrap:wrap;padding:10px 0 4px;";
 const exit=document.createElement("button");exit.textContent="✕ خروج";exit.style.cssText="border:1px solid #94a3b8;border-radius:12px;padding:10px 14px;background:#334155;color:white;font-weight:800;margin-top:8px;";exit.onclick=()=>stop(true);
 wrap.append(head,viewport,hint,controls,exit);root.appendChild(wrap);
 const scene=new T.Scene();scene.background=new T.Color(opts.sky||0x8bd5f5);scene.fog=new T.Fog(opts.sky||0x8bd5f5,22,75);
 const camera=new T.PerspectiveCamera(58,1,.1,120);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.setSize(viewport.clientWidth,viewport.clientHeight);viewport.appendChild(renderer.domElement);
 const hemi=new T.HemisphereLight(0xffffff,0x55705a,1.05);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffffff,1.35);sun.position.set(-8,15,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const clock=new T.Clock();let raf=0,ended=false,resizeObs=null;
 function resize(){const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
 if(window.ResizeObserver){resizeObs=new ResizeObserver(resize);resizeObs.observe(viewport);}else window.addEventListener("resize",resize);
 active={scene,camera,renderer,clock,raf,viewport,controls,wrap,ended,cleanup:()=>{ended=true;cancelAnimationFrame(raf);if(resizeObs)resizeObs.disconnect();else window.removeEventListener("resize",resize);renderer.dispose();renderer.domElement.remove();}};
 const cleanup=active.cleanup;
 return {scene,camera,renderer,clock,viewport,controls,hint,score,cleanup,render(fn){const tick=()=>{if(!active||active.ended)return;const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;fn(dt,t);renderer.render(scene,camera);active.raf=requestAnimationFrame(tick);};active.raf=requestAnimationFrame(tick);},finish(ok,message){if(!active||active.ended)return;active.ended=true;cancelAnimationFrame(active.raf);hint.textContent=message;controls.replaceChildren();const b=document.createElement("button");b.textContent=ok?"🎉 افتح السؤال":"انتهت المحاولة";b.style.cssText="border:0;border-radius:14px;padding:15px 22px;background:"+(ok?"#16a34a":"#b91c1c")+";color:white;font-size:18px;font-weight:900;";b.onclick=()=>{const cb=ok?opts.onSuccess:opts.onMiss;this.cleanup();if(cb)cb();};controls.appendChild(b);}};
}
function floor(T,scene,color=0x4d9b58,w=36,d=80){const g=box(T,w,.3,d,mat(T,color),0,-.18,-24);scene.add(g);return g;}
function tree(T,scene,x,z){const trunk=box(T,.32,1.4,.32,mat(T,0x754323),x,.65,z);const crown=sphere(T,.95,mat(T,0x23864b),x,1.9,z);scene.add(trunk,crown);}
function makeChest(T,scene,x,z){const g=new T.Group();g.position.set(x,0,z);g.add(box(T,1.05,.62,.72,mat(T,0x9a4d13),0,.38,0));g.add(box(T,1.08,.18,.76,mat(T,0xe5a52e),0,.77,0));g.add(box(T,.17,.3,.08,mat(T,0xfde68a),0,.48,-.4));const glow=new T.PointLight(0xffc928,1.5,5);glow.position.set(0,1.3,0);g.add(glow);scene.add(g);return g;}
function tap(T,opts){
 const g=createHost(T,{title:"🎯 ساحة التصويب 3D",stats:opts.stats,hint:"المس الهدف الطائر بالضغط عليه قبل أن يبتعد! أصب الهدف لفتح السؤال.",sky:0x9bd8f4,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x426b45,36,44);
 for(let i=0;i<8;i++){const post=box(T,.22,2.8,.22,mat(T,0x8b5a2b),-13+i*3.7,1.3,-12-(i%3)*5);g.scene.add(post);}
 const target=new T.Group();g.scene.add(target);
 const disk=new T.Mesh(new T.CylinderGeometry(1.05,1.05,.22,32),mat(T,0xef4444,.3));disk.rotation.x=Math.PI/2;target.add(disk);
 const ring=new T.Mesh(new T.TorusGeometry(.72,.12,10,32),mat(T,0xffffff));ring.position.z=.15;target.add(ring);
 const bull=new T.Mesh(new T.SphereGeometry(.28,20,16),mat(T,0xfacc15));bull.position.z=.18;target.add(bull);
 const stand=box(T,.18,3,.18,mat(T,0x64748b),0,1.5,-17);g.scene.add(stand);
 g.camera.position.set(0,7,17);g.camera.lookAt(0,2,-9);
 let done=false,shots=0;const ray=new T.Raycaster(),mouse=new T.Vector2();
 g.viewport.addEventListener("pointerdown",e=>{if(done)return;const r=g.renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,g.camera);if(ray.intersectObject(target,true).length){done=true;g.finish(true,"🎯 إصابة مباشرة! أحسنت التصويب.");}else{shots++;g.hint.textContent="لم تصب الهدف! حاول مرة أخرى.";if(shots>=5){done=true;g.finish(false,"انتهت المحاولات قبل إصابة الهدف.");}}});
 g.render((dt,t)=>{if(done)return;target.position.set(Math.sin(t*1.25)*5,2.5+Math.sin(t*2.2)*1.25,-12);target.rotation.z=Math.sin(t)*.25;g.score.textContent="المحاولات: "+shots+"/5";});
}
function rocket(T,opts){
 const g=createHost(T,{title:"🚀 قاعدة الصواريخ 3D",stats:opts.stats,hint:"اضغط على زر الإطلاق لتصيب الهدف المتحرك بالصاروخ. لديك ثلاث محاولات.",sky:0x111b3c,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x374151,38,48);
 const target=new T.Group();g.scene.add(target);
 const core=sphere(T,.85,mat(T,0xf97316,.3),0,0,0);target.add(core);
 const halo=new T.Mesh(new T.TorusGeometry(1.1,.12,10,32),mat(T,0xfacc15));target.add(halo);
 const launcher=new T.Group();g.scene.add(launcher);
 launcher.add(box(T,1.4,.5,1.8,mat(T,0x475569),0,.3,0));
 const tube=new T.Mesh(new T.CylinderGeometry(.22,.3,2,16),mat(T,0x94a3b8));tube.rotation.x=Math.PI/2;tube.position.set(0,.7,-.5);launcher.add(tube);
 const rocketMesh=new T.Group();g.scene.add(rocketMesh);
 const body=new T.Mesh(new T.CylinderGeometry(.16,.16,1.2,16),mat(T,0xef4444));body.rotation.x=Math.PI/2;rocketMesh.add(body);
 const nose=new T.Mesh(new T.ConeGeometry(.18,.42,16),mat(T,0xf8fafc));nose.rotation.x=-Math.PI/2;nose.position.z=-.8;rocketMesh.add(nose);
 const flame=sphere(T,.18,mat(T,0xf59e0b),0,0,.7);rocketMesh.add(flame);rocketMesh.visible=false;
 g.camera.position.set(0,7,20);g.camera.lookAt(0,2,-9);
 let shots=0,flight=false,progress=0,done=false;
 const fire=()=>{if(done||flight)return;if(shots>=3){done=true;g.finish(false,"نفدت الصواريخ!");return;}shots++;flight=true;progress=0;rocketMesh.position.set(0,1.2,8);rocketMesh.visible=true;g.score.textContent="الصواريخ: "+(3-shots)+"/3";};
 makeButton("🚀 إطلاق الصاروخ",fire,g.controls,"background:#dc2626");
 g.render((dt,t)=>{if(done)return;target.position.set(Math.sin(t*1.35)*4,3+Math.sin(t*2)*1.1,-13);target.rotation.y+=dt*1.8;if(flight){progress+=dt*9;rocketMesh.position.z=8-progress;rocketMesh.position.x+=(target.position.x-rocketMesh.position.x)*dt*1.7;rocketMesh.position.y+=(target.position.y-rocketMesh.position.y)*dt*1.7;rocketMesh.lookAt(target.position);if(rocketMesh.position.distanceTo(target.position)<1.15){done=true;flight=false;rocketMesh.visible=false;g.finish(true,"💥 إصابة الهدف! افتح السؤال.");}else if(progress>22){flight=false;rocketMesh.visible=false;if(shots>=3){done=true;g.finish(false,"أخطأت الصواريخ الثلاثة الهدف.");}else g.hint.textContent="أخطأت الهدف. أطلق مرة أخرى!";}}});
}
function treasure(T,opts){
 const g=createHost(T,{title:"🗝️ كنز المعرفة 3D",stats:opts.stats,hint:"حرّك المستكشف نحو صناديق الكنز باستخدام الأسهم أو الأزرار. كل صندوق يفتح سؤالًا جديدًا.",sky:0x87ceeb,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x6b9b45,40,90);
 for(let i=0;i<16;i++){tree(T,g.scene,(i%2?1:-1)*(7+(i%4)*1.3),-i*4-4);}
 const explorer=new T.Group();g.scene.add(explorer);const p=capsulePerson(T,explorer,mat(T,0x2563eb),mat(T,0xf1c27d),mat(T,0xf59e0b));
 explorer.position.set(0,0,5);
 const chests=[[-3,-8],[3,-17],[-3,-27],[3,-38],[0,-49]].map(v=>makeChest(T,g.scene,v[0],v[1]));
 const keys={};let collected=0,finished=false;
 g.camera.position.set(0,5,11);g.camera.lookAt(0,1,-8);
 const move=(k,v)=>keys[k]=v;
 makeButton("◀",v=>move("left",v),g.controls);makeButton("▲",v=>move("up",v),g.controls);makeButton("▼",v=>move("down",v),g.controls);makeButton("▶",v=>move("right",v),g.controls);
 window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);
 function keyDown(e){if(["ArrowLeft","a","A"].includes(e.key))move("left",true);if(["ArrowRight","d","D"].includes(e.key))move("right",true);if(["ArrowUp","w","W"].includes(e.key))move("up",true);if(["ArrowDown","s","S"].includes(e.key))move("down",true);}
 function keyUp(e){if(["ArrowLeft","a","A"].includes(e.key))move("left",false);if(["ArrowRight","d","D"].includes(e.key))move("right",false);if(["ArrowUp","w","W"].includes(e.key))move("up",false);if(["ArrowDown","s","S"].includes(e.key))move("down",false);}
 const oldCleanup=g.cleanup;g.cleanup=()=>{window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);oldCleanup();};
 g.render((dt,t)=>{if(finished)return;const dx=(keys.right?1:0)-(keys.left?1:0),dz=(keys.down?1:0)-(keys.up?1:0);explorer.position.x=Math.max(-5,Math.min(5,explorer.position.x+dx*dt*5));explorer.position.z=Math.max(-52,Math.min(8,explorer.position.z+dz*dt*5));p.leg1.rotation.x=Math.sin(t*12)*Math.min(1,Math.abs(dx)+Math.abs(dz))*.7;p.leg2.rotation.x=-p.leg1.rotation.x;g.camera.position.x+=(explorer.position.x*.6-g.camera.position.x)*dt*2;g.camera.position.z+=(explorer.position.z+7-g.camera.position.z)*dt*2;g.camera.lookAt(explorer.position.x,1,explorer.position.z-8);chests.forEach((c,i)=>{c.rotation.y=Math.sin(t*1.5+i)*.18;if(!c.userData.taken&&explorer.position.distanceTo(c.position)<1.65){c.userData.taken=true;c.visible=false;collected++;g.score.textContent="الكنوز: "+collected+"/5";if(collected===5){finished=true;g.finish(true,"🏆 جمعت كل الكنوز!");}}});});
}
function race(T,opts){
 const g=createHost(T,{title:"🏎️ سباق الأبطال 3D",stats:opts.stats,hint:"تحكم يمينًا ويسارًا لتفادي الحواجز. أكمل المضمار واعبر خط النهاية لفتح السؤال.",sky:0x9bd7f5,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x287b42,38,100);
 const road=box(T,12,.18,100,mat(T,0x30343b),0,0,-30);g.scene.add(road);
 for(let z=12;z>-78;z-=5){g.scene.add(box(T,.13,.025,2,mat(T,0xffffff),0,.11,z));}
 for(let side of [-1,1])for(let z=8;z>-80;z-=7){tree(T,g.scene,side*9,z);}
 const car=new T.Group();g.scene.add(car);car.add(box(T,1.55,.55,2.5,mat(T,0xef2929),0,.7,0));car.add(box(T,1.05,.55,1.05,mat(T,0x93c5fd,.25),0,1.2,-.2));for(let x of [-.82,.82])for(let z of [-.75,.75]){const w=sphere(T,.32,mat(T,0x111827),x,.42,z);w.scale.set(.55,1,1);car.add(w);}car.position.set(0,0,6);
 const obstacles=[];for(let i=0;i<12;i++){const o=box(T,1.3,.8,1.3,mat(T,[0xf97316,0xfacc15,0x9333ea][i%3]),(i%3-1)*3,-.02,-8-i*6);g.scene.add(o);obstacles.push(o);}
 const finish=box(T,12,.16,.5,mat(T,0xfacc15),0,.2,-78);g.scene.add(finish);
 let lane=0,dist=0,done=false,crashes=0;const set=(n)=>lane=Math.max(-1,Math.min(1,lane+n));
 makeButton("⬅️",()=>set(-1),g.controls);makeButton("➡️",()=>set(1),g.controls);
 g.render((dt,t)=>{if(done)return;dist+=dt*9;car.position.x+=(lane*3-car.position.x)*dt*5;car.position.z=6-dist;car.rotation.z+=(lane*.12-car.rotation.z)*dt*4;g.camera.position.set(car.position.x*.35,5,car.position.z+10);g.camera.lookAt(car.position.x,1,car.position.z-9);obstacles.forEach(o=>{if(!o.userData.hit&&Math.abs(o.position.z-car.position.z)<1.2&&Math.abs(o.position.x-car.position.x)<1.25){o.userData.hit=true;o.material=mat(T,0x555555);crashes++;dist=Math.max(0,dist-5);g.hint.textContent="💥 اصطدام! تفادى الحواجز. الاصطدامات: "+crashes+"/3";if(crashes>=3){done=true;g.finish(false,"انتهى السباق بسبب الاصطدامات الكثيرة.");}}});g.score.textContent="المسافة: "+Math.min(100,Math.round(dist/0.84))+"%";if(dist>=84&&!done){done=true;g.finish(true,"🏁 وصلت إلى خط النهاية!");}});
}
function blocks(T,opts){
 const g=createHost(T,{title:"🧊 تحدي المكعبات 3D",stats:opts.stats,hint:"تحرك بين المنصات واجمع المكعبات الذهبية الخمسة. استخدم الأسهم أو الأزرار.",sky:0x9cccf4,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x334155,35,90);
 const platforms=[];for(let i=0;i<10;i++){const x=(i%2?2.5:-2.5),z=-i*6;const pl=box(T,5,.55,4,mat(T,i%2?0x475569:0x64748b),x,-.2,z);g.scene.add(pl);platforms.push(pl);}
 const avatar=new T.Group();g.scene.add(avatar);capsulePerson(T,avatar,mat(T,0x7c3aed),mat(T,0xf1c27d),mat(T,0xfde047));avatar.position.set(-2.5,0,5);
 const cubes=[];for(let i=0;i<5;i++){const c=box(T,.9,.9,.9,mat(T,0xfacc15,.25,.35),(i%2?2.5:-2.5),.8,-5-i*10);c.rotation.set(.3,.4,.2);g.scene.add(c);cubes.push(c);}
 const keys={};const bind=(k,v)=>keys[k]=v;makeButton("◀",v=>bind("l",v),g.controls);makeButton("▲",v=>bind("u",v),g.controls);makeButton("▼",v=>bind("d",v),g.controls);makeButton("▶",v=>bind("r",v),g.controls);
 let got=0,done=false;const kd=e=>{if(e.key==="ArrowLeft")bind("l",true);if(e.key==="ArrowRight")bind("r",true);if(e.key==="ArrowUp")bind("u",true);if(e.key==="ArrowDown")bind("d",true);},ku=e=>{if(e.key==="ArrowLeft")bind("l",false);if(e.key==="ArrowRight")bind("r",false);if(e.key==="ArrowUp")bind("u",false);if(e.key==="ArrowDown")bind("d",false);};window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);const old=g.cleanup;g.cleanup=()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);old();};
 g.camera.position.set(0,7,12);g.render((dt,t)=>{if(done)return;avatar.position.x=Math.max(-5,Math.min(5,avatar.position.x+((keys.r?1:0)-(keys.l?1:0))*dt*5));avatar.position.z=Math.max(-49,Math.min(8,avatar.position.z+((keys.d?1:0)-(keys.u?1:0))*dt*5));g.camera.position.x+=(avatar.position.x-g.camera.position.x)*dt*2;g.camera.position.z+=(avatar.position.z+9-g.camera.position.z)*dt*2;g.camera.lookAt(avatar.position.x,0,avatar.position.z-7);cubes.forEach(c=>{c.rotation.x+=dt;c.rotation.y+=dt*1.4;if(!c.userData.got&&avatar.position.distanceTo(c.position)<1.5){c.userData.got=true;c.visible=false;got++;g.score.textContent="المكعبات: "+got+"/5";if(got===5){done=true;g.finish(true,"✨ اكتمل بناء المكعبات!");}}});});
}
function football(T,opts){
  const g=createHost(T,{title:"⚽ ركلة الجزاء 3D",stats:opts.stats,hint:"الكرة الحمراء أمام اللاعب. اختر الزاوية، ثم سدد. الحارس يتحرك باستمرار وقد يقفز للتصدي!",sky:0x8bc9ed,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
  const scene=g.scene; floor(T,scene,0x21834b,42,62);
  const line=mat(T,0xffffff,.55);
  scene.add(box(T,22,.035,.09,line,0,.02,-8),box(T,22,.035,.09,line,0,.02,-20));
  scene.add(box(T,.09,.035,12,line,-11,.02,-14),box(T,.09,.035,12,line,11,.02,-14),box(T,10,.04,.08,line,0,.03,7));
  const spot=new T.Mesh(new T.CircleGeometry(.16,24),line);spot.rotation.x=-Math.PI/2;spot.position.set(0,.025,4.2);scene.add(spot);
  const goal=new T.Group();scene.add(goal);
  const postMat=mat(T,0xffffff,.32,.12),netMat=mat(T,0xe7f2ff,.55);
  goal.add(box(T,.22,4.5,.22,postMat,-4.8,2.25,-16),box(T,.22,4.5,.22,postMat,4.8,2.25,-16),box(T,9.8,.22,.22,postMat,0,4.5,-16));
  const netBars=[];
  for(let x=-4.5;x<=4.51;x+=.5){const v=box(T,.025,4.25,.025,netMat,x,2.15,-16.12);goal.add(v);netBars.push({mesh:v,base:-16.12,phase:x*1.7});}
  for(let y=.35;y<=4.2;y+=.45){const h=box(T,9.5,.025,.025,netMat,0,y,-16.12);goal.add(h);netBars.push({mesh:h,base:-16.12,phase:y*2.1});}
  const keeper=new T.Group();scene.add(keeper);
  const kp=capsulePerson(T,keeper,mat(T,0x16a34a),mat(T,0xf1c27d),mat(T,0x111827));keeper.position.set(0,0,-14.3);
  const kicker=new T.Group();scene.add(kicker);
  const player=capsulePerson(T,kicker,mat(T,0x2563eb),mat(T,0xf1c27d),mat(T,0xffffff));kicker.position.set(0,0,6.4);
  // Bright red 3D football with dark panels
  const ball=new T.Group();scene.add(ball);const ballRadius=.48;
  ball.add(sphere(T,ballRadius,mat(T,0xf00018,.28),0,0,0));
  const panelMat=mat(T,0x65000b,.5);
  const dirs=[[0,1,0],[.85,.32,0],[-.85,.32,0],[0,.32,.85],[0,.32,-.85],[.55,-.55,.55],[-.55,-.55,.55],[.55,-.55,-.55],[-.55,-.55,-.55]];
  dirs.forEach(d=>{const n=new T.Vector3(...d).normalize(),v=n.clone().multiplyScalar(ballRadius*.985),p=sphere(T,.105,panelMat,v.x,v.y,v.z);p.scale.set(1,.9,.18);p.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);ball.add(p);});
  ball.position.set(0,.5,3.8);g.camera.position.set(0,7.2,20);g.camera.lookAt(0,1.8,-7);
  let direction=0,shot=false,elapsed=0,finished=false,netTime=0,finishDelay=0;
  [{label:"⬅️ الزاوية اليسرى",v:-1},{label:"🎯 الوسط",v:0},{label:"➡️ الزاوية اليمنى",v:1}].forEach(c=>makeButton(c.label,()=>{if(!shot){direction=c.v;g.hint.textContent="تم اختيار "+c.label+" — اضغط سدد الكرة";}},g.controls));
  makeButton("⚽ سدد الكرة",()=>{if(shot||finished)return;shot=true;g.controls.querySelectorAll("button").forEach(b=>{b.disabled=true;b.style.opacity=".5";});g.hint.textContent="🏃 اللاعب يركل الكرة... والحارس يتحرك للتصدي!";},g.controls,"background:#dc2626");
  g.render((dt,t)=>{
    if(finished)return;
    if(netTime>0){netTime+=dt;const strength=Math.max(0,1-netTime/1.05);netBars.forEach(b=>{b.mesh.position.z=b.base+Math.sin(netTime*34+b.phase)*.42*strength;});finishDelay+=dt;if(finishDelay>=1.05){finished=true;g.finish(true,"⚽ جوووول! اهتزت الشباك بعد دخول الكرة!");}return;}
    if(!shot){keeper.position.x=Math.sin(t*1.75)*2.85;keeper.rotation.z=Math.sin(t*1.75)*.06;ball.rotation.y+=dt*.7;return;}
    elapsed+=dt;const p=Math.min(1,elapsed/1.42),ease=p*p*(3-2*p);
    ball.position.x=direction*3.65*ease;ball.position.y=.5+Math.sin(p*Math.PI)*3.05;ball.position.z=3.8-21.1*ease;
    ball.rotation.x-=dt*12;ball.rotation.z+=dt*9;
    const patrol=Math.sin(t*1.75)*2.25,dive=direction*3.35,diveBlend=Math.max(0,Math.min(1,(p-.22)*2.2));
    keeper.position.x=patrol*(1-diveBlend)+dive*diveBlend;
    keeper.rotation.z+=(direction===0?Math.sin(t*5)*.08:-direction*.78-keeper.rotation.z)*Math.min(1,dt*5);
    kp.arm1.rotation.z=-direction*.9;kp.arm2.rotation.z=-direction*.9;kp.leg1.rotation.z=direction*.22;kp.leg2.rotation.z=direction*.22;
    if(p>=1){const saved=Math.abs(keeper.position.x-ball.position.x)<1.18&&ball.position.y<3.65;if(saved){finished=true;g.finish(false,"🧤 تصدى الحارس للكرة! ضاعت ركلة الجزاء.");}else{netTime=.001;finishDelay=0;g.hint.textContent="🥅 هدف! الكرة اصطدمت بالشباك...";ball.position.z=-16.35;}}
  });
}
function thief(T,opts){
 const g=createHost(T,{title:"🚓 STOP THIEF — امسك اللص",stats:opts.stats,hint:"الشرطي يركض تلقائيًا خلف اللص. بدّل المسارات لتفادي السيارات واضغط اندفاعًا لزيادة السرعة.",sky:0x9eb8d0,onSuccess:opts.onSuccess,onMiss:opts.onMiss});
 floor(T,g.scene,0x343b46,38,110);
 const road=box(T,14,.16,110,mat(T,0x242a33),0,0,-34);g.scene.add(road);
 for(let z=10;z>-90;z-=6)g.scene.add(box(T,.13,.03,2.4,mat(T,0xf8fafc),0,.1,z));
 for(let side of [-1,1])for(let z=8;z>-90;z-=12){const building=box(T,4,5+(z%3),4,mat(T,side===1?0x64748b:0x475569),side*9,2.5,z);g.scene.add(building);}
 const cop=new T.Group();g.scene.add(cop);const cp=capsulePerson(T,cop,mat(T,0x1d4ed8),mat(T,0xf1c27d),mat(T,0x1e40af));cop.position.set(0,0,6);
 const robber=new T.Group();g.scene.add(robber);capsulePerson(T,robber,mat(T,0x292524),mat(T,0xd6a77a),mat(T,0x111827));robber.position.set(0,0,-10);
 const cars=[];for(let i=0;i<9;i++){const x=(i%3-1)*4,z=-4-i*9;const car=box(T,2,.9,3,mat(T,[0xdc2626,0xf59e0b,0x64748b][i%3]),x,.55,z);g.scene.add(car);cars.push(car);}
 g.camera.position.set(0,6,14);let lane=0,sprint=false,progress=0,collisions=0,done=false;
 makeButton("⬅️ يسار",()=>lane=Math.max(-1,lane-1),g.controls);makeButton("⚡ اندفاع",v=>sprint=v,g.controls);makeButton("يمين ➡️",()=>lane=Math.min(1,lane+1),g.controls);
 g.render((dt,t)=>{if(done)return;const speed=sprint?13:8;progress+=dt*speed;cop.position.x+=(lane*3-cop.position.x)*dt*5;cop.position.z=6-progress;robber.position.z=-4-progress*.75;robber.position.x=Math.sin(t*1.1)*1.7;cp.leg1.rotation.x=Math.sin(t*14)*.65;cp.leg2.rotation.x=-cp.leg1.rotation.x;g.camera.position.x+=(cop.position.x*.3-g.camera.position.x)*dt*3;g.camera.position.z=cop.position.z+10;g.camera.lookAt(cop.position.x,1,cop.position.z-9);cars.forEach(c=>{if(!c.userData.hit&&Math.abs(c.position.z-cop.position.z)<1.4&&Math.abs(c.position.x-cop.position.x)<1.5){c.userData.hit=true;collisions++;progress=Math.max(0,progress-4);g.hint.textContent="🚗 عائق في الطريق! اصطدامات: "+collisions+"/3";if(collisions>=3){done=true;g.finish(false,"هرب اللص بعد أن تعطلت المطاردة!");}}});g.score.textContent="مسافة المطاردة: "+Math.round(progress)+" م";if(progress>=48&&!done){done=true;g.finish(true,"🚓 أمسكت باللص! أحسنت أيها الشرطي!");}});
}
function stop(exit){if(!active)return;const a=active;active=null;a.cleanup();if(exit){const cb=window.__questionHunter3DExit;if(cb)cb();}}
window.QuestionHunter3D={stop(){stop(false);},async start(opts){stop(false);try{const T=await loadThree();const state=window.__questionHunterState;if(!state)throw Error("تعذر العثور على جلسة اللعبة.");const stats="الجولة "+(Number(opts.session.questionIndex||0)+1)+" / "+Number(opts.session.questionCount||5)+" | النقاط "+Number(opts.session.score||0);const o={...opts,stats};({treasure,race,blocks,football,thief}[opts.mode]||treasure)(T,o);}catch(e){console.error("3D game failed",e);const host=document.getElementById("questionHunterContent");host.replaceChildren();const p=document.createElement("p");p.textContent=e.message||"تعذر تشغيل اللعبة ثلاثية الأبعاد.";p.style.cssText="padding:20px;color:#991b1b;text-align:center;font-weight:bold;";host.appendChild(p);const b=document.createElement("button");b.textContent="العودة لاختيار اللعبة";b.className="action-btn primary";b.onclick=()=>{if(window.__questionHunter3DExit)window.__questionHunter3DExit();};host.appendChild(b);}}};
})();