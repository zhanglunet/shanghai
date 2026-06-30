(function(){
  var host=document.getElementById('kg'), dataEl=document.getElementById('kg-data');
  if(!host||!dataEl||!document.createElementNS) return;
  var data; try{ data=JSON.parse(dataEl.textContent); }catch(e){ return; }
  var NS='http://www.w3.org/2000/svg', W=960, H=620, CX=W/2, CY=H/2;
  var nodes=data.nodes.map(function(n){return Object.assign({},n);});
  var byId={}; nodes.forEach(function(n){byId[n.id]=n;});
  var edges=data.edges.filter(function(e){return byId[e.s]&&byId[e.t];});

  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('class','kg-svg');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  host.appendChild(svg);
  var gEdges=document.createElementNS(NS,'g'), gNodes=document.createElementNS(NS,'g');
  svg.appendChild(gEdges); svg.appendChild(gNodes);

  var seed=20260627; function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
  nodes.forEach(function(n,i){
    var a=2*Math.PI*i/nodes.length+rnd();
    var rad=130+rnd()*150;
    n.x=CX+Math.cos(a)*rad; n.y=CY+Math.sin(a)*rad*0.62; n.vx=0; n.vy=0; n.deg=0;
  });
  var adj={}; nodes.forEach(function(n){adj[n.id]={};});
  edges.forEach(function(e){byId[e.s].deg++; byId[e.t].deg++; adj[e.s][e.t]=1; adj[e.t][e.s]=1;});

  edges.forEach(function(e){
    var ln=document.createElementNS(NS,'line'); ln.setAttribute('class','kg-edge');
    ln.setAttribute('stroke-width',Math.max(0.6,Math.min(2.6,e.w*0.45)).toFixed(2));
    ln.style.opacity=Math.max(0.10,Math.min(0.42,0.09+e.w*0.045)).toFixed(3);
    e.el=ln; gEdges.appendChild(ln);
  });
  nodes.forEach(function(n){
    var g=document.createElementNS(NS,'a');
    g.setAttributeNS('http://www.w3.org/1999/xlink','href',n.url); g.setAttribute('href',n.url);
    g.setAttribute('class','kg-node');
    var c=document.createElementNS(NS,'circle');
    c.setAttribute('r',n.r); c.setAttribute('fill',n.color);
    var t=document.createElementNS(NS,'text'); t.setAttribute('class','kg-label');
    t.setAttribute('text-anchor','middle'); t.setAttribute('font-size',n.r>=20?13:(n.r>=15?12:11));
    t.textContent=n.name;
    var title=document.createElementNS(NS,'title'); title.textContent=n.name+' · 出现于 '+n.f+' 场';
    g.appendChild(title); g.appendChild(c); g.appendChild(t);
    n.c=c; n.t=t; n.g=g; gNodes.appendChild(g);
    g.addEventListener('mouseenter',function(){focus(n.id);});
    g.addEventListener('mouseleave',function(){focus(null);});
  });

  function focus(id){
    if(!id){ svg.classList.remove('kg-on');
      nodes.forEach(function(n){n.g.classList.remove('hi','lo');});
      edges.forEach(function(e){e.el.classList.remove('hi','lo');}); return; }
    svg.classList.add('kg-on');
    nodes.forEach(function(n){var near=(n.id===id)||adj[id][n.id];
      n.g.classList.toggle('hi',!!near); n.g.classList.toggle('lo',!near);});
    edges.forEach(function(e){var on=(e.s===id||e.t===id);
      e.el.classList.toggle('hi',on); e.el.classList.toggle('lo',!on);});
  }
  function tick(a){
    var i,j,n,b,dx,dy,d,d2,mind,rep,fx,fy;
    for(i=0;i<nodes.length;i++){ n=nodes[i];
      for(j=i+1;j<nodes.length;j++){ b=nodes[j];
        dx=n.x-b.x; dy=n.y-b.y; d2=dx*dx+dy*dy||0.01; d=Math.sqrt(d2);
        mind=n.r+b.r+30; rep=3800/d2; if(d<mind) rep+=(mind-d)*1.2/d;
        fx=dx/d*rep; fy=dy/d*rep; n.vx+=fx; n.vy+=fy; b.vx-=fx; b.vy-=fy; } }
    edges.forEach(function(e){ var p=byId[e.s], q=byId[e.t];
      dx=q.x-p.x; dy=q.y-p.y; d=Math.sqrt(dx*dx+dy*dy)||0.01;
      var rest=p.r+q.r+78-Math.min(18,e.w*1.4); var f=(d-rest)*0.015*(0.5+e.w*0.07);
      fx=dx/d*f; fy=dy/d*f; p.vx+=fx; p.vy+=fy; q.vx-=fx; q.vy-=fy; });
    nodes.forEach(function(n){
      n.vx+=(CX-n.x)*0.0012*(1+n.deg*0.04); n.vy+=(CY-n.y)*0.0019*(1+n.deg*0.04);
      n.x+=n.vx*a; n.y+=n.vy*a; n.vx*=0.85; n.vy*=0.85;
      n.x=Math.max(n.r+10,Math.min(W-n.r-10,n.x));
      n.y=Math.max(n.r+24,Math.min(H-n.r-24,n.y)); });
  }
  function render(){
    edges.forEach(function(e){var p=byId[e.s],q=byId[e.t];
      e.el.setAttribute('x1',p.x.toFixed(1)); e.el.setAttribute('y1',p.y.toFixed(1));
      e.el.setAttribute('x2',q.x.toFixed(1)); e.el.setAttribute('y2',q.y.toFixed(1));});
    nodes.forEach(function(n){ n.g.setAttribute('transform','translate('+n.x.toFixed(1)+','+n.y.toFixed(1)+')');
      n.t.setAttribute('y',(n.y<CY-6? -(n.r+7) : (n.r+14)).toFixed(1)); });
  }
  var iter=0, MAX=440;
  for(var w=0;w<60;w++) tick(1);
  render();
  function loop(){ var a=Math.max(0.12,1-iter/MAX); tick(a); iter++;
    if(iter%1===0) render(); if(iter<MAX) requestAnimationFrame(loop); }
  if(window.requestAnimationFrame) requestAnimationFrame(loop); else { for(var k=0;k<MAX;k++) tick(0.5); render(); }
})();