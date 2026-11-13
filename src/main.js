import './style.css';
import './ui-overrides.css';
import { worlds, levels } from './data/worlds.js';
import { FarmScene } from './game/scene.js';
import { executeProgram, validateProgram } from './game/interpreter.js';
import { objectivesComplete } from './game/objectives.js';
import { showSuccess } from './celebration.js';
import { setMusicWorld, playEffect, playDrive } from './audio.js';
import { initGamepad, controllerGuide } from './gamepad.js';
import { successMessages, fallbackSuccess } from './data/successMessages.js';

const app = document.querySelector('#app');
const saved = JSON.parse(localStorage.getItem('tractor-adventure-save') || '{}');
const state = {
  completed: new Set(saved.completed || []), unlockedWorld: saved.unlockedWorld || 1,
  currentWorld: Math.min(saved.currentWorld || 1,5), currentLevel: saved.currentLevel || 1,
  programs: saved.programs || {}, functions: saved.functions || {}, activeTab: 'main',
  undo: [], redo: [], running: false, boardOpen: false
};
let farmScene;
const commandInfo = {
  forward:{label:'Forward',symbol:'↑',tone:'blue'}, left:{label:'Turn left',symbol:'↶',tone:'orange'}, right:{label:'Turn right',symbol:'↷',tone:'orange'},
  pickup:{label:'Pick up',symbol:'⤒',tone:'green'}, plant:{label:'Plant',symbol:'🌱',tone:'green'}, fix:{label:'Fix',symbol:'🔧',tone:'green'},
  repeat2:{label:'Repeat next ×2',symbol:'×2',tone:'purple'}, repeat3:{label:'Repeat next ×3',symbol:'×3',tone:'purple'},
  ifBlockedRight:{label:'If blocked: turn right',symbol:'IF',tone:'green'}, callF1:{label:'Call F1',symbol:'F1',tone:'teal'}, callF2:{label:'Call F2',symbol:'F2',tone:'teal'}
};
const levelById = id => levels.find(l=>l.id===id) || levels[0];
const current = () => levelById(state.currentLevel);
const programKey = id => String(id);
const fnLimit = name => current().functionLimits?.[name] ?? current().functionLimit ?? 0;
const blocksFor = () => current().blocks.filter(c=>!/^callF\d$/.test(c)||fnLimit(c.slice(4))>0);
const functionNames = () => ['F1','F2'].filter(n=>fnLimit(n)>0);
const usable = commands => commands.filter(c=>blocksFor().includes(c));
const getProgram = () => usable(state.programs[programKey(current().id)] || []);
const getFunction = name => usable(state.functions[`${current().id}-${name}`] || []);
const activeCommands = () => state.activeTab==='main' ? getProgram() : getFunction(state.activeTab);
const hasFunctions = () => functionNames().length>0;
const limitForTab = () => state.activeTab==='main' ? current().instructionLimit : fnLimit(state.activeTab);
function save(){localStorage.setItem('tractor-adventure-save',JSON.stringify({completed:[...state.completed],unlockedWorld:state.unlockedWorld,currentWorld:state.currentWorld,currentLevel:state.currentLevel,programs:state.programs,functions:state.functions}));}
function showSolution(){
  if(state.running)return;const l=current();pushHistory();
  state.programs[programKey(l.id)]=[...l.solution.main];
  for(const n of ['F1','F2'])state.functions[`${l.id}-${n}`]=[...(l.solution[n]||[])];
  state.activeTab='main';save();render();showToast('Here is one way to do it. Press Run to watch!');
}
function pushHistory(){state.undo.push(JSON.stringify({programs:state.programs,functions:state.functions}));if(state.undo.length>60)state.undo.shift();state.redo=[];}
function setCommands(commands){if(state.activeTab==='main')state.programs[programKey(current().id)]=commands;else state.functions[`${current().id}-${state.activeTab}`]=commands;save();renderEditor();}
function commandBlock(cmd,small=false){const c=commandInfo[cmd];return `<span class="instruction ${c.tone} ${small?'small':''}"><b>${c.symbol}</b><span>${c.label}</span></span>`;}
function render(){
  const l=current(), world=worlds[l.world-1];
  app.innerHTML=`<header class="topbar"><div class="brand"><img class="brand-mark" src="${import.meta.env.BASE_URL}assets/miguel-logo.png" alt="Miguel"><div><strong>MIGUEL’S TRACTOR ADVENTURE</strong><small>${world.name} · ${l.title}</small></div></div><div class="top-actions"><button class="quiet-btn" id="missionBoardBtn">☷ Mission board</button><span class="save-state">● Saved</span></div></header>
  <main class="layout"><section class="scene-panel"><div class="scene-heading"><div><span class="eyebrow">FARM ${world.id} · ${l.practice?'PRACTICE':`LEVEL ${String(l.id%4||4).padStart(2,'0')}`}</span><h1>${l.title}</h1></div><span class="world-pill">${world.name}</span></div><div class="scene-wrap" id="sceneWrap"><div class="scene-loading">Preparing the farm…</div></div>${controllerGuide()}<div class="scene-footer"><span>⌗ Grid movement</span><span>◉ Goal: golden marker</span><span>↗ Isometric view</span></div></section>
  <section class="program-panel"><div class="panel-title"><div><span class="eyebrow">PLAN YOUR MOVES</span><h2>Program the tractor</h2></div><button class="icon-btn" id="resetBtn" title="Reset tractor">↺</button></div>
  <div class="run-row"><button class="run-btn" id="runBtn">▶ <span>Run program</span></button><span class="slot-count" id="slotCount"></span></div>
  ${hasFunctions()?`<div class="editor-tabs"><button class="tab active" data-tab="main">MAIN</button>${functionNames().map(n=>`<button class="tab" data-tab="${n}">${n}</button>`).join('')}<span class="tab-help">Reusable functions</span></div>`:''}
  <div class="program-slots" id="programSlots"></div>
  <div class="edit-actions"><button class="text-btn" id="undoBtn">↶ Undo</button><button class="text-btn" id="redoBtn">↷ Redo</button><button class="text-btn clear-btn" id="clearBtn">Clear ${state.activeTab==='main'?'program':state.activeTab}</button></div>
  <div class="block-library"><div class="library-heading"><div><span class="eyebrow">INSTRUCTION BLOCKS</span><h3>Build your program</h3></div><span class="available-label">${blocksFor().length===Object.keys(commandInfo).length?'All available':'Ready to use'}</span></div><div class="block-grid">${blocksFor().map(cmd=>`<button class="block-button" data-add="${cmd}">${commandBlock(cmd)}</button>`).join('')}</div><p class="library-note">Click or drag to add. Drag placed blocks to rearrange; select one to remove.${blocksFor().includes('repeat2')?' Repeat blocks repeat the next instruction, including F1 or F2.':''}</p></div>
  <div class="bottom-note"><span class="note-icon">✦</span><span>Try things out. The tractor will show you what your instructions do.</span></div></section></main>
  <div class="toast" id="toast" aria-live="polite"></div><div class="modal-layer hidden" id="boardLayer"><section class="board-modal"><div class="board-head"><div><span class="eyebrow">YOUR FARM ADVENTURE</span><h2>Mission board</h2></div><button class="icon-btn" id="closeBoard">✕</button></div><div id="worldTabs" class="world-tabs"></div><p class="board-subtitle" id="worldDescription"></p><div id="levelCards" class="level-cards"></div></section></div>`;
  setMusicWorld(l.world); showMission(l); wire(); renderEditor();
  if(farmScene) farmScene.dispose();
  farmScene=new FarmScene(document.querySelector('#sceneWrap'));
  farmScene.buildWorld(l,world);
}
function showMission(l){
  document.querySelector('#missionNote')?.remove();
  const note=document.createElement('aside');
  note.id='missionNote';note.className='mission-note';note.setAttribute('role','status');
  note.innerHTML=`<button class="note-close" aria-label="Dismiss message">✕</button><span class="character-avatar" aria-hidden="true"><img src="${l.character.image}" alt=""></span><div><span class="eyebrow">${l.character.name.toUpperCase()} SAYS</span><p>“${l.character.dialogue}”</p><small>Goal: ${l.briefing}</small>${l.practice?'<button class="text-btn" id="showSolutionBtn">Show me how</button>':''}</div>`;
  document.body.appendChild(note);
  const close=()=>{note.classList.add('leaving');setTimeout(()=>note.remove(),350);};
  note.querySelector('.note-close').onclick=close;
}
function wire(){
  document.querySelector('#missionBoardBtn').onclick=()=>openBoard();
  document.querySelector('#runBtn').onclick=runProgram;
  document.querySelector('#resetBtn').onclick=()=>{if(state.running)return;farmScene.resetRun(current());showToast('Tractor reset to its starting tile.');};
  const showBtn=document.querySelector('#showSolutionBtn');
  if(showBtn)showBtn.onclick=showSolution;
  document.querySelector('#clearBtn').onclick=()=>{if(state.running)return;pushHistory();setCommands([]);};
  document.querySelector('#undoBtn').onclick=undo;
  document.querySelector('#redoBtn').onclick=redo;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.activeTab=b.dataset.tab;renderEditor();});
  document.querySelectorAll('[data-add]').forEach(b=>{
    b.onclick=()=>addCommand(b.dataset.add);
    b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('application/x-tractor-command',b.dataset.add);
  });
  document.querySelector('#closeBoard').onclick=closeBoard;
}
function renderEditor(){
  const slots=document.querySelector('#programSlots');if(!slots)return;
  const commands=activeCommands(),limit=limitForTab();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));
  document.querySelector('#slotCount').textContent=`${commands.length} / ${limit} slots`;
  slots.innerHTML=Array.from({length:limit},(_,i)=>commands[i]?`<button class="program-slot filled" data-remove="${i}" data-drop="${i}" title="Drag to rearrange, or select to remove instruction ${i+1}"><span class="slot-number">${i+1}</span>${commandBlock(commands[i],true)}<span class="remove-mark">×</span></button>`:`<div class="program-slot empty" data-drop="${i}"><span class="slot-number">${i+1}</span><span class="empty-label">Drop instruction here</span><span class="plus">+</span></div>`).join('');
  slots.querySelectorAll('[data-remove]').forEach(b=>{
    b.onclick=()=>{if(state.running)return;pushHistory();const next=[...activeCommands()];next.splice(Number(b.dataset.remove),1);setCommands(next);};
    b.draggable=true;
    b.ondragstart=e=>e.dataTransfer.setData('application/x-tractor-command-index',JSON.stringify({index:Number(b.dataset.remove),tab:state.activeTab}));
  });
  slots.querySelectorAll('[data-drop]').forEach(b=>{
    b.ondragover=e=>{e.preventDefault();b.classList.add('drag-over');};
    b.ondragleave=()=>b.classList.remove('drag-over');
    b.ondrop=e=>{
      e.preventDefault();b.classList.remove('drag-over');
      const index=Number(b.dataset.drop),move=e.dataTransfer.getData('application/x-tractor-command-index');
      if(move){const source=JSON.parse(move);moveCommand(source.index,index,source.tab);return;}
      const command=e.dataTransfer.getData('application/x-tractor-command');
      if(command)addCommand(command,index);
    };
  });
  document.querySelector('#undoBtn').disabled=!state.undo.length;document.querySelector('#redoBtn').disabled=!state.redo.length;
  document.querySelectorAll('[data-add]').forEach(b=>b.disabled=state.running);
  document.querySelector('#runBtn').disabled=state.running;
  document.querySelector('#clearBtn').disabled=state.running||commands.length===0;
  document.querySelector('#resetBtn').disabled=state.running;
  document.querySelector('#missionBoardBtn').disabled=state.running;
  document.querySelector('#undoBtn').disabled=state.running||!state.undo.length;
  document.querySelector('#redoBtn').disabled=state.running||!state.redo.length;
  document.querySelectorAll('[data-tab]').forEach(b=>b.disabled=state.running);
}
function addCommand(cmd,index){if(state.running)return;const currentCommands=[...activeCommands()];if(index===undefined){if(currentCommands.length>=limitForTab()){showToast('No empty instruction slots left.');return;}currentCommands.push(cmd);}else if(index<currentCommands.length)currentCommands.splice(index,1,cmd);else{if(currentCommands.length>=limitForTab()){showToast('No empty instruction slots left.');return;}currentCommands.splice(index,0,cmd);}pushHistory();setCommands(currentCommands);}
function moveCommand(sourceIndex,targetIndex,sourceTab){if(state.running||sourceTab!==state.activeTab||sourceIndex===targetIndex)return;const next=[...activeCommands()];if(sourceIndex<0||sourceIndex>=next.length||targetIndex<0||targetIndex>=limitForTab())return;const [command]=next.splice(sourceIndex,1);next.splice(targetIndex,0,command);pushHistory();setCommands(next);}
function undo(){if(state.running||!state.undo.length)return;state.redo.push(JSON.stringify({programs:state.programs,functions:state.functions}));const prev=JSON.parse(state.undo.pop());state.programs=prev.programs;state.functions=prev.functions;save();renderEditor();}
function redo(){if(state.running||!state.redo.length)return;state.undo.push(JSON.stringify({programs:state.programs,functions:state.functions}));const next=JSON.parse(state.redo.pop());state.programs=next.programs;state.functions=next.functions;save();renderEditor();}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function nextLevelFor(l){
  const practice=levels.filter(x=>x.practice&&x.world===l.world);
  if(l.practice){const i=practice.indexOf(l);return practice[i+1]||levels.find(x=>x.id===(l.world-1)*4+1);}
  const next=l.id<20?levels.find(x=>x.id===l.id+1):null;
  if(!next)return null;
  if(next.world!==l.world){if(state.unlockedWorld<next.world)return null;return levels.find(x=>x.practice&&x.world===next.world)||next;}
  return next;
}
async function runProgram(){
  if(state.running)return;state.running=true;renderEditor();
  const l=current();
  const functions={F1:getFunction('F1'),F2:getFunction('F2')};
  const error=validateProgram(getProgram(),functions,{program:l.instructionLimit,functions:{F1:fnLimit('F1'),F2:fnLimit('F2')}});
  if(error){state.running=false;renderEditor();showToast(error);return;}
  farmScene.resetRun(l);farmScene.setMood('idle');
  let result;
  try{
    result=await executeProgram({
      program:getProgram(),functions,start:l.start,facing:l.facing,
      width:l.grid.width,height:l.grid.height,obstacles:l.obstacles,items:l.items,plantTiles:l.plantTiles||[],fixTiles:l.fixTiles||[],
      onStep:async step=>{
        if(step.type==='pickup'){playEffect('pick');await farmScene.collectItem(step.item.id);if(step.item.seeds)farmScene.setSeeds(step.seeds);if(step.item.tools)farmScene.setSeeds(step.tools);await wait(150);return;}
        if(step.type==='plant'){playEffect('plant');farmScene.setSeeds(step.seeds);await farmScene.plantCrop(step.tile);await wait(150);return;}
        if(step.type==='fix'){playEffect('plant');farmScene.setSeeds(step.tools);await farmScene.fixTile(step.tile);await wait(150);return;}
        if(step.type==='return'){await wait(450);return;}
        if(step.type==='move')playDrive(l.world===5);
        await farmScene.moveTractor(step.position,step.facing,step.type==='move'?350:220);await wait(100);
      }
    });
  }catch(error){console.error('Program execution stopped unexpectedly.',error);showToast('The program could not finish. Please check the instructions.');}
  state.running=false;renderEditor();
  if(result&&objectivesComplete(l.objectives,result)){
    farmScene.celebrate();farmScene.setMood('happy');
    if(!l.practice&&!state.completed.has(l.id)){state.completed.add(l.id);if(l.id%4===0&&l.world<5)state.unlockedWorld=Math.max(state.unlockedWorld,l.world+1);save();}
    setTimeout(()=>{if(state.running||current().id!==l.id)return;delete state.programs[programKey(l.id)];delete state.functions[`${l.id}-F1`];delete state.functions[`${l.id}-F2`];state.undo=[];state.redo=[];state.activeTab='main';save();renderEditor();},2600);
    const next=nextLevelFor(l);
    setTimeout(()=>showSuccess({level:l,message:successMessages[l.id]||fallbackSuccess(l.title),nextLabel:next?'Next level':'Mission board',seconds:10,finale:l.id===levels.filter(x=>!x.practice).length,onNext:()=>{
      if(next){state.currentLevel=next.id;state.currentWorld=next.world;state.activeTab='main';save();render();}else openBoard();
    }}),900);
  }else if(result){farmScene.setMood('sad');showToast('Not there yet. Change your program and try again!');
  }
}
function showToast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2600);}
function openBoard(){state.boardOpen=true;document.querySelector('#boardLayer').classList.remove('hidden');renderBoard();}
function closeBoard(){state.boardOpen=false;document.querySelector('#boardLayer').classList.add('hidden');}
function renderBoard(){
  const tabs=document.querySelector('#worldTabs');tabs.innerHTML=worlds.map(w=>`<button class="world-tab ${w.id===state.currentWorld?'active':''}" data-world="${w.id}" ${w.id>state.unlockedWorld?'disabled':''}>Farm ${w.id} · ${w.name}</button>`).join('');
  tabs.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{state.currentWorld=Number(b.dataset.world);save();renderBoard();});
  const world=worlds[state.currentWorld-1];document.querySelector('#worldDescription').textContent=world.description;
  document.querySelector('#levelCards').innerHTML=levels.filter(l=>l.world===state.currentWorld).sort((a,b)=>Number(!!b.practice)-Number(!!a.practice)).map(l=>{const done=state.completed.has(l.id),unlocked=l.id===1||state.completed.has(l.id-1)||l.world>1&&state.completed.has((l.world-1)*4)||l.practice||levels.some(x=>x.world===l.world&&x.id>l.id&&state.completed.has(x.id));return `<button class="level-card ${done?'completed':''}" data-level="${l.id}" ${!unlocked?'disabled':''}><span class="level-number">${l.practice?'★':String(l.id%4||4).padStart(2,'0')}</span><span><b>${l.title}</b><small>${l.concept}</small></span><span class="level-status">${done?'✓':unlocked?'→':'🔒'}</span></button>`;}).join('');
  document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{state.currentLevel=Number(b.dataset.level);state.currentWorld=current().world;state.activeTab='main';save();closeBoard();render();});
}

render();
initGamepad();
