import { normalize } from './configuration.js';
export function mountHero(c){

const ctx=c.getContext('2d');
if(!ctx) return () => {};
let frameId=0, disposed=false;
const media=matchMedia('(prefers-reduced-motion: reduce)');
const options=normalize({text:'VJEC',stretch:1,bounce:.65,stagger:100});
const off=document.createElement('canvas'),gl=off.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
let W,H,D,mx=.5,my=.5,tx=.5,ty=.5,a=0,target=0,clock=0;
const glyphs=[
'M70 165 H150 L202 338 L255 165 H335 L245 425 H160 Z',
'M385 165 H462 V337 C462 404 427 432 365 432 C305 432 278 396 278 339 L350 326 C350 354 355 365 369 365 C380 365 385 350 385 330 Z',
'M485 165 H660 V221 H563 V265 H646 V320 H563 V368 H669 V425 H485 Z',
'M908 240 L837 260 C825 223 807 220 790 220 C750 220 736 252 736 295 C736 340 753 371 790 371 C814 371 829 355 840 326 L910 347 C890 405 846 433 790 433 C708 433 662 375 662 295 C662 210 714 157 792 157 C850 157 890 191 908 240 Z'
].map(s=>new Path2D(s));
const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fs=`precision highp float;
uniform vec2 res,m;
uniform float t,a,front;
uniform vec4 drop[3];
float bell(float x,float c,float k){float v=(x-c)*k;return exp(-v*v);}
float center(float x){
float y=.48-.07*bell(x,.075,16.)+.18*bell(x,.29,7.)+.045*bell(x,.58,11.)+.08*bell(x,.74,17.)-.42*smoothstep(.76,1.04,x);
y+=.014*sin(x*17.-t*.65)+.009*cos(x*29.+t*.5);
return y+a*bell(x,m.x,10.)*clamp(m.y-y,-.14,.14)*.55;
}
float faceWidth(float x){
float w=.035+.06*bell(x,.055,11.)+.03*bell(x,.27,11.)+.025*bell(x,.58,13.)+.035*bell(x,.89,10.);
return w*(.86+.14*sin(x*19.-t*.65)+.08*cos(x*28.+t*.5))*(1.-.44*bell(x,.42,26.))*(1.-.38*bell(x,.70,22.));
}
// Both materials share ONE signed-distance surface. Black chrome widens the
// same ribbon above/below its colored face, so a gap cannot open on hover.
float upper(float x){return .012+.18*smoothstep(.73,.98,x);}
float lower(float x){return .025+.075*bell(x,.27,10.)+.025*bell(x,.055,11.);}
float width(float x){return faceWidth(x)+(upper(x)+lower(x))*.5;}
float spine(float x){return center(x)+(lower(x)-upper(x))*.5;}
float band(vec2 p){return (p.y-spine(p.x)+.008*sin(p.x*25.+p.y*16.-t*.6))/max(.025,width(p.x));}
float smoothMin(float x,float y,float k){float h=clamp(.5+.5*(y-x)/k,0.,1.);return mix(y,x,h)-k*h*(1.-h);}
float field(vec2 p){
float d=(abs(band(p))-1.)*width(p.x)*.68;
float aspect=res.x/res.y;
for(int i=0;i<3;i++){
vec4 b=drop[i];
if(b.w>0.){
float age=b.z;
float side=b.y;
float x=b.x;
float edge=spine(x)+side*width(x);
float stretch=.12*sin(min(age,1.)*1.5708);
float travel=age<1.?stretch:.12+.045*sin((age-1.)*3.14159);
vec2 root=vec2(x*aspect,edge);
vec2 tip=root+vec2(.035*sin(age*2.),side*travel);
vec2 q=p*vec2(aspect,1.)-tip;
float radius=b.w*(1.-.22*min(age,1.));
radius*=1.-smoothstep(1.25,2.,age);
float body=length(q/vec2(.78,1.35-.35*smoothstep(.7,1.5,age)))-radius;
if(age<.95){
vec2 ba=tip-root;
vec2 pa=p*vec2(aspect,1.)-root;
float h=clamp(dot(pa,ba)/max(dot(ba,ba),.00001),0.,1.);
float neck=radius*(.65-.60*sin(h*3.14159))*pow(max(.001,1.-age/.95),.55);
float tendon=length(pa-ba*h)-neck;
body=smoothMin(body,tendon,.013);
}
float blend=.017*(1.-smoothstep(.65,1.1,age))+.003;
d=smoothMin(d,body,blend);
}}
return d;
}
void main(){
vec2 p=vec2(gl_FragCoord.x/res.x,1.-gl_FragCoord.y/res.y);
float f=band(p),d=field(p),e=.0009;
float dx=(field(p+vec2(e,0.))-field(p-vec2(e,0.)))/(2.*e);
float dy=(field(p+vec2(0.,e))-field(p-vec2(0.,e)))/(2.*e);
vec3 n=normalize(vec3(dx*.85,dy*.85,sqrt(max(.025,-d*18.))+.08));
vec3 r=reflect(vec3(0.,0.,-1.),n);
float s=r.x*2.8+r.y*3.3+sin(p.x*15.-t*.42)*1.5+f*1.3;
vec3 col=mix(vec3(.012,.055,.95),vec3(.46,.012,.87),.5+.5*sin(s));
col=mix(vec3(.025,.005,.15),col,.30+.70*pow(.5+.5*cos(s*1.25+f*1.8),.7));
col=mix(col,vec3(.01,.73,1.),pow(.5+.5*cos(s*1.6-1.2),8.)*.96);
col=mix(col,vec3(.99,.89,1.),pow(.5+.5*sin(s*1.9+sin(p.x*19.-t*.6)),19.)*.98);
float metal=smoothstep(.45,.92,sin(p.x*15.+f*1.5-t*.25));
vec3 blackChrome=vec3(.009,.01,.018)+vec3(.35,.37,.45)*pow(.5+.5*sin(s*1.7),14.);
col=mix(col,blackChrome,metal*.65);
float face=(p.y-center(p.x)+.008*sin(p.x*25.+p.y*16.-t*.6))/max(.025,faceWidth(p.x));
float colorFace=1.-smoothstep(.78,1.08,abs(face));
blackChrome+=vec3(.12,.12,.15)*pow(.5+.5*cos(s*1.3+t*.25),9.);
col=mix(blackChrome,col,colorFace);
gl_FragColor=vec4(col,(1.-smoothstep(-.001,.0015,d))*mix(1.,colorFace,front));
}`;
let ready=false,u={};
if(gl){
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(s));return s}
let p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);ready=gl.getProgramParameter(p,gl.LINK_STATUS);
if(ready){
gl.useProgram(p);let b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
let l=gl.getAttribLocation(p,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
for(let k of ['res','m','t','a','front'])u[k]=gl.getUniformLocation(p,k);
u.drop=gl.getUniformLocation(p,'drop[0]');
}}
function resize(){W=c.clientWidth;H=c.clientHeight;D=Math.min(devicePixelRatio||1,1.5);c.width=off.width=Math.round(W*D);c.height=off.height=Math.round(H*D);if(ready)gl.viewport(0,0,off.width,off.height);if(last && media.matches)frame(performance.now())}
const observer=new ResizeObserver(resize);observer.observe(c);
function center(x,t){
const b=(v,k)=>Math.exp(-Math.pow((x-v)*k,2));
let z=Math.max(0,Math.min(1,(x-.76)/.28));
return .48-.07*b(.075,16)+.18*b(.29,7)+.045*b(.58,11)+.08*b(.74,17)-.42*z*z*(3-2*z)+.014*Math.sin(x*17-t*.65)+.009*Math.cos(x*29+t*.5);
}
const drops=Array.from({length:3},()=>({age:3,x:0,side:1,r:0}));
let spawn=-10,lastX=.5,lastY=.5,lastMove=0;
c.onpointermove=e=>{
if(media.matches)return;
let r=c.getBoundingClientRect();tx=(e.clientX-r.left)/W;ty=(e.clientY-r.top)/H;target=1;activeLetter=(tx*1600-34)/1.45;
let dt=Math.max(.016,clock-lastMove);
let speed=Math.hypot(tx-lastX,ty-lastY)/dt;
lastX=tx;lastY=ty;lastMove=clock;
let distance=ty-center(tx,clock);
if(clock-spawn>1.15&&speed>.4&&Math.abs(distance)>.045&&Math.abs(distance)<.22){
let d=drops.find(p=>p.age>=2);
if(d){d.x=Math.max(.045,Math.min(.955,tx));d.side=distance<0?-1:1;d.age=0;d.r=.023+Math.min(.012,speed*.004);spawn=clock;}
}};
c.onpointerleave=()=>{target=0;activeLetter=-1;};
const vLeft=new Path2D('M70 165 H150 L202 338 L160 425 Z');
const jHook=new Path2D('M278 339 L350 326 C350 354 355 365 369 365 C380 365 385 350 385 330 L385 432 C318 440 278 396 278 339 Z');
const cTop=new Path2D('M662 157 H920 V285 L837 260 C825 223 807 220 790 220 C750 220 736 252 736 295 L662 230 Z');
// Filled outlines retain the supplied HTML's heavy letterforms. The elastic
// package's sampled-path deformation and semi-implicit spring are applied only
// to these four glyphs, never to the heading, navigation, ribbon or statistics.
const outlines = [
'M70 165 H150 L202 338 L255 165 H335 L245 425 H160 Z',
'M385 165 H462 V337 C462 404 427 432 365 432 C305 432 278 396 278 339 L350 326 C350 354 355 365 369 365 C380 365 385 350 385 330 Z',
'M485 165 H660 V221 H563 V265 H646 V320 H563 V368 H669 V425 H485 Z',
'M908 240 L837 260 C825 223 807 220 790 220 C750 220 736 252 736 295 C736 340 753 371 790 371 C814 371 829 355 840 326 L910 347 C890 405 846 433 790 433 C708 433 662 375 662 295 C662 210 714 157 792 157 C850 157 890 191 908 240 Z'
];
const letters=outlines.map((d,i)=>{
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',d);
  const length=path.getTotalLength();
  return {points:Array.from({length:401},(_,n)=>path.getPointAtLength(length*n/400)),
    x:[202,370,577,790][i],width:[265,185,184,248][i],pull:0,velocity:0};
});
let activeLetter=-1,selected=-1;
c.onkeydown=e=>{
 if(media.matches)return;
 if(['ArrowLeft','ArrowRight','Enter',' '].includes(e.key)){
  e.preventDefault();
  selected=(selected+(e.key==='ArrowLeft'?-1:1)+4)%4;
  activeLetter=letters[selected].x;
 }else if(e.key==='Escape') activeLetter=-1;
};
c.onkeyup=()=>activeLetter=-1;
c.onblur=()=>{activeLetter=-1;target=0;};
function spring(dt){
 const damping=25-options.bounce*15;
 for(const letter of letters){
  const influence=activeLetter<0?0:Math.max(0,1-Math.abs(activeLetter-letter.x)/(letter.width*.8));
  const goal=media.matches?0:influence*options.stretch;
  const steps=Math.ceil(dt/.008);
  for(let i=0;i<steps;i++){
   const step=dt/steps;
   letter.velocity+=((goal-letter.pull)*190-letter.velocity*damping)*step;
   letter.pull+=letter.velocity*step;
  }
 }
}
function letterTransform(){ctx.translate(W*34/1600,H*88/900);ctx.scale(W*1.45/1600,H*1.47/900);}
function shape(letter){
 ctx.save();letterTransform();ctx.fillStyle='#050505';ctx.beginPath();
 letter.points.forEach((point,i)=>{
  const t=Math.max(0,(point.y-157)/276);
  const waist=Math.sin(Math.PI*t)*Math.max(0,letter.pull)*.2;
  const x=letter.x+(point.x-letter.x)*(1-waist);
  const y=point.y+letter.pull*27*Math.pow(t,1.65);
  if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
 });ctx.closePath();ctx.fill();ctx.restore();
}
function occlude(i,p){
 // Keep over-under crossings aligned as each letter stretches.
 ctx.save();letterTransform();ctx.scale(1,1+letters[i].pull*.085);
 ctx.clip(glyphs[i]);ctx.fillStyle='#050505';ctx.fill(p);ctx.restore();
}
let last=0,startTime=0;
function frame(ms){
if(disposed)return;
let dt=Math.min(.04,last?(ms-last)/1000:.016);last=ms;if(!startTime)startTime=ms;clock=media.matches?0:(ms-startTime)*.001;
spring(dt);
mx+=(tx-mx)*.065;my+=(ty-my)*.065;a+=(target-a)*.035;

let data=[];
for(let d of drops){if(!media.matches)d.age+=dt*.85;data.push(d.x,d.side,d.age,d.age<2?d.r:0)}
ctx.setTransform(D,0,0,D,0,0);ctx.clearRect(0,0,W,H);
if(ready){
gl.uniform1f(u.front,0);gl.uniform2f(u.res,off.width,off.height);gl.uniform2f(u.m,mx,my);gl.uniform1f(u.t,clock);gl.uniform1f(u.a,a);gl.uniform4fv(u.drop,new Float32Array(data));gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
// The chrome back passes behind the letters. The colored face passes in
// front, using the same field, clock and pointer uniforms in both passes.
if(ready)ctx.drawImage(off,0,0,W,H);
letters.forEach(shape);
if(ready){
 gl.uniform1f(u.front,1);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 ctx.drawImage(off,0,0,W,H);
}
occlude(0,vLeft);occlude(1,jHook);occlude(3,cTop);
if(!ready){
  // A local SVG fallback preserves the ribbon if WebGL is unavailable.
  if(fallback.complete && fallback.naturalWidth)ctx.drawImage(fallback,0,0,W,H);
}
if(!media.matches)frameId=requestAnimationFrame(frame);
}
const fallback=new Image();fallback.src='/hero/ribbon-fallback.svg';
fallback.onload=()=>{if(!ready)frame(performance.now());};

const motionChange=()=>{
 cancelAnimationFrame(frameId);
 if(media.matches){activeLetter=-1;target=0;a=0;for(const letter of letters){letter.pull=0;letter.velocity=0;}for(const drop of drops)drop.age=3;}
 frameId=requestAnimationFrame(frame);
};
media.addEventListener('change',motionChange);
resize();frameId=requestAnimationFrame(frame);
return ()=>{
 disposed=true;cancelAnimationFrame(frameId);observer.disconnect();
 media.removeEventListener('change',motionChange);
 c.onpointermove=c.onpointerleave=c.onkeydown=c.onkeyup=c.onblur=null;
 if(gl){const lose=gl.getExtension('WEBGL_lose_context');lose?.loseContext();}
};

}
