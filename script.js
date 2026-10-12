(function(){
  const STORE_KEY='idcard_accounts_v2';
  const SESSION_KEY='idcard_session_v2';
  const $=id=>document.getElementById(id);

  function hash(str){ let h=0; for(let i=0;i<str.length;i++){ h=(Math.imul(31,h)+str.charCodeAt(i))|0; } return 'h'+h; }
  function loadAccounts(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY))||{}; }catch(e){ return {}; } }
  function saveAccounts(a){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(a)); }catch(e){} }
  function pwChecks(p){ return { len:p.length>=8, upper:/[A-Z]/.test(p), num:/[0-9]/.test(p), special:/[^A-Za-z0-9]/.test(p) }; }
  function pwValid(p){ const c=pwChecks(p); return c.len&&c.upper&&c.num&&c.special; }
  // Only a genuine college address can sign up. Adjust this pattern to your institution's real domain.
  const COLLEGE_NAME='Raghu Engineering College';   // <- shown on the login screen & browser tab
  const COLLEGE_DOMAIN='raghuenggcollege.in';       // sign-up restricted to this email domain
  const domTxt=COLLEGE_DOMAIN?('@'+COLLEGE_DOMAIN+' address'):'college email address';
  document.title=COLLEGE_NAME+' — ID Card Generator';
  (function(){ const b=document.getElementById('brandName'); if(b) b.textContent=COLLEGE_NAME; const s=document.getElementById('navCollege'); if(s) s.textContent=COLLEGE_NAME; })();
  function validCollegeEmail(e){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
    return COLLEGE_DOMAIN? e.toLowerCase().endsWith('@'+COLLEGE_DOMAIN) : true;
  }

  // ---------- auth screen ----------
  const authScreen=$('authScreen'), appScreen=$('appScreen');
  const tabLogin=$('tabLogin'), tabSignup=$('tabSignup');
  const authTitle=$('authTitle'), authSub=$('authSub');
  const authEmail=$('authEmail'), authPass=$('authPass'), authError=$('authError'), authSubmit=$('authSubmit');
  const pwReqs=$('pwReqs'), reqLen=$('reqLen'), reqUpper=$('reqUpper'), reqNum=$('reqNum'), reqSpecial=$('reqSpecial');
  const whoami=$('whoami'), logoutBtn=$('logoutBtn'), existingNotice=$('existingNotice');
  let mode='login';

  function setMode(m){
    mode=m; authError.textContent=''; authPass.value='';
    if(m==='login'){
      tabLogin.classList.add('active'); tabSignup.classList.remove('active');
      authTitle.textContent='Welcome back'; authSub.textContent='Log in with your college email and password.';
      authSubmit.textContent='Log in'; pwReqs.classList.add('hidden');
      authPass.setAttribute('autocomplete','current-password');
    }else{
      tabSignup.classList.add('active'); tabLogin.classList.remove('active');
      authTitle.textContent='Create an account'; authSub.textContent='Sign up with your '+domTxt+' — one account per email.';
      authSubmit.textContent='Sign up'; pwReqs.classList.remove('hidden'); updatePwReqs('');
      authPass.setAttribute('autocomplete','new-password');
    }
  }
  function updatePwReqs(p){
    const c=pwChecks(p);
    reqLen.classList.toggle('ok',c.len); reqUpper.classList.toggle('ok',c.upper);
    reqNum.classList.toggle('ok',c.num); reqSpecial.classList.toggle('ok',c.special);
  }
  authPass.addEventListener('input',()=>{ if(mode==='signup') updatePwReqs(authPass.value); });
  tabLogin.addEventListener('click',()=>setMode('login'));
  tabSignup.addEventListener('click',()=>setMode('signup'));

  function showApp(email){
    authScreen.classList.add('hidden'); appScreen.classList.remove('hidden');
    whoami.textContent=email;
    const av=$('avatarInitial'); if(av) av.textContent=(email[0]||'?').toUpperCase();
    try{ sessionStorage.setItem(SESSION_KEY, email); }catch(e){}
    loadCardFor(email);
  }

  authSubmit.addEventListener('click', ()=>{
    const email=(authEmail.value||'').trim().toLowerCase();
    const p=authPass.value||'';
    authError.textContent='';
    const accounts=loadAccounts();
    if(mode==='signup'){
      if(!validCollegeEmail(email)){ authError.textContent='Sign up requires a valid '+domTxt+'.'; return; }
      if(accounts[email]){ authError.textContent='This college email already has an account — please log in instead.'; return; }
      if(!pwValid(p)){ authError.textContent='Password does not meet the requirements above.'; return; }
      accounts[email]={ pass:hash(p), card:null };
      saveAccounts(accounts);
      showApp(email);
    }else{
      if(!validCollegeEmail(email)){ authError.textContent='Enter a valid '+domTxt+'.'; return; }
      const acc=accounts[email];
      if(!acc){ authError.textContent='No account for this email yet — sign up first.'; return; }
      if(acc.pass!==hash(p)){ authError.textContent='Incorrect password.'; return; }
      showApp(email);
    }
  });
  authPass.addEventListener('keydown', e=>{ if(e.key==='Enter') authSubmit.click(); });

  logoutBtn.addEventListener('click', ()=>{
    try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){}
    appScreen.classList.add('hidden'); authScreen.classList.remove('hidden');
    setMode('login'); authEmail.value=''; authPass.value=''; existingNotice.classList.add('hidden');
  });

  // ---------- card form <-> preview ----------
  const fieldIds=['inst','instSub','instWeb','name','course','regno','blood','contact','collno','address'];
  let currentPhotoData=null;
  let currentLogoData=null;

  function sync(){
    $('pInst').textContent=$('inst').value||'Institution Name';
    $('pInstSub').textContent=$('instSub').value||'';
    $('pInstWeb').textContent=$('instWeb').value||'';
    if(currentLogoData){ $('crest').innerHTML='<img src="'+currentLogoData+'" alt="logo">'; }
    else { $('crest').textContent=($('inst').value||'IN').trim().split(/\s+/).map(w=>w[0]).slice(0,3).join('').toUpperCase(); }
    $('pName').textContent=($('name').value||'Full Name').toUpperCase();
    $('pCourse').textContent=$('course').value||'';
    $('pReg').textContent=': '+($('regno').value||'—');
    $('pBlood').textContent=$('blood').value||'—';
    $('pContact').textContent=': '+($('contact').value||'—');
    $('pCollNo').textContent=': '+($('collno').value||'—');
    $('pAddr').textContent=$('address').value||'';
    drawCodes(); updateProgress();
  }
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function rng(seed){ return function(){ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
  function drawCodes(){
    const key=(($('regno').value||'')+'|'+($('name').value||'')).trim()||'RAGHU';
    const r=rng(hash(key));
    let x=0, bars='';
    while(x<86){ const w=1+Math.floor(r()*3), gap=1+Math.floor(r()*2); bars+='<rect x="'+x+'" y="0" width="'+w+'" height="16" fill="#222"/>'; x+=w+gap; }
    $('barcode').innerHTML='<svg width="86" height="16" viewBox="0 0 86 16">'+bars+'</svg>';
    const N=11, q=rng(hash(key+'qr')); let cells='';
    const inFinder=(i,j)=>(i<3&&j<3)||(i<3&&j>N-4)||(i>N-4&&j<3);
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      if(inFinder(i,j)){ const a=(i<3?i:i-(N-3)), b=(j<3?j:j-(N-3)); if(!(a===1&&b===1)) cells+='<rect x="'+j+'" y="'+i+'" width="1" height="1"/>'; }
      else if(q()>.5) cells+='<rect x="'+j+'" y="'+i+'" width="1" height="1"/>';
    }
    $('qr').innerHTML='<svg width="34" height="34" viewBox="0 0 11 11" fill="#1a1a1a" shape-rendering="crispEdges">'+cells+'</svg>';
  }
  function updateProgress(){
    const checks=[$('name').value.trim(),$('regno').value.trim(),$('course').value.trim(),$('contact').value.replace(/X/gi,'').trim(),$('collno').value.trim(),$('address').value.trim(),currentPhotoData];
    const done=checks.filter(Boolean).length, pct=Math.round(done/checks.length*100);
    $('mPct').textContent=pct+'%'; $('mRing').style.strokeDashoffset=(213.6*(1-pct/100)).toFixed(1);
  }
  let toastT;
  function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }
  fieldIds.forEach(id=>{ $(id).addEventListener('input',sync); $(id).addEventListener('change',sync); });
  sync();

  $('dropZone').addEventListener('click',()=>$('photoInput').click());
  $('photoInput').addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      currentPhotoData=ev.target.result;
      $('photoBox').innerHTML='<img src="'+currentPhotoData+'" alt="photo">';
      $('dropZone').textContent='Photo added — tap to change'; updateProgress();
    };
    reader.readAsDataURL(f);
  });

  $('logoDrop').addEventListener('click',()=>$('logoInput').click());
  $('logoInput').addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=ev=>{ currentLogoData=ev.target.result; $('logoDrop').textContent='Logo added — tap to change'; sync(); };
    reader.readAsDataURL(f);
  });
  function collectCard(){
    const d={photo:currentPhotoData, logo:currentLogoData};
    fieldIds.forEach(id=>{ d[id]=$(id).value; });
    return d;
  }
  function applyCard(d){
    if(!d) return;
    fieldIds.forEach(id=>{ if(d[id]!==undefined) $(id).value=d[id]; });
    currentPhotoData=d.photo||null;
    currentLogoData=d.logo||null; $('logoDrop').textContent=currentLogoData?'Logo added — tap to change':'Upload college logo';
    if(currentPhotoData){ $('photoBox').innerHTML='<img src="'+currentPhotoData+'" alt="photo">'; $('dropZone').textContent='Photo added — tap to change'; }
    else { $('photoBox').innerHTML='Photo'; $('dropZone').textContent='Tap to upload a photo'; }
    sync();
  }
  function loadCardFor(email){
    const accounts=loadAccounts();
    const acc=accounts[email];
    if(acc && acc.card){ applyCard(acc.card); existingNotice.classList.remove('hidden'); }
    else{ existingNotice.classList.add('hidden'); }
  }
  $('saveBtn').addEventListener('click', ()=>{
    let email; try{ email=sessionStorage.getItem(SESSION_KEY); }catch(e){}
    if(!email) return;
    const accounts=loadAccounts();
    if(!accounts[email]) return;
    accounts[email].card=collectCard();
    saveAccounts(accounts);
    existingNotice.classList.remove('hidden');
    toast('Card saved to your account.');
  });

  $('downloadBtn').addEventListener('click', async()=>{
    try{
      const st=document.querySelector('.stage'); const tt=st.style.transform; st.style.transform='none';
      const canvas=await html2canvas(document.getElementById('card'),{scale:4,backgroundColor:'#ffffff'});
      const link=document.createElement('a');
      link.download=(($('name').value||'id-card').replace(/\s+/g,'_'))+'_idcard.png';
      link.href=canvas.toDataURL('image/png');
      link.click(); st.style.transform=tt; toast('Download started.');
    }catch(err){ toast('Could not generate the image. Please try again.'); }
  });
  $('printBtn').addEventListener('click', ()=>window.print());

  (function(){
    const canvasEl=document.querySelector('.canvas'), st=document.querySelector('.stage');
    canvasEl.addEventListener('mousemove',e=>{ const r=canvasEl.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; st.style.transform='perspective(900px) rotateY('+(x*10).toFixed(1)+'deg) rotateX('+(-y*8).toFixed(1)+'deg)'; });
    canvasEl.addEventListener('mouseleave',()=>{ st.style.transform=''; });
    const pw=$('authPass'), tg=$('pwToggle');
    tg.addEventListener('click',()=>{ const show=pw.type==='password'; pw.type=show?'text':'password'; tg.textContent=show?'Hide':'Show'; });
  })();
  try{
    const existing=sessionStorage.getItem(SESSION_KEY);
    if(existing){ showApp(existing); }
  }catch(e){}
})();
