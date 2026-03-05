const TOKEN_KEY='jsm_tokens';
const VIDEO_WATCHED_KEY='jsm_videos_watched';
function getTokens(){try{return parseInt(localStorage.getItem(TOKEN_KEY)||'0',10);}catch(_){return 0;}}
function addTokens(n){const t=getTokens()+n;try{localStorage.setItem(TOKEN_KEY,t);}catch(_){}updateAllTokenDisplays();return t;}
function updateAllTokenDisplays(){const t=getTokens();document.querySelectorAll('.js-token-count').forEach(el=>{el.textContent=t;});}
function initHamburger(){
  const btn=document.getElementById('hamburger-btn'),menu=document.getElementById('nav-menu'),ov=document.getElementById('nav-overlay');
  if(!btn||!menu)return;
  function open(){btn.classList.add('open');menu.classList.add('open');if(ov)ov.classList.add('open');document.body.style.overflow='hidden';}
  function close(){btn.classList.remove('open');menu.classList.remove('open');if(ov)ov.classList.remove('open');document.body.style.overflow='';}
  btn.addEventListener('click',()=>menu.classList.contains('open')?close():open());
  if(ov)ov.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  const path=location.pathname.split('/').pop()||'index.html';
  menu.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href')===path)a.classList.add('active');});
}
const JSM_VIDEOS=[
  {id:'p5oUI7RCyUI',title:'Mechanics & Motion',topic:'Mechanics',desc:"Miller opens with the fundamentals — forces, mass, Newton's Laws. He yanks a tablecloth from under dishes to prove inertia. The most dramatic introduction to physics ever filmed."},
  {id:'j-ixGKZlgKo',title:'Gravity & Free Fall',topic:'Gravity',desc:'Does a heavy ball fall faster? Miller drops objects of different masses and proves Galileo right: all objects fall at 9.8 m/s² regardless of mass. Aristotle was wrong for 2,000 years.'},
  {id:'hmFQqjMF_f0',title:'Pendulums & Oscillation',topic:'Oscillation',desc:"A pendulum's period depends ONLY on its length — not mass, not amplitude. Miller sets up pendulums of every size and weight, asks you to predict, then reveals the truth."},
  {id:'pMbWrPYCpDw',title:'Pressure & Fluids',topic:'Fluids',desc:"Atmospheric pressure is enormous — we don't feel it because it pushes from all sides. Miller seals a can of steam, cools it, and the atmosphere crushes it flat. Pascal's Law made real."},
  {id:'KPZ_8pL_a_g',title:'Heat & Temperature',topic:'Thermodynamics',desc:'Heat and temperature are NOT the same thing. Thermal expansion, the fire syringe, liquid nitrogen — Miller explains adiabatic compression and why extreme cold shatters rubber.'},
  {id:'RVsi2DM1xbU',title:'Electricity & Magnetism',topic:'Electromagnetism',desc:"The Van de Graaff generator builds hundreds of thousands of volts. Hair stands on end. Sparks fly. Then Miller connects electricity and magnetism through Faraday's laws."},
  {id:'sENgdSF8ppA',title:'Light & Optics',topic:'Optics',desc:"White light through a prism reveals Newton's rainbow. Total internal reflection. Convex and concave lenses. The eye, telescope and camera — all use identical principles."},
  {id:'zQ1sMhFDjNE',title:'Sound & Waves',topic:'Waves',desc:'A bell rings inside a glass jar. Miller pumps out the air. As the vacuum builds, the sound fades to silence. There is no sound in space. The universe has rules.'},
  {id:'BLEiE-TdNNQ',title:'Inertia Demonstrations',topic:'Inertia',desc:"Newton's First Law made visceral — tablecloth pulled from under dishes, cards snapped from under coins. A body at rest stays at rest. The universe is lazy. That is the law."},
  {id:'vFfninh2Zbk',title:'Surface Tension',topic:'Surface Tension',desc:'A steel needle floats on water. Insects walk on ponds. The molecular forces at a liquid surface create an elastic skin. Miller adds one drop of soap — the needle sinks instantly.'},
  {id:'D-LQeWREUVs',title:'The Gyroscope',topic:'Angular Momentum',desc:'A spinning gyroscope defies gravity and resists changes to its axis. Angular momentum is conserved. Miller demonstrates precession and nutation — the physics of navigation.'},
  {id:'Wb7eDXbhLco',title:'Atmospheric Pressure',topic:'Pressure',desc:'The atmosphere weighs 10+ tonnes per square metre on everything beneath it. Miller shows how this invisible force can be harnessed, measured, and made to crush metal cans.'},
];
let curVidIdx=0;
function initPlaylist(){
  const iframe=document.getElementById('main-player');
  const grid=document.getElementById('playlist-grid');
  const titleEl=document.getElementById('video-title');
  const topicEl=document.getElementById('video-topic');
  const descEl=document.getElementById('video-desc');
  if(!iframe||!grid)return;
  function loadVideo(idx){
    curVidIdx=idx;
    const v=JSM_VIDEOS[idx];
    iframe.src=`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1`;
    if(titleEl)titleEl.textContent=v.title;
    if(topicEl)topicEl.textContent=v.topic;
    if(descEl)descEl.textContent=v.desc;
    grid.querySelectorAll('.playlist-item').forEach((el,i)=>el.classList.toggle('active',i===idx));
    let watched=[];try{watched=JSON.parse(sessionStorage.getItem(VIDEO_WATCHED_KEY)||'[]');}catch(_){}
    if(!watched.includes(v.id)){watched.push(v.id);try{sessionStorage.setItem(VIDEO_WATCHED_KEY,JSON.stringify(watched));}catch(_){}addTokens(2);showToast('🏅 +2 tokens for watching!');}
  }
  JSM_VIDEOS.forEach((v,i)=>{
    const item=document.createElement('div');
    item.className='playlist-item'+(i===0?' active':'');
    item.innerHTML=`
      <div class="playlist-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy" onerror="this.parentNode.style.background='#111';this.remove();">
        <div class="play-icon">▶</div>
      </div>
      <div class="playlist-info">
        <div class="playlist-title">${v.title}</div>
        <div class="playlist-topic">${v.topic}</div>
        <div class="playlist-desc">${v.desc.substring(0,90)}…</div>
      </div>`;
    item.addEventListener('click',()=>loadVideo(i));
    grid.appendChild(item);
  });
  const first=JSM_VIDEOS[0];
  iframe.src=`https://www.youtube.com/embed/${first.id}?rel=0&modestbranding=1`;
  if(titleEl)titleEl.textContent=first.title;
  if(topicEl)topicEl.textContent=first.topic;
  if(descEl)descEl.textContent=first.desc;
}
function showToast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(60px);background:#1a1a2e;border:1px solid var(--accent);border-radius:8px;padding:.6rem 1.2rem;color:var(--accent);font-size:.85rem;z-index:900;transition:transform .3s;';document.body.appendChild(t);}t.textContent=msg;t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.transform='translateX(-50%) translateY(60px)';},2400);}
const QUIZ_QUESTIONS=[
  {q:"What was the title of Julius Sumner Miller's famous TV series?",opts:['Why Is It So?','The Physics Show','Science Matters','Matter & Energy'],answer:0,explanation:'"Why Is It So?" was his iconic phrase and the title of his ABC series from 1963.'},
  {q:"Newton's First Law states an object stays at rest unless acted on by:",opts:['Gravity','An unbalanced force','Friction only','Its own weight'],answer:1,explanation:"Newton's First Law — an unbalanced external force is required to change the state of motion."},
  {q:'A dropped ball falls with what acceleration (no air resistance)?',opts:['Zero','Decreasing','Constant ≈9.8 m/s²','Increasing then decreasing'],answer:2,explanation:'Gravity provides constant 9.8 m/s² downward — one of Miller\'s favourite demonstrations.'},
  {q:"What does Bernoulli's Principle state?",opts:['Faster fluid has higher pressure','Faster fluid has lower pressure','Pressure is constant','Fluids always flow downhill'],answer:1,explanation:'Where fluid velocity is higher, pressure is lower. This explains flight, sailing, and the curveball.'},
  {q:'Which law explains why a boat floats?',opts:["Newton's 3rd Law","Boyle's Law","Archimedes' Principle","Ohm's Law"],answer:2,explanation:"Archimedes' Principle: a submerged object is buoyed by a force equal to the weight of fluid displaced."},
  {q:'Conservation of angular momentum explains why a spinning skater:',opts:['Slows when arms extend','Speeds up when arms pull in','Falls over','Stays at constant speed'],answer:1,explanation:'Pulling arms in decreases moment of inertia, so spin rate increases to conserve angular momentum.'},
  {q:'In which medium does sound travel fastest?',opts:['Vacuum','Air','Water','Steel'],answer:3,explanation:'Steel ~5100 m/s, water ~1480 m/s, air ~343 m/s, vacuum = 0.'},
  {q:'What does F = ma mean?',opts:['Force = mass + acceleration','Force = mass × acceleration','Force = 9.8 always','Friction = mass × area'],answer:1,explanation:"Newton's Second Law: Force = mass × acceleration."},
];
let quizIdx=0,quizScore=0;
function initQuiz(){if(document.getElementById('quiz-container'))renderQuestion();}
function renderQuestion(){
  const cont=document.getElementById('quiz-container');if(!cont)return;
  if(quizIdx>=QUIZ_QUESTIONS.length){cont.innerHTML=`<div style="text-align:center;padding:2rem"><div style="font-size:3rem;margin-bottom:1rem">🏅</div><h3>Quiz Complete!</h3><p style="font-size:1.1rem;margin:.75rem 0">Score: <strong>${quizScore}/${QUIZ_QUESTIONS.length}</strong></p><p>Tokens earned: <strong>+${quizScore*5}</strong> 🏅</p><button onclick="location.reload()" style="margin-top:1rem;padding:.6rem 1.5rem;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem">Try Again</button></div>`;addTokens(quizScore*5);return;}
  const q=QUIZ_QUESTIONS[quizIdx];
  cont.innerHTML=`<div style="margin-bottom:.5rem;font-size:.85rem;color:var(--text-secondary)">Question ${quizIdx+1} of ${QUIZ_QUESTIONS.length}</div><p style="font-size:1.05rem;font-weight:600;margin-bottom:1rem">${q.q}</p><div style="display:flex;flex-direction:column;gap:.5rem">${q.opts.map((o,i)=>`<button onclick="answerQ(${i})" style="text-align:left;padding:.7rem 1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text-primary);font-size:.95rem">${o}</button>`).join('')}</div>`;
}
function answerQ(i){const q=QUIZ_QUESTIONS[quizIdx];const ok=i===q.answer;if(ok)quizScore++;const cont=document.getElementById('quiz-container');cont.innerHTML=`<div style="padding:1.5rem;background:${ok?'rgba(0,200,100,.08)':'rgba(255,60,60,.08)'};border:1px solid ${ok?'#00c864':'#ff3c3c'};border-radius:12px;margin-bottom:1rem"><div style="font-size:1.4rem;margin-bottom:.5rem">${ok?'✅ Correct!':'❌ Not quite'}</div><p style="font-size:.9rem;line-height:1.6">${q.explanation}</p></div><button onclick="nextQ()" style="padding:.6rem 1.5rem;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem">Next →</button>`;}
function nextQ(){quizIdx++;renderQuestion();}
document.addEventListener('DOMContentLoaded',()=>{updateAllTokenDisplays();initHamburger();initPlaylist();initQuiz();});
