(function(){
  var ov,img,cap,cur=[],idx=0,timer=null;
  function pre(i){var a=cur[(i+cur.length)%cur.length];if(a){var p=new Image();p.src=a.href;}}
  function show(i){if(!cur.length)return;idx=(i+cur.length)%cur.length;img.src=cur[idx].href;cap.textContent=(idx+1)+' / '+cur.length;pre(idx+1);pre(idx-1);}
  function stop(){if(timer){clearInterval(timer);timer=null;}var b=ov&&ov.querySelector('.lb-play');if(b)b.innerHTML='&#9654;';}
  function play(){timer=setInterval(function(){show(idx+1);},2600);var b=ov.querySelector('.lb-play');b.innerHTML='&#9208;';}
  function close(){stop();if(ov){ov.classList.remove('on');img.src='';}document.body.classList.remove('lb-open');}
  function build(){
    ov=document.createElement('div');ov.className='lb';
    ov.innerHTML='<button class="lb-x" title="关闭 (Esc)">&times;</button><button class="lb-play" title="自动播放">&#9654;</button><button class="lb-nav lb-prev" title="上一张">&#8249;</button><img class="lb-img" alt="幻灯片"><button class="lb-nav lb-next" title="下一张">&#8250;</button><div class="lb-cap"></div>';
    document.body.appendChild(ov);img=ov.querySelector('.lb-img');cap=ov.querySelector('.lb-cap');
    ov.querySelector('.lb-x').onclick=close;
    ov.querySelector('.lb-prev').onclick=function(e){e.stopPropagation();stop();show(idx-1);};
    ov.querySelector('.lb-next').onclick=function(e){e.stopPropagation();stop();show(idx+1);};
    ov.querySelector('.lb-play').onclick=function(e){e.stopPropagation();if(timer)stop();else play();};
    ov.onclick=function(e){if(e.target===ov)close();};
  }
  function open(list,i){if(!ov)build();cur=list;document.body.classList.add('lb-open');ov.classList.add('on');show(i);}
  document.addEventListener('click',function(e){
    var a=e.target.closest('.gallery a');if(!a)return;e.preventDefault();
    var list=[].slice.call(a.closest('.gallery').querySelectorAll('a'));open(list,list.indexOf(a));
  });
  document.addEventListener('keydown',function(e){
    if(!ov||!ov.classList.contains('on'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();stop();show(idx-1);}
    else if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '){e.preventDefault();stop();show(idx+1);}
  });
  var sx=0,sy=0;
  document.addEventListener('touchstart',function(e){if(ov&&ov.classList.contains('on')){sx=e.touches[0].clientX;sy=e.touches[0].clientY;}},{passive:true});
  document.addEventListener('touchend',function(e){
    if(!ov||!ov.classList.contains('on'))return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>40||Math.abs(dy)>40){stop();show(idx+((dx<-40||dy<-40)?1:-1));}
  },{passive:true});
})();