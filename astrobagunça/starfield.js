// starfield.js - lightweight multi-layer starfield for cartoon look
(function(){
  const canvas = document.getElementById('starfield');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;

  function makeLayer(count, speedMul, sizeRange, alphaBase){
    const arr = [];
    for(let i=0;i<count;i++){
      arr.push({
        x: Math.random()*W,
        y: Math.random()*H,
        size: Math.random()*(sizeRange[1]-sizeRange[0]) + sizeRange[0],
        speed: (0.2 + Math.random()*0.9) * speedMul,
        alpha: alphaBase * (0.6 + Math.random()*0.4)
      });
    }
    return arr;
  }

  let layers = [];
  function build(){
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    layers = [
      makeLayer(Math.round((W*H)/90000), 0.5, [0.6,1.6], 0.9),
      makeLayer(Math.round((W*H)/120000), 1.1, [0.9,2.2], 0.7),
      makeLayer(Math.round((W*H)/180000), 2.4, [1.6,3.2], 0.45)
    ];
  }
  window.addEventListener('resize', build);
  build();

  function loop(){
    ctx.clearRect(0,0,W,H);
    // background tint
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(2,6,20,0.6)');
    g.addColorStop(1,'rgba(0,0,10,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    for(let i=0;i<layers.length;i++){
      const layer = layers[i];
      for(const s of layer){
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.y += s.speed;
        s.x -= i*0.02;
        if(s.y > H){ s.y = -2; s.x = Math.random()*W; }
        if(s.x < -10) s.x = W + 10;
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
})();
