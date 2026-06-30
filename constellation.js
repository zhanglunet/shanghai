(function(){
  var host=document.getElementById('kg'), dataEl=document.getElementById('kg-data');
  if(!host||!dataEl||!document.createElementNS) return;
  var data; try{ data=JSON.parse(dataEl.textContent); }catch(e){ return; }
  var NS='http://www.w3.org/2000/svg', W=1120, H=720, CX=W/2, CY=H/2;
  var nodes=data.nodes.map(function(n){return Object.assign({hidden:false,fx:null,fy:null},n);});
  var byId={}; nodes.forEach(function(n){byId[n.id]=n;});
  var edges=data.edges.filter(function(e){return byId[e.s]&&byId[e.t];});

  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('class','kg-svg');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  host.appendChild(svg);
  var gEdges=document.createElementNS(NS,'g'), gNodes=document.createElementNS(NS,'g');
  svg.appendChild(gEdges); svg.appendChild(gNodes);
  var pt=svg.createSVGPoint();
  function toSVG(ev){ pt.x=ev.clientX; pt.y=ev.clientY; var m=svg.getScreenCTM(); if(!m) return null; return pt.matrixTransform(m.inverse()); }

  var seed=20260627; function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
  nodes.forEach(function(n,i){
    var a=2*Math.PI*i/nodes.length+rnd()*0.6, rad=150+rnd()*220;
    n.x=CX+Math.cos(a)*rad; n.y=CY+Math.sin(a)*rad*0.6; n.vx=0; n.vy=0; n.deg=0; n.big=n.f>=4;
  });
  var adj={}; nodes.forEach(function(n){adj[n.id]={};});
  edges.forEach(function(e){byId[e.s].deg++; byId[e.t].deg++; adj[e.s][e.t]=1; adj[e.t][e.s]=1;});

  var TYPE_LABEL={person:'人物',org:'机构',concept:'概念',event:'事件'};
  edges.forEach(function(e){
    var ln=document.createElementNS(NS,'line'); ln.setAttribute('class','kg-edge');
    ln.setAttribute('stroke-width',Math.max(0.5,Math.min(2.4,e.w*0.4)).toFixed(2));
    ln.setAttribute('stroke-opacity',Math.max(0.07,Math.min(0.3,0.06+e.w*0.035)).toFixed(3));
    e.el=ln; gEdges.appendChild(ln);
  });
  nodes.forEach(function(n){
    var g=document.createElementNS(NS,'a');
    g.setAttributeNS('http://www.w3.org/1999/xlink','href',n.url); g.setAttribute('href',n.url);
    g.setAttribute('class','kg-node kg-t-'+n.type+(n.big?' lab':''));
    var c=document.createElementNS(NS,'circle'); c.setAttribute('r',n.r); c.setAttribute('fill',n.color);
    var t=document.createElementNS(NS,'text'); t.setAttribute('class','kg-label');
    t.setAttribute('text-anchor','middle'); t.setAttribute('font-size',n.r>=18?13:(n.r>=13?12:11));
    t.textContent=n.name;
    var ti=document.createElementNS(NS,'title'); ti.textContent=n.name+' · '+(TYPE_LABEL[n.type]||'')+' · 出现于 '+n.f+' 场';
    g.appendChild(ti); g.appendChild(c); g.appendChild(t);
    n.c=c; n.t=t; n.g=g; gNodes.appendChild(g);
    bindNode(n,g);
  });

  function setLab(n,on){ n.g.classList.toggle('lab', !!on || (n.big && on!==false)); }
  // hover highlight ---------------------------------------------------------
  var searchOn=false, selId=null;
  function focus(id){
    if(drag.node) return;
    if(!id){ svg.classList.remove('kg-on');
      nodes.forEach(function(n){ n.g.classList.remove('hi','lo'); n.g.classList.toggle('lab',n.big); });
      edges.forEach(function(e){ e.el.classList.remove('hi','lo'); }); return; }
    svg.classList.add('kg-on');
    nodes.forEach(function(n){ var near=(n.id===id)||adj[id][n.id];
      n.g.classList.toggle('hi', !!near && !n.hidden);
      n.g.classList.toggle('lo', !near || n.hidden);
      n.g.classList.toggle('lab', (near && !n.hidden) || n.big); });
    edges.forEach(function(e){ var on=(e.s===id||e.t===id);
      e.el.classList.toggle('hi',on); e.el.classList.toggle('lo',!on); });
  }
  // search ------------------------------------------------------------------
  function runSearch(q){
    q=(q||'').trim().toLowerCase(); searchOn=!!q;
    svg.classList.toggle('kg-searching', searchOn);
    if(!searchOn){ nodes.forEach(function(n){ n.g.classList.remove('match','nomatch'); n.g.classList.toggle('lab',n.big); }); return; }
    nodes.forEach(function(n){ var m=!n.hidden && n.name.toLowerCase().indexOf(q)>=0;
      n.g.classList.toggle('match',m); n.g.classList.toggle('nomatch',!m); n.g.classList.toggle('lab', m||n.big); });
    reheat(0.12);
  }
  // type filter -------------------------------------------------------------
  var off={};
  function applyVis(){
    nodes.forEach(function(n){ n.hidden=!!off[n.type]; n.g.style.display=n.hidden?'none':''; });
    edges.forEach(function(e){ e.el.style.display=(byId[e.s].hidden||byId[e.t].hidden)?'none':''; });
    reheat(0.3);
  }
  // detail panel (drill-down) -----------------------------------------------
  var TLBL={person:'人物',org:'机构',concept:'概念',event:'事件'};
  var panel, pBody;
  function esc2(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function buildPanel(){
    panel=document.createElement('div'); panel.className='kg-panel';
    panel.innerHTML='<button class="kg-px" type="button" aria-label="关闭">&times;</button><div class="kg-pbody"></div>';
    host.appendChild(panel); pBody=panel.querySelector('.kg-pbody');
    panel.querySelector('.kg-px').addEventListener('click',closePanel);
    pBody.addEventListener('click',function(ev){
      var b=ev.target.closest('[data-go]'); if(b){ ev.preventDefault(); openPanel(b.getAttribute('data-go')); }
    });
  }
  function openPanel(id){
    var n=byId[id]; if(!n||n.hidden) return;
    if(!panel) buildPanel();
    if(selId && byId[selId] && selId!==id){ byId[selId].fx=null; byId[selId].fy=null; }
    selId=id; n.fx=n.x; n.fy=n.y; focus(id);
    var sess=(n.sessions||[]).map(function(s){
      return '<a class="kg-psess" href="talks/'+s[0]+'.html"><span class="kg-pt">'+esc2(s[2])+'</span>'+esc2(s[1])+'</a>';}).join('');
    var rel=(n.rel||[]).map(function(r){var o=byId[r[0]];
      return o?'<button class="kg-prchip kg-t-'+o.type+'" type="button" data-go="'+esc2(o.id)+'"><i></i>'+esc2(o.name)+'<b>'+r[1]+'</b></button>':'';}).join('');
    pBody.innerHTML=
      '<div class="kg-phead"><div class="kg-ptype"><span class="kg-pdot" style="background:'+n.color+'"></span>'+esc2(TLBL[n.type]||'')+' · 出现于 '+n.f+' 场</div>'+
      '<h3>'+esc2(n.name)+'</h3></div>'+
      (n.desc?'<p class="kg-pdesc">'+esc2(n.desc)+'</p>':'')+
      ((n.sessions&&n.sessions.length)?'<div class="kg-psec">出现于 · '+n.sessions.length+' 场</div><div class="kg-psesslist">'+sess+'</div>':'')+
      (rel?'<div class="kg-psec">关联实体</div><div class="kg-prel">'+rel+'</div>':'')+
      '<a class="kg-pmore" href="'+esc2(n.url)+'">查看完整词条 →</a>';
    panel.scrollTop=0; panel.classList.add('on'); svg.classList.add('kg-haspanel'); reheat(0.2);
  }
  function closePanel(){
    if(!panel||!panel.classList.contains('on')) return;
    panel.classList.remove('on'); svg.classList.remove('kg-haspanel');
    if(selId && byId[selId]){ byId[selId].fx=null; byId[selId].fy=null; }
    selId=null; focus(null); reheat(0.2);
  }

  // drag --------------------------------------------------------------------
  var drag={node:null,moved:false,sx:0,sy:0};
  function bindNode(n,g){
    g.addEventListener('pointerdown',function(ev){
      if(ev.button!=null && ev.button!==0) return;
      drag.node=n; drag.moved=false; drag.sx=ev.clientX; drag.sy=ev.clientY;
      n.fx=n.x; n.fy=n.y; svg.classList.add('kg-drag');
      try{ g.setPointerCapture(ev.pointerId); }catch(_){}
      reheat(0.35);
    });
    g.addEventListener('pointermove',function(ev){
      if(drag.node!==n) return;
      if(Math.abs(ev.clientX-drag.sx)+Math.abs(ev.clientY-drag.sy)>3) drag.moved=true;
      var p=toSVG(ev); if(!p) return;
      n.fx=p.x; n.fy=p.y; n.x=p.x; n.y=p.y; reheat(0.35);
    });
    function end(){ if(drag.node===n){ drag.node=null; if(n.id!==selId){ n.fx=null; n.fy=null; } svg.classList.remove('kg-drag'); reheat(0.25); } }
    g.addEventListener('pointerup',end); g.addEventListener('pointercancel',end);
    g.addEventListener('click',function(ev){
      if(drag.moved){ ev.preventDefault(); drag.moved=false; return; }
      if(ev.metaKey||ev.ctrlKey||ev.shiftKey) return;   // allow open wiki in new tab
      ev.preventDefault(); openPanel(n.id);
    });
    g.addEventListener('mouseenter',function(){ if(!searchOn && !selId) focus(n.id); });
    g.addEventListener('mouseleave',function(){ if(!searchOn && !selId) focus(null); });
  }
  // simulation --------------------------------------------------------------
  function tick(a){
    var i,j,n,b,dx,dy,d,d2,mind,rep,fx,fy;
    for(i=0;i<nodes.length;i++){ n=nodes[i]; if(n.hidden) continue;
      for(j=i+1;j<nodes.length;j++){ b=nodes[j]; if(b.hidden) continue;
        dx=n.x-b.x; dy=n.y-b.y; d2=dx*dx+dy*dy||0.01; d=Math.sqrt(d2);
        mind=n.r+b.r+19; rep=2900/d2; if(d<mind) rep+=(mind-d)*1.0/d;
        fx=dx/d*rep; fy=dy/d*rep; n.vx+=fx; n.vy+=fy; b.vx-=fx; b.vy-=fy; } }
    edges.forEach(function(e){ var p=byId[e.s], q=byId[e.t]; if(p.hidden||q.hidden) return;
      dx=q.x-p.x; dy=q.y-p.y; d=Math.sqrt(dx*dx+dy*dy)||0.01;
      var rest=p.r+q.r+78-Math.min(8,e.w*0.6); var f=(d-rest)*0.012*(0.5+e.w*0.05);
      fx=dx/d*f; fy=dy/d*f; p.vx+=fx; p.vy+=fy; q.vx-=fx; q.vy-=fy; });
    nodes.forEach(function(n){ if(n.hidden) return;
      if(n.fx!=null){ n.x=n.fx; n.y=n.fy; n.vx=0; n.vy=0; return; }
      n.vx+=(CX-n.x)*0.0009*(1+n.deg*0.022); n.vy+=(CY-n.y)*0.0016*(1+n.deg*0.022);
      n.x+=n.vx*a; n.y+=n.vy*a; n.vx*=0.85; n.vy*=0.85;
      n.x=Math.max(n.r+8,Math.min(W-n.r-8,n.x)); n.y=Math.max(n.r+22,Math.min(H-n.r-22,n.y)); });
  }
  function render(){
    edges.forEach(function(e){ if(byId[e.s].hidden||byId[e.t].hidden) return; var p=byId[e.s],q=byId[e.t];
      e.el.setAttribute('x1',p.x.toFixed(1)); e.el.setAttribute('y1',p.y.toFixed(1));
      e.el.setAttribute('x2',q.x.toFixed(1)); e.el.setAttribute('y2',q.y.toFixed(1)); });
    nodes.forEach(function(n){ if(n.hidden) return;
      n.g.setAttribute('transform','translate('+n.x.toFixed(1)+','+n.y.toFixed(1)+')');
      n.t.setAttribute('y',(n.y<CY-6? -(n.r+7) : (n.r+14)).toFixed(1)); });
  }
  var alpha=1, running=false;
  function step(){ tick(alpha); alpha*=0.986; render();
    if(alpha>0.02 || drag.node){ requestAnimationFrame(step); } else { running=false; } }
  function reheat(a){ alpha=Math.max(alpha, a||0.3); if(!running){ running=true; requestAnimationFrame(step); } }
  for(var w=0;w<170;w++) tick(1); render();
  if(window.requestAnimationFrame){ running=true; requestAnimationFrame(step); } else { for(var k=0;k<260;k++) tick(0.5); render(); }

  // wire up controls --------------------------------------------------------
  var box=document.getElementById('kg-search'), clr=document.getElementById('kg-clear');
  if(box){ var deb; box.addEventListener('input',function(){ if(clr) clr.hidden=!box.value;
    clearTimeout(deb); deb=setTimeout(function(){ runSearch(box.value); },90); }); }
  if(clr){ clr.addEventListener('click',function(){ box.value=''; clr.hidden=true; runSearch(''); box.focus(); }); }
  Array.prototype.forEach.call(document.querySelectorAll('.kg-f'),function(btn){
    btn.addEventListener('click',function(){ var tp=btn.getAttribute('data-type');
      off[tp]=!off[tp]; btn.classList.toggle('off',off[tp]); applyVis();
      if(searchOn) runSearch(box?box.value:''); });
  });
  svg.addEventListener('click',function(ev){ if(ev.target===svg||ev.target===gEdges) closePanel(); });
  svg.addEventListener('dblclick',function(ev){
    if(ev.target===svg||ev.target===gEdges){ closePanel(); nodes.forEach(function(n){ n.fx=null; n.fy=null; }); reheat(0.6); }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closePanel(); });
})();