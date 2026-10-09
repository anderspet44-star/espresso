/* ===== НАЛАШТУВАННЯ — замініть на свої дані ===== */
const CONFIG={
  phone:"+380950936797",            // телефон у міжнародному форматі
  phoneLabel:"095 093 67 97",       // як показувати на сайті
  address:"м. Івано-Франківськ, вул. Довга, 6",
  formEndpoint:"",                  // напр. https://formspree.io/f/xxxx — заявки приходитимуть на пошту автоматично
  telegram:"",                      // нік у Telegram без @ (необов'язково)
  menuImages:[],                    // фото меню, напр. ["menu/1.jpg","menu/2.jpg"]
  // ТІЛЬКИ РЕАЛЬНІ ДАНІ. Поки порожньо — блок показує лише перевірені факти.
  rating:null,                      // напр. {score:"4.8",count:"120",source:"Google"}
  reviews:[]                        // напр. [{text:"Справжній відгук",name:"Ім'я",source:"Google"}]
};
/* ================================================= */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
$$('[data-tel]').forEach(a=>a.href='tel:'+CONFIG.phone);
$$('[data-ph]').forEach(a=>a.textContent=CONFIG.phoneLabel);
$$('[data-addr]').forEach(a=>a.textContent=CONFIG.address);
$('#yr').textContent=new Date().getFullYear();

// header, progress, mobile menu
const hd=$('#hd'),pg=$('#pg'),bg=$('#bg');
function onScroll(){
  hd.classList.toggle('sc',scrollY>30);
  const h=document.documentElement.scrollHeight-innerHeight;
  pg.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
}
addEventListener('scroll',onScroll,{passive:true});onScroll();
function toggleMenu(open){
  document.body.classList.toggle('mo',open);
  bg.setAttribute('aria-expanded',open);bg.setAttribute('aria-label',open?'Закрити меню':'Відкрити меню');
  document.body.style.overflow=open?'hidden':'';
}
bg.onclick=()=>toggleMenu(!document.body.classList.contains('mo'));
addEventListener('keydown',e=>{if(e.key==='Escape')toggleMenu(false)});
addEventListener('resize',()=>{if(innerWidth>=960)toggleMenu(false)});
$$('#mob a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));

// open / closed (Kyiv time)
function status(){
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  const g=t=>p.find(x=>x.type===t).value;
  const wk=['Sat','Sun'].includes(g('weekday')),m=(+g('hour')%24)*60+ +g('minute'),o=(wk?10:8)*60,on=m>=o&&m<23*60;
  $('#status').classList.toggle('on',on);
  $('#stxt').textContent=on?'Зараз відчинено · до 23:00':'Зараз зачинено · відчиняємось '+(m<o?(wk?'о 10:00':'о 8:00'):'завтра');
}
status();setInterval(status,60000);

// menu dialog
const dlg=$('#dlg');
$$('[data-menu]').forEach(b=>b.addEventListener('click',e=>{
  e.preventDefault();
  const t=b.querySelector('.t');
  $('#dtitle').textContent=t?t.firstChild.textContent.trim():'Меню Espresso';
  $('#dbody').innerHTML=CONFIG.menuImages.length
    ?CONFIG.menuImages.map(s=>`<img src="${s}" alt="Меню Espresso" loading="lazy">`).join('')
    :`<p>Актуальне меню та ціни уточнюйте за телефоном.</p><a class="btn btn-p" href="tel:${CONFIG.phone}">Зателефонувати</a>`;
  dlg.showModal();
}));
$('#dx').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()});

// booking form: endpoint (if set) -> otherwise ready message via SMS/Telegram/copy
const f=$('#book'),pad=n=>String(n).padStart(2,'0'),now=new Date();
f.elements.d.min=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
function checkTime(){
  const v=f.elements,d=new Date(v.d.value+'T'+(v.t.value||'00:00'));let m='';
  if(v.d.value&&v.t.value){
    const wk=[0,6].includes(d.getDay()),h=d.getHours()+d.getMinutes()/60;
    if(h<(wk?10:8)||h>22)m=wk?'У вихідні працюємо з 10:00 до 23:00 — оберіть час від 10:00 до 22:00':'Оберіть час від 8:00 до 22:00';
    else if(d<new Date())m='Оберіть час у майбутньому';
  }
  v.t.setCustomValidity(m);
}
['d','t'].forEach(n=>f.elements[n].addEventListener('input',checkTime));
f.addEventListener('submit',async e=>{
  e.preventDefault();checkTime();
  if(!f.reportValidity())return;
  const v=f.elements,txt=`Бронювання столу Espresso\nІм'я: ${v.n.value}\nТелефон: ${v.p.value}\nДата: ${v.d.value}, ${v.t.value}\nГостей: ${v.g.value}`;
  const done=(sent)=>{
    $('#okh').textContent=sent?'Заявку надіслано':'Заявку підготовлено';
    $('#okp').textContent=sent?'Дякуємо! Ми зв’яжемося з вами для підтвердження.':'Надішліть її нам — так ми швидше підтвердимо стіл.';
    $('#okt').textContent=txt;
    $('#oksms').href=`sms:${CONFIG.phone}?&body=${encodeURIComponent(txt)}`;$('#oksms').hidden=sent;
    $('#okcp').hidden=sent;$('#okt').hidden=sent;
    const tg=$('#oktg');tg.hidden=sent||!CONFIG.telegram;if(CONFIG.telegram)tg.href=`https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(txt)}`;
    f.classList.add('sent');f.scrollIntoView({behavior:'smooth',block:'center'});
  };
  if(CONFIG.formEndpoint){
    try{const r=await fetch(CONFIG.formEndpoint,{method:'POST',headers:{Accept:'application/json'},body:new FormData(f)});if(r.ok){f.reset();return done(true)}}catch(_){}
  }
  done(false);
});
$('#okcp').onclick=async()=>{try{await navigator.clipboard.writeText($('#okt').textContent);$('#okcp').textContent='Скопійовано ✓'}catch(_){}};

// map link + trust block: only real data from CONFIG
$$('[data-map]').forEach(a=>a.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(CONFIG.address));
(function(){
  const box=$('#proof'),r=CONFIG.reviews||[],rt=CONFIG.rating;
  if(!r.length&&!rt)return;
  box.textContent='';
  if(rt){const d=document.createElement('div');d.className='rate';const b=document.createElement('b'),s=document.createElement('span');b.textContent=rt.score+' ★';s.textContent=rt.count+' відгуків · '+rt.source;d.append(b,s);box.append(d)}
  r.slice(0,2).forEach(x=>{const q=document.createElement('blockquote'),c=document.createElement('cite');q.textContent='«'+x.text+'»';c.textContent=x.name+(x.source?' · '+x.source:'');box.append(q,c)});
})();

// reveal on scroll + card spotlight
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12,rootMargin:'0px 0px -40px'});
$$('.rvl,.st').forEach(el=>io.observe(el));
$$('.spot').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--x',e.clientX-r.left+'px');c.style.setProperty('--y',e.clientY-r.top+'px')}));

// hide sticky bar while the booking form is on screen
const vis=new Set();
const bo=new IntersectionObserver(es=>{es.forEach(x=>x.isIntersecting?vis.add(x.target):vis.delete(x.target));$('#bar').classList.toggle('hide',vis.size>0)});
bo.observe(f);bo.observe($('.hero .cta'));
