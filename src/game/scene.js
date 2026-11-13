import * as THREE from 'three';
import { createTractor } from './tractorModel.js';
import { buildEnvironment } from './environment/index.js';
import { createItem } from './items.js';
import { createCrop } from './crops.js';
import { createRepair, createWrench, REPAIR_KINDS } from './repairs.js';

const CROP_SCALE=2.3;

export class FarmScene {
  constructor(container, onReady) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#b9d9ed');
    this.scene.fog = new THREE.Fog('#b9d9ed', 18, 38);
    const w = container.clientWidth || 800, h = container.clientHeight || 600;
    this.camera = new THREE.OrthographicCamera(-8,8,8,-8,0.1,100);
    this.camera.position.set(10,13,12); this.camera.lookAt(0,0,0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setSize(w,h); this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);
    container.querySelector('.scene-loading')?.remove();
    this.scene.add(new THREE.HemisphereLight('#ffffff','#78935d',2.0));
    const sun = new THREE.DirectionalLight('#fff1d6',2.5); sun.position.set(6,12,8); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,far:50}); this.scene.add(sun);
    this.worldGroup = new THREE.Group(); this.scene.add(this.worldGroup);
    this.tractor = this.makeTractor(); this.tractor.scale.setScalar(.65); this.scene.add(this.tractor);
    this.tractor.position.y = 0.12;
    container.style.position = container.style.position || 'relative';
    this.seedHud = document.createElement('div');
    Object.assign(this.seedHud.style, { position: 'absolute', top: '12px', left: '12px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,253,248,.92)', font: '800 15px Nunito, system-ui, sans-serif', color: '#3d5a2a', boxShadow: '0 2px 8px rgba(0,0,0,.15)', display: 'none', pointerEvents: 'none' });
    container.appendChild(this.seedHud);
    this.clock = new THREE.Clock(); this.animate();
    this.resizeObserver = new ResizeObserver(()=>this.resize()); this.resizeObserver.observe(container);
    onReady?.();
  }
  box(parent, size, color, pos, material={}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({color,...material}));
    mesh.position.set(...pos); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  makeTractor() { return createTractor(); }
  buildWorld(level, world) {
    this.clearGroup(this.worldGroup);
    const env = buildEnvironment(this.worldGroup, level, world);
    this.animators = env.animators;
    this.envKit = env.kit;
    this.scene.background = new THREE.Color(env.sky);
    this.scene.fog = new THREE.Fog(env.sky, 30, 70);
    const [gx,gy]=level.goal;
    const goalX=gx-3.5,goalZ=gy-3.5;
    const target=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.08,24),new THREE.MeshStandardMaterial({color:'#f3d54b',emissive:'#8a6d0b',emissiveIntensity:.28}));target.position.set(goalX,.1,goalZ);this.worldGroup.add(target);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.35,.055,8,24),new THREE.MeshStandardMaterial({color:'#fff4a1',emissive:'#a88411',emissiveIntensity:.25}));ring.rotation.x=Math.PI/2;ring.position.set(goalX,.18,goalZ);this.goalRing=ring;this.worldGroup.add(ring);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.72,8),new THREE.MeshStandardMaterial({color:'#fff0a0'}));pole.position.set(goalX,.56,goalZ);pole.castShadow=true;this.worldGroup.add(pole);
    const flag=this.box(this.worldGroup,[.34,.2,.04],'#ef9b4a',[goalX+.16,.78,goalZ]);
    flag.castShadow=true;
    this.itemGroup=new THREE.Group();this.worldGroup.add(this.itemGroup);
    this.plotGroup=new THREE.Group();this.worldGroup.add(this.plotGroup);
    this.repairGroup=new THREE.Group();this.worldGroup.add(this.repairGroup);
    this.setTractorColor(world.color);
    this.setSpaceship(world.id===5);
    this.resetRun(level);
  }
  // Puts the tractor, its cargo and the collectible objects back to the level's starting state.
  resetRun(level) {
    this.placeTractor(level.start,level.facing);
    this.clearGroup(this.itemGroup);this.clearGroup(this.tractor.userData.cargo);
    this.itemMeshes=new Map();this.cargoCount=0;
    this.clearGroup(this.plotGroup);this.plots=new Map();
    const space=level.world===5;
    for(const tile of level.plantTiles||[]){
      const soil=new THREE.Mesh(new THREE.BoxGeometry(.8,.05,.8),new THREE.MeshStandardMaterial(space?{color:'#2a3050',roughness:.5,metalness:.4}:{color:'#6b4528',roughness:.95}));
      soil.position.copy(this.gridPosition(tile.pos));soil.position.y=.1;soil.receiveShadow=true;
      const furrows=new THREE.Group();
      for(const z of[-.24,0,.24]){const row=new THREE.Mesh(new THREE.BoxGeometry(.7,.04,.1),new THREE.MeshStandardMaterial(space?{color:'#4dd9ff',emissive:'#4dd9ff',emissiveIntensity:1.2}:{color:'#8d6139',roughness:.95}));row.position.set(0,.04,z);furrows.add(row);}
      soil.add(furrows);this.plotGroup.add(soil);this.plots.set(`${tile.pos[0]},${tile.pos[1]}`,soil);
    }
    this.clearGroup(this.repairGroup);this.repairs=new Map();
    (level.fixTiles||[]).forEach((tile,i)=>{
      const repair=createRepair(tile.kind||REPAIR_KINDS[i%REPAIR_KINDS.length]);
      repair.group.position.copy(this.gridPosition(tile.pos));repair.group.position.y=.1;repair.group.scale.setScalar(1.5);
      repair.group.rotation.y=.4*i;
      this.repairGroup.add(repair.group);this.repairs.set(`${tile.pos[0]},${tile.pos[1]}`,repair);
    });
    const hasFix=Boolean((level.fixTiles||[]).length);
    this.hudLabel=hasFix?'🧰 Tools':level.world===4?'🌲 Saplings':level.world===5?'🪐 Planets':'🌱 Seeds';
    this.setSeeds(0,hasFix||Boolean((level.plantTiles||[]).length));
    for(const item of level.items||[]){
      const mesh=createItem(item.type),baseScale=item.type==='seeds'?1.5:1.35;mesh.scale.setScalar(baseScale);mesh.userData.baseScale=baseScale;mesh.position.copy(this.gridPosition(item.pos));mesh.rotation.y=.3;
      if(item.offset){mesh.position.x+=item.offset[0];mesh.position.z+=item.offset[1];}
      mesh.userData.baseY=mesh.position.y;mesh.userData.item=item;
      this.itemGroup.add(mesh);this.itemMeshes.set(item.id,mesh);
    }
    for(const item of level.cargo||[])this.addCargo(item.type);
  }
  setSeeds(count,visible=true) {
    this.seedHud.style.display=visible?'block':'none';
    this.seedHud.textContent=`${this.hudLabel||'🌱 Seeds'}: ${count}`;
  }
  async fixTile(tile) {
    const repair=this.repairs.get(`${tile.pos[0]},${tile.pos[1]}`);
    if(!repair)return;
    const wrench=createWrench();wrench.position.set(0,.55,.1);repair.group.add(wrench);
    const t0=performance.now(),duration=800,base=repair.group.scale.x;
    await new Promise(resolve=>{const tick=now=>{
      const t=Math.min(1,(now-t0)/duration);
      wrench.rotation.z=Math.sin(t*Math.PI*6)*.7;wrench.position.y=.5+Math.sin(t*Math.PI)*.15;
      if(t<.55)repair.broken.rotation.z=Math.sin(t*60)*.08;
      else{
        repair.broken.visible=false;repair.fixed.visible=true;
        const g=(t-.55)/.45;repair.fixed.scale.setScalar(1+Math.sin(g*Math.PI)*.35);
      }
      repair.group.scale.setScalar(base);
      if(t<1)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);});
    repair.group.remove(wrench);repair.fixed.scale.setScalar(1);
  }
  async plantCrop(tile) {
    const soil=this.plots.get(`${tile.pos[0]},${tile.pos[1]}`);
    if(soil&&!soil.material.metalness){soil.material.color.set('#4a2f1a');soil.children[0].children.forEach(row=>row.material.color.set('#5e3b20'));}
    const {group,fruit}=createCrop(tile.crop);
    group.position.copy(this.gridPosition(tile.pos));group.position.y=.12;
    group.scale.setScalar(.001);fruit.scale.setScalar(.001);
    this.plotGroup.add(group);
    const t0=performance.now(),duration=700;
    await new Promise(resolve=>{const tick=now=>{
      const t=Math.min(1,(now-t0)/duration);
      const g=Math.min(1,t/.55),bounce=1+Math.sin(g*Math.PI)*.3;
      group.scale.setScalar(Math.max(.001,CROP_SCALE*g*bounce));
      const f=Math.max(0,(t-.45)/.55);
      fruit.scale.setScalar(Math.max(.001,f*(1+Math.sin(f*Math.PI)*.35)));
      if(t<1)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);});
    group.scale.setScalar(CROP_SCALE);fruit.scale.setScalar(1);
  }
  addCargo(type) {
    const {cargo,cargoSlots}=this.tractor.userData;
    const index=this.cargoCount++,mesh=createItem(type);
    mesh.scale.setScalar(1.35);
    mesh.position.copy(cargoSlots[index%cargoSlots.length]);mesh.position.y+=Math.floor(index/cargoSlots.length)*.5;
    cargo.add(mesh);
    return mesh;
  }
  async collectItem(id) {
    const source=this.itemMeshes.get(id);if(!source)return;
    this.itemMeshes.delete(id);
    const cargo=this.addCargo(source.userData.item.type),finalScale=cargo.scale.x,startY=source.position.y;
    cargo.scale.setScalar(.001);
    const t0=performance.now(),duration=520;
    await new Promise(resolve=>{const tick=now=>{
      const t=Math.min(1,(now-t0)/duration);
      source.position.y=startY+Math.sin(Math.min(1,t*1.6)*Math.PI/2)*.7;
      source.scale.setScalar(source.userData.baseScale*Math.max(.001,1-t*1.6));
      const c=Math.max(0,(t-.35)/.65),overshoot=1+Math.sin(c*Math.PI)*.25;
      cargo.scale.setScalar(Math.max(.001,finalScale*c*overshoot));
      if(t<1)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);});
    cargo.scale.setScalar(finalScale);
    source.parent?.remove(source);
  }
  gridPosition(pos) { return new THREE.Vector3(pos[0]-3.5,.08,pos[1]-3.5); }
  setSpaceship(on) {
    const { classic,spaceship }=this.tractor.userData;
    classic.forEach(part=>{part.visible=!on;});
    spaceship.visible=on;
  }
  setTractorColor(color) {
    this.tractor.traverse(object=>{
      if(object.userData.tractorPaint)object.material.color.set(color);
    });
  }
  placeTractor(pos,facing) { this.tractor.position.copy(this.gridPosition(pos)); this.tractor.rotation.y=-facing*Math.PI/2; }
  async moveTractor(pos,facing,duration=420) {
    const start=this.tractor.position.clone(), end=this.gridPosition(pos), startRot=this.tractor.rotation.y, endRot=-facing*Math.PI/2;
    const t0=performance.now();
    await new Promise(resolve=>{const tick=now=>{const t=Math.min(1,(now-t0)/duration);const e=t*t*(3-2*t);this.tractor.position.lerpVectors(start,end,e);this.tractor.rotation.y=startRot+(endRot-startRot)*e;if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  }
  setMood(state){if(this.envKit)this.envKit.mood={state,since:this.clock.getElapsedTime()};}
  celebrate(){
    const initialY=this.tractor.position.y,start=performance.now(),duration=620;
    const bounce=now=>{
      const progress=Math.min(1,(now-start)/duration);
      this.tractor.position.y=initialY+Math.sin(progress*Math.PI)*.42;
      if(progress<1)this.celebrationFrame=requestAnimationFrame(bounce);
      else this.tractor.position.y=initialY;
    };
    this.celebrationFrame=requestAnimationFrame(bounce);
  }
  resize(){const w=this.container.clientWidth||800,h=this.container.clientHeight||600,aspect=w/h;const span=6.8;this.camera.left=-span*aspect/1.4;this.camera.right=span*aspect/1.4;this.camera.top=span;this.camera.bottom=-span;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  animate=()=>{this.animationFrame=requestAnimationFrame(this.animate);const t=this.clock.getElapsedTime();this.animators?.forEach(fn=>fn(t));this.itemMeshes?.forEach(m=>{m.position.y=m.userData.baseY+Math.abs(Math.sin(t*2.2))*.06;});if(this.goalRing)this.goalRing.scale.setScalar(1+Math.sin(t*4)*.08);this.renderer.render(this.scene,this.camera);};
  clearGroup(group){
    for(const child of [...group.children]){
      child.traverse?.(object=>{
        object.geometry?.dispose();
        if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());
        else object.material?.dispose();
      });
      group.remove(child);
    }
  }
  dispose(){
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.celebrationFrame);
    this.clearGroup(this.worldGroup);
    this.clearGroup(this.tractor);
    this.seedHud.remove();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
