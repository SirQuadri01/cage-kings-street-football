const c=document.querySelector("#game"),x=c.getContext("2d"),W=c.width,H=c.height;
const ui={b:blueScore,r:redScore,t:clock,s:status,start:startScreen,play:playButton,g:goalScreen,gm:goalMessage};
const k={},ball={x:480,y:270,vx:0,vy:0,r:14};
let run=false,last=0,time=300,active=3,score=[0,0],cards=0,kickoff=true,kickoffTeam=0;

const make=(n,name,a,b,keeper=false,color="#39aef4")=>({n,name,x:a,y:b,hx:a,hy:b,keeper,color,r:keeper?19:18,facing:0,vx:0,vy:0,level:1,speed:190,shot:500,pass:420,tackle:1});
const blue=[
 make("1","KEEPER",72,270,true,"#1679c5"),
 make("2","BLUE 2",250,160),make("3","BLUE 3",270,390),
 make("4","BLUE 4",450,215),make("5","BLUE 5",450,345)
];
const red=[
 make("1","",888,270,true,"#c73d4d"),
 make("2","",710,160,false,"#e85360"),make("3","",690,390,false,"#e85360"),
 make("4","",510,215,false,"#e85360"),make("5","",510,345,false,"#e85360")
];

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const me=()=>blue[active];

function hud(){
 ui.b.textContent=score[0];
 ui.r.textContent=score[1];
 const z=Math.max(0,time|0);
 ui.t.textContent=`${String(z/60|0).padStart(2,"0")}:${String(z%60).padStart(2,"0")}`;
}
function say(text,delay=.7){
 ui.s.textContent=text;
 setTimeout(()=>{if(run&&ui.s.textContent===text)ui.s.textContent="PLAY"},delay*1000);
}
function setupKickoff(team){
 kickoff=true;
 kickoffTeam=team;
 const player=team===0?blue[3]:red[3];

 ball.x=player.x+(team===0?28:-28);
 ball.y=player.y;
 ball.vx=0;
 ball.vy=0;

 if(team===0)active=3;
}
function reset(after=false){
 [...blue,...red].forEach(p=>{
  p.x=p.hx;p.y=p.hy;p.vx=0;p.vy=0;
 });
 cards=0;
 if(!after){score=[0,0];time=300;}
 setupKickoff(0);
 hud();
}
function start(){
 reset();
 run=true;
 ui.start.hidden=true;
 ui.s.textContent="BLUE KICK OFF — PASS!";
 last=performance.now();
 requestAnimationFrame(loop);
}
function switchPlayer(){
 if(!run)return;
 active=(active+1)%blue.length;
 say(me().name+" SELECTED");
}
function shoot(){
 const p=me();
 if(!run||d(p,ball)>55)return;
 if(kickoff)return say("PASS TO START!");

 const power=p.keeper?380:p.shot;
 ball.vx=Math.cos(p.facing)*power;
 ball.vy=Math.sin(p.facing)*power;
 say(p.keeper?"KEEPER KICK!":"SHOT!",.35);
}
function pass(){
 const p=me();
 if(!run||d(p,ball)>55)return;
 if(kickoff&&kickoffTeam!==0)return say("RED KICK OFF");

 const target=blue.filter((_,i)=>i!==active)
  .sort((a,b)=>d(a,p)-d(b,p))[0];

 const angle=Math.atan2(target.y-ball.y,target.x-ball.x);
 p.facing=angle;
 ball.vx=Math.cos(angle)*p.pass;
 ball.vy=Math.sin(angle)*p.pass;
 kickoff=false;
 say("PASS!",.4);
}
function tackle(hard=false){
 const p=me();
 const enemy=red.slice(1).reduce((a,b)=>d(p,a)<d(p,b)?a:b);

 if(!run||p.keeper||d(p,enemy)>66||d(p,ball)>80)return say("MISS",.35);

 if(hard&&Math.random()<.35){
  cards++;
  const card=cards>1?"RED CARD":"YELLOW CARD";
  ball.vx=-180;
  ball.vy=(ball.y-p.y)*7;
  return say(card,1.2);
 }

 ball.x=p.x+Math.cos(p.facing)*25;
 ball.y=p.y+Math.sin(p.facing)*25;
 ball.vx=p.vx+Math.cos(p.facing)*120;
 ball.vy=p.vy+Math.sin(p.facing)*120;
 say(hard?"STRONG TACKLE!":"BALL WON!",.55);
}
function control(dt){
 const p=me();
 let mx=(k.ArrowRight||k.d?1:0)-(k.ArrowLeft||k.a?1:0);
 let my=(k.ArrowDown||k.s?1:0)-(k.ArrowUp||k.w?1:0);
 const m=Math.hypot(mx,my)||1;
 const speed=p.speed*(k.Shift?1.38:1);

 p.vx=mx/m*speed;
 p.vy=my/m*speed;
 p.x=clamp(p.x+p.vx*dt,p.keeper?35:25,p.keeper?155:W-35);
 p.y=clamp(p.y+p.vy*dt,35,H-35);

 if(mx||my)p.facing=Math.atan2(my,mx);
}
function ai(dt){
 blue.forEach((p,i)=>{
  if(i===active)return;
  const tx=p.keeper?72:clamp(p.hx+(ball.x-W/2)*.15,160,W-170);
  const ty=p.keeper?clamp(ball.y,185,355):clamp(p.hy+(ball.y-H/2)*.2,65,H-65);
  p.x+=(tx-p.x)*(p.keeper?1.7:.7)*dt;
  p.y+=(ty-p.y)*(p.keeper?1.7:.7)*dt;
 });

 red.forEach(p=>{
  const tx=p.keeper?888:clamp(p.hx+(ball.x-W/2)*.26,260,W-105);
  const ty=p.keeper?clamp(ball.y,185,355):clamp(p.hy+(ball.y-H/2)*.28,65,H-65);
  p.x+=(tx-p.x)*(p.keeper?2:1)*dt;
  p.y+=(ty-p.y)*(p.keeper?2:1)*dt;

  if(!p.keeper&&d(p,ball)<28){
   ball.vx=-210;
   ball.vy=(ball.y-p.y)*8;
  }
 });
}
function goal(team){
 if(!run)return;
 run=false;
 score[team]++;
 hud();
 ui.g.hidden=false;
 ui.gm.textContent=team?"RED SCORES!":"BLUE SCORES!";

 setTimeout(()=>{
  ui.g.hidden=true;
  [...blue,...red].forEach(p=>{p.x=p.hx;p.y=p.hy;p.vx=0;p.vy=0;});

  const next=team===0?1:0;
  setupKickoff(next);

  run=true;
  last=performance.now();

  if(next===0){
   say("BLUE KICK OFF — PASS!");
  }else{
   say("RED KICK OFF");
   setTimeout(()=>{
    if(run&&kickoffTeam===1){
     ball.vx=-280;
     ball.vy=0;
     kickoff=false;
     say("RED PASS!");
    }
   },700);
  }

  requestAnimationFrame(loop);
 },1200);
}
function update(dt){
 time-=dt;

 if(time<=0){
  time=0;
  run=false;
  ui.s.textContent="FULL TIME";
  ui.start.hidden=false;
  ui.play.textContent="PLAY AGAIN";
  return hud();
 }

 control(dt);
 ai(dt);

 const p=me();
 if(d(p,ball)<38&&Math.hypot(ball.vx,ball.vy)<220){
  ball.vx+=(p.x+Math.cos(p.facing)*28-ball.x)*18*dt;
  ball.vy+=(p.y+Math.sin(p.facing)*28-ball.y)*18*dt;
 }

 ball.x+=ball.vx*dt;
 ball.y+=ball.vy*dt;
 ball.vx*=Math.pow(.25,dt);
 ball.vy*=Math.pow(.25,dt);

 if(ball.y<20||ball.y>H-20){
  ball.y=clamp(ball.y,20,H-20);
  ball.vy*=-.72;
 }
 if(ball.x<12){
  if(ball.y>190&&ball.y<350)goal(1);
  else{ball.x=12;ball.vx*=-.72;}
 }
 if(ball.x>W-12){
  if(ball.y>190&&ball.y<350)goal(0);
  else{ball.x=W-12;ball.vx*=-.72;}
 }

 if(d(ball,blue[0])<30){ball.vx=300;ball.vy=(ball.y-blue[0].y)*9;}
 if(d(ball,red[0])<30){ball.vx=-300;ball.vy=(ball.y-red[0].y)*9;}

 hud();
}
function player(p,on=false){
 x.save();
 x.translate(p.x,p.y);
 x.fillStyle="#0006";
 x.beginPath();x.ellipse(0,15,p.r,6,0,0,7);x.fill();

 if(on){
  x.strokeStyle="#f7d64a";
  x.lineWidth=4;
  x.beginPath();x.arc(0,0,p.r+7,0,7);x.stroke();
 }

 x.fillStyle=p.color;
 x.beginPath();x.arc(0,0,p.r,0,7);x.fill();
 x.fillStyle="white";
 x.font=`bold ${p.r}px Arial`;
 x.textAlign="center";
 x.textBaseline="middle";
 x.fillText(p.n,0,1);
 x.restore();
}
function draw(){
 x.clearRect(0,0,W,H);
 x.fillStyle="#176c54";
 x.fillRect(0,0,W,H);

 for(let i=0;i<8;i++){
  x.fillStyle=i%2?"#20775d":"#196b53";
  x.fillRect(i*120,0,120,H);
 }

 x.strokeStyle="#d9ffe8aa";
 x.lineWidth=4;
 x.strokeRect(26,26,W-52,H-52);
 x.beginPath();x.arc(W/2,H/2,70,0,7);x.stroke();
 x.beginPath();x.moveTo(W/2,26);x.lineTo(W/2,H-26);x.stroke();
 x.strokeRect(26,180,79,180);
 x.strokeRect(W-105,180,79,180);

 red.forEach(p=>player(p));
 blue.forEach((p,i)=>player(p,i===active));

 x.save();
 x.translate(ball.x,ball.y);
 x.fillStyle="#fff";
 x.beginPath();x.arc(0,0,14,0,Math.PI*2);x.fill();
 x.strokeStyle="#1c2430";x.lineWidth=2;x.stroke();
 x.fillStyle="#1c2430";
 x.beginPath();
 x.arc(0,0,5,0,Math.PI*2);
 x.arc(-6,-6,2.5,0,Math.PI*2);
 x.arc(7,-4,2.5,0,Math.PI*2);
 x.arc(5,7,2.5,0,Math.PI*2);
 x.arc(-7,6,2.5,0,Math.PI*2);
 x.fill();
 x.restore();

 x.fillStyle="#07101ad9";
 x.fillRect(14,12,180,40);
 x.fillStyle="white";
 x.font="bold 13px Arial";
 x.textAlign="left";
 x.fillText("CONTROL: "+me().name,25,37);
}
function loop(now){
 if(!run)return;
 const dt=Math.min(.035,(now-last)/1000);
 last=now;
 update(dt);
 draw();
 if(run)requestAnimationFrame(loop);
}

addEventListener("keydown",e=>{
 k[e.key]=true;
 if(e.code==="Space"){e.preventDefault();shoot();}
 if(e.key.toLowerCase()==="p")pass();
 if(e.key.toLowerCase()==="e")switchPlayer();
 if(e.key.toLowerCase()==="t")tackle();
 if(e.key.toLowerCase()==="q")tackle(true);
});
addEventListener("keyup",e=>k[e.key]=false);
ui.play.addEventListener("click",start);

const joy=document.querySelector("#joystick");
const stick=document.querySelector("#stick");

function moveTouch(e){
 const r=joy.getBoundingClientRect();
 const p=e.touches?e.touches[0]:e;
 let dx=p.clientX-r.left-r.width/2;
 let dy=p.clientY-r.top-r.height/2;
 const distance=Math.hypot(dx,dy);

 if(distance>32){
  dx=dx/distance*32;
  dy=dy/distance*32;
 }

 k.ArrowRight=dx>10;
 k.ArrowLeft=dx<-10;
 k.ArrowDown=dy>10;
 k.ArrowUp=dy<-10;
 stick.style.transform=`translate(${dx}px,${dy}px)`;
}

joy.addEventListener("pointerdown",e=>{joy.setPointerCapture(e.pointerId);moveTouch(e);});
joy.addEventListener("pointermove",e=>{if(e.buttons)moveTouch(e);});
joy.addEventListener("pointerup",()=>{
 k.ArrowRight=k.ArrowLeft=k.ArrowDown=k.ArrowUp=false;
 stick.style.transform="";
});

document.querySelector("#shootButton").addEventListener("pointerdown",shoot);
document.querySelector("#passButton").addEventListener("pointerdown",pass);
document.querySelector("#tackleButton").addEventListener("pointerdown",()=>tackle());
document.querySelector("#sprintButton").addEventListener("pointerdown",()=>k.Shift=true);
document.querySelector("#sprintButton").addEventListener("pointerup",()=>k.Shift=false);

c.addEventListener("pointerdown",e=>{
 const r=c.getBoundingClientRect();
 const px=(e.clientX-r.left)*W/r.width;
 const py=(e.clientY-r.top)*H/r.height;

 blue.forEach((player,index)=>{
  if(Math.hypot(player.x-px,player.y-py)<45){
   active=index;
   say(player.name+" SELECTED");
  }
 });
});

draw();
