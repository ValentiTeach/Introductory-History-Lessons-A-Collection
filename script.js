 const solved = {};
  const scoreEl = document.getElementById('score');
  function award(id, ok){
    if(solved[id] !== undefined) return;
    solved[id] = !!ok;
    scoreEl.textContent = Object.values(solved).filter(Boolean).length;
  }
  function feedback(task, ok, okMsg, noMsg){
    const fb = task.querySelector('.fb');
    fb.className = 'fb show ' + (ok ? 'ok' : 'no');
    fb.textContent = ok ? (okMsg||'✓ Правильно!') : (noMsg||'✕ Не зовсім. Дивись підказку вище.');
  }
 
  /* SINGLE */
  document.querySelectorAll('.task[data-type="single"]').forEach(t=>{
    t.querySelectorAll('.opt').forEach(opt=>{
      opt.addEventListener('click', ()=>{
        const ok = opt.dataset.c === '1';
        t.querySelectorAll('.opt').forEach(o=>{o.classList.add('locked'); if(o.dataset.c==='1') o.classList.add('correct');});
        if(!ok) opt.classList.add('wrong');
        feedback(t, ok);
        award(t.id, ok);
      });
    });
  });
 
  /* MULTI */
  document.querySelectorAll('.task[data-type="multi"]').forEach(t=>{
    const btn = t.querySelector('.btn');
    t.querySelectorAll('.opt').forEach(opt=>opt.addEventListener('click',()=>{
      if(opt.classList.contains('locked'))return;
      opt.classList.toggle('sel');
      opt.querySelector('.box').textContent = opt.classList.contains('sel')?'✓':'';
    }));
    btn.addEventListener('click', ()=>{
      let ok=true;
      t.querySelectorAll('.opt').forEach(o=>{
        const should=o.dataset.c==='1', picked=o.classList.contains('sel');
        o.classList.add('locked');
        if(should){o.classList.remove('sel');o.classList.add('correct');o.querySelector('.box').textContent='✓';}
        if(picked&&!should){o.classList.remove('sel');o.classList.add('wrong');o.querySelector('.box').textContent='✕';}
        if(should!==picked) ok=false;
      });
      btn.disabled=true; feedback(t,ok); award(t.id,ok);
    });
  });
 
  /* ORDERING */
  (function(){
    const list = document.getElementById('sortable');
    const task = document.getElementById('t3');
    let dragEl=null;
    function items(){return [...list.querySelectorAll('.srt')];}
    list.querySelectorAll('.srt').forEach(el=>{
      el.addEventListener('dragstart',()=>{dragEl=el;el.classList.add('dragging');});
      el.addEventListener('dragend',()=>{el.classList.remove('dragging');items().forEach(i=>i.classList.remove('over'));});
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over');});
      el.addEventListener('dragleave',()=>el.classList.remove('over'));
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');
        if(dragEl&&dragEl!==el){const arr=items();const di=arr.indexOf(dragEl),ti=arr.indexOf(el);
          if(di<ti) el.after(dragEl); else el.before(dragEl);}
      });
    });
    list.querySelectorAll('.mv button').forEach(b=>b.addEventListener('click',()=>{
      const row=b.closest('.srt');
      if(b.dataset.dir==='up'&&row.previousElementSibling) row.parentNode.insertBefore(row,row.previousElementSibling);
      if(b.dataset.dir==='down'&&row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling,row);
    }));
    document.getElementById('checkOrder').addEventListener('click',()=>{
      let ok=true;
      items().forEach((el,i)=>{
        el.classList.remove('ok','bad');
        if(+el.dataset.order===i) el.classList.add('ok'); else {el.classList.add('bad');ok=false;}
      });
      feedback(task,ok,'✓ Хронологія правильна!','✕ Порядок ще не той — червоні картки на місці помилки.');
      if(ok) award('t3',true);
    });
  })();
 
  /* MATCHING */
  (function(){
    const task=document.getElementById('t5');
    const lefts=[...task.querySelectorAll('[data-side="left"]')];
    const rights=[...task.querySelectorAll('[data-side="right"]')];
    let active=null;
    const pairs={}; // leftKey -> rightEl
    function clearActive(){lefts.forEach(l=>l.classList.remove('active'));}
    function pinClass(i){return ['p1','p2','p3'][i];}
    lefts.forEach((l,i)=>l.addEventListener('click',()=>{
      // unpair existing
      if(pairs[l.dataset.key]){const r=pairs[l.dataset.key];r.classList.remove('paired','p1','p2','p3');r.querySelector('.pin').textContent='';delete pairs[l.dataset.key];}
      l.classList.remove('paired','p1','p2','p3');l.querySelector('.pin').textContent='';
      clearActive(); active=l; l.classList.add('active');
    }));
    rights.forEach(r=>r.addEventListener('click',()=>{
      if(!active) return;
      // free this right if used
      for(const k in pairs){if(pairs[k]===r){lefts.find(x=>x.dataset.key===k).classList.remove('paired','p1','p2','p3');lefts.find(x=>x.dataset.key===k).querySelector('.pin').textContent='';delete pairs[k];}}
      const idx=lefts.indexOf(active);
      pairs[active.dataset.key]=r;
      const cls=pinClass(idx);
      active.classList.add('paired',cls);active.querySelector('.pin').textContent=idx+1;
      r.classList.add('paired',cls);r.querySelector('.pin').textContent=idx+1;
      clearActive();active=null;
    }));
    document.getElementById('checkMatch').addEventListener('click',()=>{
      let ok=true,done=0;
      lefts.forEach(l=>{
        l.classList.remove('ok','bad');const r=pairs[l.dataset.key];
        if(!r){ok=false;return;} done++;
        if(r.dataset.key===l.dataset.key){l.classList.add('ok');r.classList.add('ok');}
        else{l.classList.add('bad');r.classList.add('bad');ok=false;}
      });
      if(done<lefts.length){feedback(task,false,'','✕ Спершу познач усі три типи.');return;}
      feedback(task,ok,'✓ Усі пари правильні!','✕ Є помилки — червоним позначено невірні пари.');
      if(ok) award('t5',true);
    });
    document.getElementById('resetMatch').addEventListener('click',()=>{
      [...lefts,...rights].forEach(e=>{e.classList.remove('paired','active','ok','bad','p1','p2','p3');e.querySelector('.pin').textContent='';});
      for(const k in pairs) delete pairs[k]; active=null;
      task.querySelector('.fb').className='fb';
    });
  })();
 
  /* ANAGRAM */
  (function(){
    const task=document.getElementById('t6');
    const TARGET='ЛІТОПИС';
    const letters=['І','О','С','Л','И','Т','П'];
    const slotsEl=document.getElementById('anaSlots');
    const tilesEl=document.getElementById('anaTiles');
    const resEl=document.getElementById('anaResult');
    let answer=[]; // {letter, tileIdx}
    function render(){
      slotsEl.innerHTML='';
      for(let i=0;i<TARGET.length;i++){
        const s=document.createElement('div');
        s.className='slot'+(answer[i]?' full':'');
        s.textContent=answer[i]?answer[i].letter:'';
        slotsEl.appendChild(s);
      }
      [...tilesEl.children].forEach((t,i)=>t.disabled=answer.some(a=>a.tileIdx===i));
      if(answer.length===TARGET.length) check();
    }
    function check(){
      const word=answer.map(a=>a.letter).join('');
      const ok=word===TARGET;
      feedback(task,ok,'✓ Правильно — ЛІТОПИС!','✕ Поки не те слово. Спробуй «Скинути».');
      if(ok){resEl.classList.add('show');resEl.innerHTML='<b>Літопис</b> — твір доби Середньовіччя, де події записували за роками («по літах»).';award('t6',true);}
    }
    letters.forEach((L,i)=>{
      const b=document.createElement('button');b.className='tile';b.textContent=L;
      b.addEventListener('click',()=>{if(answer.length<TARGET.length){answer.push({letter:L,tileIdx:i});render();}});
      tilesEl.appendChild(b);
    });
    document.getElementById('anaBack').addEventListener('click',()=>{answer.pop();resEl.classList.remove('show');task.querySelector('.fb').className='fb';render();});
    document.getElementById('anaReset').addEventListener('click',()=>{answer=[];resEl.classList.remove('show');task.querySelector('.fb').className='fb';render();});
    render();
  })();
 
  /* total + reveal */
  document.getElementById('total').textContent=document.querySelectorAll('[data-task]').length;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
