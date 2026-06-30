(function(){
  var so=document.getElementById('so'); if(!so||!window.fetch) return;
  var root=so.getAttribute('data-root')||'';
  var input=document.getElementById('so-input'), list=document.getElementById('so-list'),
      empty=document.getElementById('so-empty'), cnt=document.getElementById('so-cnt'),
      openBtn=document.getElementById('so-open');
  var DATA=null, loaded=false, items=[], sel=-1;
  var ORDER=['纪要','嘉宾','实体'], TK={'纪要':'talk','嘉宾':'person','实体':'ent'};
  function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function load(cb){ if(loaded){cb();return;}
    fetch(root+'search-index.json').then(function(r){return r.json();}).then(function(j){DATA=j;loaded=true;if(cnt)cnt.textContent=j.length;cb();}).catch(function(){loaded=true;cb();}); }
  function openSO(){ so.hidden=false; document.body.classList.add('so-open');
    load(function(){ run(input.value); }); setTimeout(function(){input.focus(); input.select();},20); }
  function closeSO(){ so.hidden=true; document.body.classList.remove('so-open'); }
  function run(q){
    q=(q||'').toLowerCase().trim(); sel=-1;
    if(!DATA||!q){ list.innerHTML=''; empty.hidden=true; items=[]; return; }
    var toks=q.split(/\s+/), scored=[];
    for(var i=0;i<DATA.length;i++){ var it=DATA[i], ok=true, sc=0;
      for(var t=0;t<toks.length;t++){ var p=it.k.indexOf(toks[t]); if(p<0){ok=false;break;} sc+=(p===0?3:1); }
      if(ok){ if(it.n.toLowerCase().indexOf(toks[0])===0) sc+=4; scored.push([sc,i,it]); }
    }
    scored.sort(function(a,b){return b[0]-a[0]||a[1]-b[1];});
    var top=scored.slice(0,40).map(function(x){return x[2];});
    var byG={}; top.forEach(function(it){(byG[it.t]=byG[it.t]||[]).push(it);});
    var html=''; items=[];
    ORDER.forEach(function(g){ if(!byG[g])return;
      html+='<div class="so-g">'+g+' · '+byG[g].length+'</div>';
      byG[g].forEach(function(it){ var i=items.length; items.push(it);
        html+='<a class="so-item" data-i="'+i+'" href="'+root+it.u+'"><span class="so-tag so-tag-'+TK[g]+'">'+g+'</span><span class="so-n">'+esc(it.n)+'</span><span class="so-s">'+esc(it.s)+'</span></a>';
      });
    });
    list.innerHTML=html; empty.hidden = items.length>0;
    if(items.length){ sel=0; mark(); }
  }
  function els(){ return list.querySelectorAll('.so-item'); }
  function mark(){ var e=els(); for(var i=0;i<e.length;i++) e[i].classList.toggle('on',i===sel);
    if(sel>=0&&e[sel]) e[sel].scrollIntoView({block:'nearest'}); }
  function move(d){ var e=els(); if(!e.length)return; sel=(sel+d+e.length)%e.length; mark(); }
  function go(){ var e=els(); if(sel>=0&&e[sel]) location.href=e[sel].getAttribute('href'); }
  input.addEventListener('input',function(){ run(input.value); });
  so.addEventListener('mousedown',function(e){ if(e.target===so) closeSO(); });
  list.addEventListener('mousemove',function(e){ var a=e.target.closest('.so-item'); if(a){ sel=+a.getAttribute('data-i'); mark(); } });
  if(openBtn) openBtn.addEventListener('click',openSO);
  document.addEventListener('keydown',function(e){
    var typing=/^(input|textarea|select)$/i.test((e.target.tagName||''));
    if(so.hidden){ if((e.key==='/'||((e.metaKey||e.ctrlKey)&&e.key==='k')) && !typing){ e.preventDefault(); openSO(); } return; }
    if(e.key==='Escape'){ e.preventDefault(); closeSO(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); move(1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); move(-1); }
    else if(e.key==='Enter'){ e.preventDefault(); go(); }
  });
})();