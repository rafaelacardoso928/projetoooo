// jogo.js - pointer-friendly drag & drop, particles, timer, audio beeps
(function(){
  const CONFIG = {
    duration: 45,
    items: [
      { id:'itm-0', emoji:'🔧', label:'Chave' },
      { id:'itm-1', emoji:'🪖', label:'Capacete' },
      { id:'itm-2', emoji:'📘', label:'Manual' },
      { id:'itm-3', emoji:'🧴', label:'Garrafa' }
    ]
  };

  // DOM refs
  const stage = document.getElementById('stage');
  const tray = document.getElementById('tray');
  const timeEl = document.getElementById('time');
  const pointsEl = document.getElementById('points');
  const energyBar = document.getElementById('energy-bar');
  const popup = document.getElementById('popup');
  const popupTitle = document.getElementById('popup-title');
  const popupText = document.getElementById('popup-text');
  const btnRestart = document.getElementById('btn-restart');

  if(!stage || !tray) return;

  let timeLeft = CONFIG.duration;
  let points = 0;
  let energy = 0;
  let timerId = null;

  // create targets (top row)
  function createTargets(){
    document.querySelectorAll('.target').forEach(n=>n.remove());
    const n = CONFIG.items.length;
    for(let i=0;i<n;i++){
      const t = document.createElement('div');
      t.className = 'target';
      t.id = 't' + i;
      t.dataset.accept = CONFIG.items[i].id;
      const left = 10 + i*(80/(n-1));
      t.style.left = left + '%';
      t.style.top = '36px';
      t.innerHTML = `<div style="text-align:center"><div style="font-size:14px">${CONFIG.items[i].label}</div></div>`;
      stage.appendChild(t);
    }
  }

  // create tray items (bottom)
  function createTray(){
    tray.innerHTML = '';
    CONFIG.items.forEach((it, idx)=>{
      const el = document.createElement('div');
      el.className = 'item';
      el.id = it.id;
      el.setAttribute('role','button');
      el.innerHTML = `<div style="font-size:40px">${it.emoji}</div>`;
      tray.appendChild(el);

      // HTML5 drag
      el.draggable = true;
      el.addEventListener('dragstart', e=>{
        e.dataTransfer.setData('text/plain', it.id);
      });

      // pointer fallback for touch
      el.addEventListener('pointerdown', pointerStart);
    });
  }

  // pointer drag fallback
  let pointerState = null;
  function pointerStart(e){
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    pointerState = { el, id: el.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    el.style.position = 'absolute';
    el.style.left = (e.clientX - pointerState.offsetX) + 'px';
    el.style.top = (e.clientY - pointerState.offsetY) + 'px';
    el.style.zIndex = 9999;
    document.body.appendChild(el);

    function moveHandler(ev){
      if(!pointerState) return;
      el.style.left = (ev.clientX - pointerState.offsetX) + 'px';
      el.style.top = (ev.clientY - pointerState.offsetY) + 'px';
    }
    function upHandler(ev){
      document.removeEventListener('pointermove', moveHandler);
      document.removeEventListener('pointerup', upHandler);
      // create synthetic event for drop check
      const fake = { clientX: ev.clientX, clientY: ev.clientY, dataTransfer:{ getData: ()=>pointerState.id }, preventDefault: ()=>{} };
      handleDrop(fake);
      // restore
      el.style.position='';
      el.style.left='';
      el.style.top='';
      el.style.zIndex='';
      pointerState = null;
    }
    document.addEventListener('pointermove', moveHandler);
    document.addEventListener('pointerup', upHandler);
  }

  // drop handler (HTML5)
  function handleDrop(e){
    e.preventDefault && e.preventDefault();
    const id = e.dataTransfer ? e.dataTransfer.getData('text/plain') : (pointerState && pointerState.id);
    if(!id) return;
    const item = document.getElementById(id);
    if(!item) return;

    const x = e.clientX, y = e.clientY;
    const targets = Array.from(document.querySelectorAll('.target'));
    let placed = false;
    for(const t of targets){
      const r = t.getBoundingClientRect();
      if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){
        if(t.dataset.accept === id){
          // snap item into stage
          const stageRect = stage.getBoundingClientRect();
          item.style.position = 'absolute';
          item.style.left = (r.left - stageRect.left + (r.width - item.offsetWidth)/2) + 'px';
          item.style.top = (r.top - stageRect.top + (r.height - item.offsetHeight)/2) + 'px';
          stage.appendChild(item);
          item.draggable = false;
          t.classList.add('ready');
          onCorrect();
          placed = true;
        } else {
          // wrong: shake
          t.animate([{ transform:'translateY(0)' },{ transform:'translateY(-6px)' },{ transform:'translateY(0)' }], { duration:280 });
          try{ navigator.vibrate && navigator.vibrate(40); }catch(e){}
        }
        break;
      }
    }
    // if not placed: nothing (item stays in tray)
  }

  // attach drop listeners
  stage.addEventListener('dragover', e=> e.preventDefault());
  stage.addEventListener('drop', handleDrop);

  // correct action
  function onCorrect(){
    points++;
    energy = Math.min(100, energy + Math.round(100/CONFIG.items.length));
    updateHUD();
    playBeep(880, 0.06, 'sine');
    spawnSpark();
    if(points >= CONFIG.items.length){
      win();
    }
  }

  // HUD
  function updateHUD(){
    timeEl && (timeEl.textContent = timeLeft);
    pointsEl && (pointsEl.textContent = points);
    energyBar && (energyBar.style.width = energy + '%');
  }

  // timer
  function startTimer(){
    clearInterval(timerId);
    timeLeft = CONFIG.duration;
    timerId = setInterval(()=>{
      timeLeft--;
      updateHUD();
      if(timeLeft <= 0){
        clearInterval(timerId);
        lose();
      }
    },1000);
  }

  // particles
  function spawnSpark(){
    const s = document.createElement('div');
    s.style.position='absolute';
    s.style.left = (Math.random()*60+20) + '%';
    s.style.top = (Math.random()*30+30) + '%';
    s.style.width='10px'; s.style.height='10px'; s.style.borderRadius='50%';
    s.style.background='rgba(255,255,255,0.95)';
    s.style.boxShadow='0 0 14px rgba(123,231,255,0.9)';
    stage.appendChild(s);
    s.animate([{opacity:1, transform:'scale(.6)'},{opacity:0, transform:'scale(3)'}],{duration:700}).onfinish = ()=> s.remove();
  }

  // audio beep
  function playBeep(freq=440, duration=0.08, type='sine'){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      o.start(now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      o.stop(now + duration + 0.02);
      setTimeout(()=> ctx.close(), (duration+0.05)*1000);
    }catch(e){}
  }

  // win/lose
  function win(){
    clearInterval(timerId);
    popupTitle.textContent = '🎉 Missão cumprida!';
    popupText.textContent = 'A nave está pronta para decolar! Muito bem!';
    popup.classList.remove('hidden');
    playWinAnimation();
    playBeep(1200,0.18,'sine');
  }
  function lose(){
    popupTitle.textContent = '⏳ Tempo esgotado';
    popupText.textContent = 'Tente novamente — você quase conseguiu!';
    popup.classList.remove('hidden');
    playBeep(220,0.4,'sawtooth');
  }

  // rocket animation on win
  function playWinAnimation(){
    const r = document.createElement('div');
    r.innerHTML = '🚀';
    r.style.position='fixed';
    r.style.left='50%'; r.style.bottom='10px';
    r.style.fontSize='72px'; r.style.transform='translateX(-50%)';
    r.style.zIndex=9999;
    document.body.appendChild(r);
    r.animate([{ transform:'translate(-50%,0) scale(1)' , opacity:1 }, { transform:'translate(-50%,-120vh) scale(1.2)', opacity:1 }], { duration:2200, easing:'cubic-bezier(.2,.9,.2,1)' })
    .onfinish = ()=> r.remove();
  }

  // restart binding
  btnRestart.addEventListener('click', ()=>{
    popup.classList.add('hidden');
    restart();
  });

  // restart function
  function restart(){
    points = 0; energy = 0;
    updateHUD();
    createTargets(); createTray();
    startTimer();
  }

  // init
  createTargets(); createTray(); updateHUD(); startTimer();

})();
