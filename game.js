const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ui = { blue: document.querySelector('#blueScore'), red: document.querySelector('#redScore'), clock: document.querySelector('#clock'), status: document.querySelector('#status'), start: document.querySelector('#startScreen'), play: document.querySelector('#playButton'), goal: document.querySelector('#goalScreen'), goalMessage: document.querySelector('#goalMessage') };
const keys = {}; let running = false, last = 0, remaining = 90, sprintTouch = false;
let score = [0, 0];
const player = { x:250, y:H/2, r:18, vx:0, vy:0, facing:0, color:'#39aef4', number:'10', kick:0 };
const keeper = { x:W-47, y:H/2, r:20, color:'#ef5361', number:'1' };
const mate = { x:360, y:335, r:17, color:'#1874c9', number:'7' };
const defender = { x:650, y:H/2-50, r:18, color:'#c63847', number:'4' };
const ball = { x:300, y:H/2, r:9, vx:0, vy:0 };

function reset(afterGoal=false) { player.x=250; player.y=H/2; player.vx=player.vy=0; mate.x=360;mate.y=335; defender.x=650;defender.y=H/2-50; keeper.y=H/2; ball.x=300;ball.y=H/2;ball.vx=ball.vy=0; if(!afterGoal) { score=[0,0]; remaining=90; } renderUI(); }
function renderUI() { ui.blue.textContent=score[0]; ui.red.textContent=score[1]; const m=Math.max(0,Math.floor(remaining)); ui.clock.textContent=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
function start() { reset(); running=true; ui.start.hidden=true; ui.status.textContent='PLAY'; last=performance.now(); requestAnimationFrame(loop); }
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function kickBall() { if (!running || player.kick>0 || dist(player,ball)>46) return; player.kick=.22; const power=(keys.Shift||sprintTouch)?650:500; ball.vx=Math.cos(player.facing)*power; ball.vy=Math.sin(player.facing)*power; }
function update(dt) {
  remaining-=dt; if(remaining<=0){ remaining=0; running=false; ui.status.textContent=score[0]===score[1]?'DRAW':'FULL TIME'; ui.start.hidden=false; ui.play.textContent='PLAY AGAIN'; renderUI(); return; }
  let x=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0), y=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0); if(touchMove.x||touchMove.y){x=touchMove.x;y=touchMove.y;} const mag=Math.hypot(x,y)||1; const speed=(keys.Shift||sprintTouch)?265:190; player.vx=x/mag*speed;player.vy=y/mag*speed;
  player.x=clamp(player.x+player.vx*dt,44,W-44); player.y=clamp(player.y+player.vy*dt,35,H-35); if(x||y) player.facing=Math.atan2(y,x); player.kick=Math.max(0,player.kick-dt);
  // Loose ball dribbles in front of the player.
  const d=dist(player,ball); if(d<38 && Math.hypot(ball.vx,ball.vy)<210 && player.kick===0){ const targetX=player.x+Math.cos(player.facing)*29, targetY=player.y+Math.sin(player.facing)*29; ball.vx+=(targetX-ball.x)*18*dt; ball.vy+=(targetY-ball.y)*18*dt; }
  // Basic defenders and goalkeeper.
  const chase=ball.x>W*.38?1:-.35; defender.x=clamp(defender.x+(ball.x-defender.x)*dt*.7,410,760); defender.y=clamp(defender.y+(ball.y-defender.y)*dt*.7,80,H-80); keeper.y=clamp(keeper.y+(ball.y-keeper.y)*dt*1.8,190,H-190);
  ball.x+=ball.vx*dt; ball.y+=ball.vy*dt; ball.vx*=Math.pow(.25,dt); ball.vy*=Math.pow(.25,dt);
  if(ball.y<20||ball.y>H-20){ball.y=clamp(ball.y,20,H-20);ball.vy*=-.72;} if(ball.x<20){ball.x=20;ball.vx*=-.72;}
  if(ball.x>W-12){ if(ball.y>190&&ball.y<350) goal(0); else {ball.x=W-12;ball.vx*=-.72;} }
  if(dist(ball,keeper)<29){ball.vx=-330; ball.vy=(ball.y-keeper.y)*9;} if(dist(ball,defender)<27){ball.vx=-230;ball.vy=(ball.y-defender.y)*8;}
  renderUI();
}
function goal(team){ if(!running)return; running=false;score[team]++;renderUI(); ui.goal.hidden=false;ui.goalMessage.textContent=team===0?'BLUE TAKES THE LEAD':'RED SCORES'; setTimeout(()=>{ui.goal.hidden=true;reset(true);running=true;last=performance.now();requestAnimationFrame(loop);},1300); }
function playerDraw(p){ ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,15,p.r,6,0,0,7);ctx.fill();ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,7);ctx.fill();ctx.strokeStyle='#fff8';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='white';ctx.font=`bold ${p.r}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.number,0,1);ctx.restore(); }
function draw(){ ctx.clearRect(0,0,W,H); ctx.fillStyle='#176c54';ctx.fillRect(0,0,W,H); for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#20775d':'#196b53';ctx.fillRect(i*120,0,120,H);} ctx.strokeStyle='#d9ffe8aa';ctx.lineWidth=4;ctx.strokeRect(26,26,W-52,H-52);ctx.beginPath();ctx.arc(W/2,H/2,70,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(W/2,26);ctx.lineTo(W/2,H-26);ctx.stroke(); ctx.strokeRect(W-105,180,79,180);ctx.strokeRect(26,180,79,180);ctx.fillStyle='#d8d8da';ctx.fillRect(W-14,204,7,132);ctx.fillRect(7,204,7,132);
  playerDraw(mate); playerDraw(defender);playerDraw(keeper); playerDraw(player);
  ctx.save();ctx.translate(ball.x,ball.y);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(3,7,9,4,0,0,7);ctx.fill();ctx.fillStyle='#f8f5e9';ctx.beginPath();ctx.arc(0,0,ball.r,0,7);ctx.fill();ctx.fillStyle='#242a35';ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();ctx.restore();
}
function loop(t){if(!running)return;const dt=Math.min(.035,(t-last)/1000);last=t;update(dt);draw();if(running)requestAnimationFrame(loop);}
const touchMove={x:0,y:0};
window.addEventListener('keydown',e=>{keys[e.key]=true;if(e.code==='Space'){e.preventDefault();kickBall();}});window.addEventListener('keyup',e=>keys[e.key]=false);ui.play.addEventListener('click',start);
const joy=document.querySelector('#joystick'), stick=document.querySelector('#stick'); function moveTouch(e){const r=joy.getBoundingClientRect(),p=e.touches?e.touches[0]:e;let dx=p.clientX-(r.left+r.width/2),dy=p.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy),max=32;if(d>max){dx*=max/d;dy*=max/d;} touchMove.x=dx/max;touchMove.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`;} joy.addEventListener('pointerdown',e=>{joy.setPointerCapture(e.pointerId);moveTouch(e)});joy.addEventListener('pointermove',e=>{if(e.buttons)moveTouch(e)});joy.addEventListener('pointerup',()=>{touchMove.x=touchMove.y=0;stick.style.transform=''});
const shoot=document.querySelector('#shootButton'),run=document.querySelector('#sprintButton');shoot.addEventListener('pointerdown',kickBall);run.addEventListener('pointerdown',()=>sprintTouch=true);run.addEventListener('pointerup',()=>sprintTouch=false);draw();
