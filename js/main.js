
/* ══════════════════════════════════
   1. YOUTUBE API
══════════════════════════════════ */
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

/* ══════════════════════════════════
   2. FIREBASE SETUP
══════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5IALw4WeWOf3awXeKR_btm3GHLbCVD_w",
  authDomain: "weddinginvitation-7bcd0.firebaseapp.com",
  databaseURL: "https://weddinginvitation-7bcd0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "weddinginvitation-7bcd0",
  storageBucket: "weddinginvitation-7bcd0.firebasestorage.app",
  messagingSenderId: "1030339547742",
  appId: "1:1030339547742:web:15707ff3fcda0fc543dacf",
  measurementId: "G-LQFHNDVW1C"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const wishesRef = ref(db, 'wishes');

/* ══════════════════════════════════
   3. YOUTUBE PLAYER
══════════════════════════════════ */
window.ytPlayer = null;
window.ytReady = false;
window.isPlaying = false;

window.onYouTubeIframeAPIReady = function() {
  window.ytPlayer = new YT.Player('yt-frame', {
    videoId: 'Mn_qLC7_ueA',
    playerVars: { autoplay:0, loop:1, playlist:'Mn_qLC7_ueA', controls:0, disablekb:1, fs:0, modestbranding:1, origin:window.location.origin },
    events: {
      onReady: () => { window.ytReady = true; },
      onStateChange: (e) => {
        window.isPlaying = (e.data === YT.PlayerState.PLAYING);
        const btn = document.getElementById('musicBtn');
        if (btn) btn.textContent = window.isPlaying ? '⏸' : '▶';
      }
    }
  });
};

window.openInvitation = function() {
  const opening = document.getElementById('opening');
  const invitation = document.getElementById('invitation');
  if (window.ytReady && window.ytPlayer) {
    window.ytPlayer.unMute();
    window.ytPlayer.setVolume(35);
    window.ytPlayer.playVideo();
  }
  opening.classList.add('fade-out');
  if (window._killOpeningBF) window._killOpeningBF();
  setTimeout(() => {
    opening.style.display = 'none';
    document.body.style.overflow = 'auto';
    invitation.classList.add('visible');
    initScrollAnim();
    initInvFX();
    initWishCarousel();
  }, 1800);
};

window.toggleMusic = function() {
  if (!window.ytReady || !window.ytPlayer) return;
  const state = window.ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    window.ytPlayer.pauseVideo();
  } else {
    window.ytPlayer.unMute();
    window.ytPlayer.setVolume(35);
    window.ytPlayer.playVideo();
  }
};


/* ══════════════════════════════════
   4. Countdown Timer
══════════════════════════════════ */
// Set the date we're counting down to
// FORMAT: Year, Month (0-11), Day, Hour, Minute
const weddingDate = new Date("2026-05-27T08:00:00").getTime();

const timer = setInterval(function() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the results in the elements with id="days", "hours", etc.
    document.getElementById("days").innerHTML = days.toString().padStart(2, '0');
    document.getElementById("hours").innerHTML = hours.toString().padStart(2, '0');
    document.getElementById("minutes").innerHTML = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").innerHTML = seconds.toString().padStart(2, '0');

    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(timer);
        document.getElementById("countdown").innerHTML = "ថ្ងៃមង្គលការបានមកដល់ហើយ!";
    }
}, 1000);

/* ══════════════════════════════════
   5. WISH CAROUSEL
══════════════════════════════════ */
let allWishes = [];
let carouselIndex = 0;
let autoTimer = null;
let isFrozen = false;
let carouselReady = false;

// Listen for Firebase data
onValue(wishesRef, (snapshot) => {
  const data = snapshot.val();
  allWishes = data ? Object.entries(data) : [];
  if (carouselReady) rebuildSlides();
});

function initWishCarousel() {
  carouselReady = true;
  rebuildSlides();
  setupCardInteraction();
}

function rebuildSlides() {
  const track = document.getElementById('wishTrack');
  const dotsEl = document.getElementById('wishDots');
  if (!track || !dotsEl) return;

  // Save current index within bounds
  if (carouselIndex >= allWishes.length) carouselIndex = 0;

  // Build slides
  track.innerHTML = '';
  if (allWishes.length === 0) {
    track.innerHTML = `
      <div class="wish-slide">
        <p class="wish-text" style="opacity:0.5;">Be the first to send your blessing 🙏</p>
      </div>`;
    dotsEl.innerHTML = '';
    return;
  }

  allWishes.forEach(([id, wish]) => {
    const slide = document.createElement('div');
    slide.className = 'wish-slide';
    slide.dataset.id = id;
    slide.innerHTML = `
      <span class="author-top">${escHtml(wish.name)}</span>
      <p class="wish-text">${escHtml(wish.message)}</p>`;
    track.appendChild(slide);
  });

  // Build dots
  dotsEl.innerHTML = '';
  allWishes.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'wish-dot' + (i === carouselIndex ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
  });

  // Set initial position without animation
  setSlideImmediate(carouselIndex);

  // Start auto rotation
  startAutoSlide();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setSlideImmediate(index) {
  const track = document.getElementById('wishTrack');
  if (!track) return;
  track.style.transition = 'none';
  track.style.transform = `translateX(-${index * 100}%)`;
}

function goToSlide(index, animated = true) {
  const track = document.getElementById('wishTrack');
  const dotsEl = document.getElementById('wishDots');
  if (!track) return;

  carouselIndex = ((index % allWishes.length) + allWishes.length) % allWishes.length;

  if (animated) {
    track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  } else {
    track.style.transition = 'none';
  }
  track.style.transform = `translateX(-${carouselIndex * 100}%)`;

  // Update dots
  if (dotsEl) {
    dotsEl.querySelectorAll('.wish-dot').forEach((d, i) => {
      d.classList.toggle('active', i === carouselIndex);
    });
  }

  // Update delete button's target
  if (allWishes[carouselIndex]) {
    window._currentWishId = allWishes[carouselIndex][0];
  }
}

function startAutoSlide() {
  stopAutoSlide();
  if (allWishes.length <= 1) return;
  autoTimer = setInterval(() => {
    if (!isFrozen) goToSlide(carouselIndex + 1);
  }, 5000);
}

function stopAutoSlide() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
}

function setupCardInteraction() {
  const card = document.getElementById('wishCard');
  if (!card) return;

  let holdTimer = null;
  let touchStartX = 0;
  let touchStartTime = 0;
  let isDragging = false;

  // ── MOUSE: hold to freeze ──
  card.addEventListener('mousedown', () => {
    holdTimer = setTimeout(() => freeze(), 400);
  });
  card.addEventListener('mouseup', () => {
    clearTimeout(holdTimer);
    if (isFrozen) unfreeze();
  });
  card.addEventListener('mouseleave', () => {
    clearTimeout(holdTimer);
    if (isFrozen) unfreeze();
  });

  // ── TOUCH: hold to freeze + swipe to navigate ──
  card.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    isDragging = false;
    holdTimer = setTimeout(() => freeze(), 500);
  }, { passive: true });

  card.addEventListener('touchmove', (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    if (dx > 8) {
      isDragging = true;
      clearTimeout(holdTimer);
    }
  }, { passive: true });

  card.addEventListener('touchend', (e) => {
    clearTimeout(holdTimer);
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dt = Date.now() - touchStartTime;

    if (isFrozen) {
      // Unfreeze on release (unless user is actually swiping)
      if (!isDragging) {
        unfreeze();
        return;
      }
      unfreeze();
    }

    // Swipe navigation
    if (isDragging && Math.abs(dx) > 40 && dt < 500) {
      if (dx < 0) goToSlide(carouselIndex + 1);
      else goToSlide(carouselIndex - 1);
    }
  }, { passive: true });

  // Click dots = handled inline already
}

function freeze() {
  isFrozen = true;
  stopAutoSlide();
  const card = document.getElementById('wishCard');
  if (card) card.classList.add('frozen');
}

function unfreeze() {
  isFrozen = false;
  const card = document.getElementById('wishCard');
  if (card) card.classList.remove('frozen');
  startAutoSlide();
}

window.submitWish = function() {
  const nameInput = document.getElementById('guest-name');
  const messageInput = document.getElementById('guest-message');
  if (nameInput.value.trim() && messageInput.value.trim()) {
    push(wishesRef, {
      name: nameInput.value.trim(),
      message: messageInput.value.trim(),
      timestamp: Date.now()
    }).then(() => {
      nameInput.value = '';
      messageInput.value = '';
      alert("Wish sent! Thank you 🙏");
    });
  }
};

window.handleDelete = function() {
  const id = window._currentWishId;
  if (!id) return;
  const pass = prompt("Enter admin password:");
  if (pass === "1234") {
    remove(ref(db, `wishes/${id}`)).then(() => alert("Wish deleted."));
  } else {
    alert("Incorrect password.");
  }
};

/* ══════════════════════════════════
   5. LIGHTBOX (fixed)
══════════════════════════════════ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightboxClose');

  // Open on gallery image click
  document.querySelectorAll('.gallery-img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close on backdrop click (not on image)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Close button
  closeBtn.addEventListener('click', closeLightbox);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Also expose globally just in case
window.openLightbox = function(img) {
  const lightboxImg = document.getElementById('lightbox-img');
  const lightbox = document.getElementById('lightbox');
  lightboxImg.src = img.src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeLightbox = function() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
};

// Init lightbox immediately (not waiting for openInvitation)
initLightbox();

/* ══════════════════════════════════
   6. SCROLL ANIMATIONS
══════════════════════════════════ */
function initScrollAnim() {
  const els = document.querySelectorAll('#invitation .fade-in, #invitation .slide-left, #invitation .slide-right');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ══════════════════════════════════
   7. OPENING BUTTERFLIES
══════════════════════════════════ */
(function(){
  const c = document.getElementById('op-bf-canvas');
  const ctx = c.getContext('2d');
  let W, H, alive = true;
  function resize(){ W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  const PAL = [
    {body:'#4a1a2e',w1:'#e05580',w2:'#f8a0b8',spot:'rgba(255,240,250,0.7)',vein:'rgba(180,40,80,0.35)'},
    {body:'#3a2800',w1:'#d4a020',w2:'#f8d880',spot:'rgba(255,248,220,0.7)',vein:'rgba(160,100,10,0.3)'},
    {body:'#1a3820',w1:'#38a858',w2:'#88d898',spot:'rgba(240,255,240,0.7)',vein:'rgba(20,100,40,0.3)'},
    {body:'#28104e',w1:'#7848b8',w2:'#b888e0',spot:'rgba(245,240,255,0.7)',vein:'rgba(80,30,150,0.3)'},
    {body:'#3a1800',w1:'#e06018',w2:'#f8a858',spot:'rgba(255,248,235,0.7)',vein:'rgba(180,60,10,0.3)'},
  ];

  function mkBF(sc) {
    const p = PAL[Math.floor(Math.random()*PAL.length)];
    return { p, s:6+Math.random()*6, x:Math.random()*W, y:sc?Math.random()*H:H+70,
      vx:(Math.random()-.5)*.55, vy:-(0.27+Math.random()*.37),
      fT:Math.random()*Math.PI*2, fSpd:0.038+Math.random()*.022,
      swT:Math.random()*Math.PI*2, swSpd:0.006+Math.random()*.005,
      swA:0.6+Math.random()*1.1, tilt:Math.random()*Math.PI*2,
      op:0.65+Math.random()*.28, rot:(Math.random()-.5)*.16 };
  }
  function upd(b) {
    b.fT+=b.fSpd; b.swT+=b.swSpd; b.tilt+=0.01;
    b.x+=b.vx+Math.sin(b.swT)*b.swA; b.y+=b.vy+Math.sin(b.tilt)*.28;
    if(b.y<-b.s*4) Object.assign(b,mkBF(false));
    if(b.x<-120) b.x=W+120; if(b.x>W+120) b.x=-120;
  }
  function drw(b) {
    const f=(Math.cos(b.fT)+1)/2, s=b.s, p=b.p;
    ctx.save(); ctx.globalAlpha=b.op; ctx.translate(b.x,b.y); ctx.rotate(b.rot+Math.sin(b.tilt)*.07);
    [-1,1].forEach(side=>{
      ctx.save(); ctx.scale(side*f,1);
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.bezierCurveTo(s*.22,-s*.82,s*1.02,-s*1.02,s*1.12,-s*.36);
      ctx.bezierCurveTo(s*1.02,s*.14,s*.42,s*.26,0,s*.1); ctx.closePath();
      ctx.fillStyle=p.w1; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.bezierCurveTo(s*.18,-s*.62,s*.76,-s*.76,s*.83,-s*.3);
      ctx.bezierCurveTo(s*.73,s*.08,s*.33,s*.18,0,s*.06); ctx.closePath();
      ctx.fillStyle=p.w2; ctx.globalAlpha=0.58; ctx.fill(); ctx.globalAlpha=1;
      ctx.strokeStyle=p.vein; ctx.lineWidth=0.65;
      [[0,0,s*.32,-s*.52,s*.92,-s*.56],[0,0,s*.56,-s*.22,s*.96,-s*.16]].forEach(v=>{
        ctx.beginPath(); ctx.moveTo(v[0],v[1]); ctx.quadraticCurveTo(v[2],v[3],v[4],v[5]); ctx.stroke();
      });
      ctx.beginPath(); ctx.ellipse(s*.63,-s*.41,s*.12,s*.09,-.3,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(s*.63,-s*.41,s*.065,s*.052,-.3,0,Math.PI*2); ctx.fillStyle=p.spot; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.scale(side*f*.95,1);
      ctx.beginPath(); ctx.moveTo(0,s*.06);
      ctx.bezierCurveTo(s*.14,s*.2,s*.86,s*.72,s*.76,s*.96);
      ctx.bezierCurveTo(s*.56,s*1.16,s*.1,s*.72,0,s*.46); ctx.closePath();
      ctx.fillStyle=p.w1; ctx.fill();
      ctx.restore();
    });
    const bg=ctx.createLinearGradient(0,-s*.62,0,s*1.1);
    bg.addColorStop(0,p.w2); bg.addColorStop(1,p.body);
    ctx.beginPath(); ctx.ellipse(0,s*.19,s*.066,s*.72,0,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill();
    ctx.beginPath(); ctx.arc(0,-s*.53,s*.09,0,Math.PI*2); ctx.fillStyle=p.body; ctx.fill();
    ctx.save(); ctx.strokeStyle=p.body; ctx.lineWidth=0.88; ctx.lineCap='round';
    [-1,1].forEach(side=>{
      ctx.beginPath(); ctx.moveTo(side*s*.04,-s*.55);
      ctx.quadraticCurveTo(side*s*.28,-s*.9,side*s*.36*f,-s*1.08); ctx.stroke();
      ctx.beginPath(); ctx.arc(side*s*.36*f,-s*1.1,s*.06,0,Math.PI*2); ctx.fillStyle=p.body; ctx.fill();
    });
    ctx.restore(); ctx.restore();
  }

  const bfs = Array.from({length:12}, ()=>mkBF(true));
  (function loop(){
    if(!alive) return;
    ctx.clearRect(0,0,W,H);
    bfs.forEach(b=>{ upd(b); drw(b); });
    requestAnimationFrame(loop);
  })();
  window._killOpeningBF = ()=>{ alive=false; ctx.clearRect(0,0,W,H); };
})();

/* ══════════════════════════════════
   8. INVITATION FX (butterflies + birds + petals)
══════════════════════════════════ */
function initInvFX() {
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  const PAL=[
    {body:'#4a1a2e',w1:'#e05580',w2:'#f8a0b8',spot:'rgba(255,240,250,0.7)',vein:'rgba(180,40,80,0.35)'},
    {body:'#3a2800',w1:'#d4a020',w2:'#f8d880',spot:'rgba(255,248,220,0.7)',vein:'rgba(160,100,10,0.3)'},
    {body:'#1a3820',w1:'#38a858',w2:'#88d898',spot:'rgba(240,255,240,0.7)',vein:'rgba(20,100,40,0.3)'},
    {body:'#28104e',w1:'#7848b8',w2:'#b888e0',spot:'rgba(245,240,255,0.7)',vein:'rgba(80,30,150,0.3)'},
    {body:'#3a1800',w1:'#e06018',w2:'#f8a858',spot:'rgba(255,248,235,0.7)',vein:'rgba(180,60,10,0.3)'},
  ];
  const leafCols=['#e8c86a','#d4955a','#c96a3a','#e2b080','#f0d080','#c8e8a0','#f4d0b0'];

  function mkBF(sc){
    const p=PAL[Math.floor(Math.random()*PAL.length)];
    return{p,s:6+Math.random()*6,x:Math.random()*W,y:sc?Math.random()*H:H+60,
      vx:(Math.random()-.5)*.52,vy:-(0.25+Math.random()*.35),
      fT:Math.random()*Math.PI*2,fSpd:0.038+Math.random()*.022,
      swT:Math.random()*Math.PI*2,swSpd:0.006+Math.random()*.005,
      swA:0.65+Math.random()*1.05,tilt:Math.random()*Math.PI*2,
      op:0.6+Math.random()*.28,rot:(Math.random()-.5)*.14};
  }
  function updBF(b){
    b.fT+=b.fSpd;b.swT+=b.swSpd;b.tilt+=0.01;
    b.x+=b.vx+Math.sin(b.swT)*b.swA;b.y+=b.vy+Math.sin(b.tilt)*.27;
    if(b.y<-b.s*4)Object.assign(b,mkBF(false));
    if(b.x<-100)b.x=W+100;if(b.x>W+100)b.x=-100;
  }
  function drwBF(b){
    const f=(Math.cos(b.fT)+1)/2,s=b.s,p=b.p;
    ctx.save();ctx.globalAlpha=b.op;ctx.translate(b.x,b.y);ctx.rotate(b.rot+Math.sin(b.tilt)*.07);
    [-1,1].forEach(side=>{
      ctx.save();ctx.scale(side*f,1);
      ctx.beginPath();ctx.moveTo(0,0);
      ctx.bezierCurveTo(s*.22,-s*.82,s*1.02,-s*1.02,s*1.12,-s*.36);
      ctx.bezierCurveTo(s*1.02,s*.14,s*.42,s*.26,0,s*.1);ctx.closePath();
      ctx.fillStyle=p.w1;ctx.fill();
      ctx.beginPath();ctx.moveTo(0,0);
      ctx.bezierCurveTo(s*.18,-s*.62,s*.76,-s*.76,s*.83,-s*.3);
      ctx.bezierCurveTo(s*.73,s*.08,s*.33,s*.18,0,s*.06);ctx.closePath();
      ctx.fillStyle=p.w2;ctx.globalAlpha=0.55;ctx.fill();ctx.globalAlpha=1;
      ctx.strokeStyle=p.vein;ctx.lineWidth=0.62;
      [[0,0,s*.32,-s*.52,s*.92,-s*.56],[0,0,s*.56,-s*.22,s*.96,-s*.16]].forEach(v=>{
        ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.quadraticCurveTo(v[2],v[3],v[4],v[5]);ctx.stroke();
      });
      ctx.beginPath();ctx.ellipse(s*.63,-s*.41,s*.11,s*.088,-.3,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.26)';ctx.fill();
      ctx.beginPath();ctx.ellipse(s*.63,-s*.41,s*.062,s*.05,-.3,0,Math.PI*2);ctx.fillStyle=p.spot;ctx.fill();
      ctx.restore();
      ctx.save();ctx.scale(side*f*.94,1);
      ctx.beginPath();ctx.moveTo(0,s*.06);
      ctx.bezierCurveTo(s*.14,s*.2,s*.86,s*.72,s*.76,s*.96);
      ctx.bezierCurveTo(s*.56,s*1.16,s*.1,s*.72,0,s*.46);ctx.closePath();
      ctx.fillStyle=p.w1;ctx.fill();
      ctx.restore();
    });
    const bg=ctx.createLinearGradient(0,-s*.6,0,s*1.1);
    bg.addColorStop(0,p.w2);bg.addColorStop(1,p.body);
    ctx.beginPath();ctx.ellipse(0,s*.18,s*.065,s*.7,0,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
    ctx.beginPath();ctx.arc(0,-s*.5,s*.088,0,Math.PI*2);ctx.fillStyle=p.body;ctx.fill();
    ctx.save();ctx.strokeStyle=p.body;ctx.lineWidth=0.85;ctx.lineCap='round';
    [-1,1].forEach(side=>{
      ctx.beginPath();ctx.moveTo(side*s*.04,-s*.53);
      ctx.quadraticCurveTo(side*s*.28,-s*.88,side*s*.35*f,-s*1.06);ctx.stroke();
      ctx.beginPath();ctx.arc(side*s*.35*f,-s*1.08,s*.058,0,Math.PI*2);ctx.fillStyle=p.body;ctx.fill();
    });
    ctx.restore();ctx.restore();
  }

  function mkBird(sc){
    const dir=Math.random()<.5?1:-1;
    return{dir,x:sc?Math.random()*W:(dir===1?-60:W+60),
      y:30+Math.random()*(H*.38),size:5+Math.random()*6,
      spd:0.65+Math.random()*.85,
      fT:Math.random()*Math.PI*2,fSpd:0.055+Math.random()*.048,
      wT:Math.random()*Math.PI*2,op:0.28+Math.random()*.22};
  }
  function updBird(b){
    b.fT+=b.fSpd;b.wT+=0.008;b.x+=b.spd*b.dir;b.y+=Math.sin(b.wT)*.38;
    if(b.dir===1&&b.x>W+80)Object.assign(b,mkBird(false));
    if(b.dir===-1&&b.x<-80)Object.assign(b,mkBird(false));
  }
  function drwBird(b){
    const f=Math.sin(b.fT),s=b.size,d=f*s*.88;
    ctx.save();ctx.globalAlpha=b.op;ctx.translate(b.x,b.y);
    if(b.dir===-1)ctx.scale(-1,1);
    ctx.strokeStyle='#3a2010';ctx.lineWidth=s*.19;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-s*.78,d,-s*1.65,d*.28);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*.78,d,s*1.65,d*.28);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,s*.12,0,Math.PI*2);ctx.fillStyle='#3a2010';ctx.fill();
    ctx.restore();
  }

  function mkPetal(sc){
    return{x:Math.random()*W,y:sc?Math.random()*H:-20,size:4+Math.random()*7,
      col:leafCols[Math.floor(Math.random()*leafCols.length)],
      vy:0.3+Math.random()*.4,vx:(Math.random()-.5)*.38,
      rot:Math.random()*Math.PI*2,rotSpd:(Math.random()-.5)*.022,
      swT:Math.random()*Math.PI*2,swA:0.38+Math.random()*.72,op:0.36+Math.random()*.3};
  }
  function updPetal(p){p.swT+=0.016;p.rot+=p.rotSpd;p.x+=p.vx+Math.sin(p.swT)*p.swA;p.y+=p.vy;if(p.y>H+30)Object.assign(p,mkPetal(false));}
  function drwPetal(p){
    ctx.save();ctx.globalAlpha=p.op;ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    const s=p.size;
    ctx.beginPath();ctx.moveTo(0,-s);
    ctx.bezierCurveTo(s*.78,-s*.4,s*.78,s*.5,0,s*.58);
    ctx.bezierCurveTo(-s*.78,s*.5,-s*.78,-s*.4,0,-s);
    ctx.fillStyle=p.col;ctx.fill();
    ctx.restore();
  }

  const bfs=Array.from({length:10},()=>mkBF(true));
  const birds=Array.from({length:5},()=>mkBird(true));
  const petals=Array.from({length:20},()=>mkPetal(true));
  (function loop(){
    ctx.clearRect(0,0,W,H);
    petals.forEach(p=>{updPetal(p);drwPetal(p);});
    bfs.forEach(b=>{updBF(b);drwBF(b);});
    birds.forEach(b=>{updBird(b);drwBird(b);});
    requestAnimationFrame(loop);
  })();
}

document.body.style.overflow = 'hidden';