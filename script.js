/* ===== shared state ===== */
const solved = {};
const scoreEl = document.getElementById('score');
const scoreBar = document.querySelector('.score-bar');

function award(id, ok){
  if(solved[id] !== undefined) return;
  solved[id] = !!ok;
  const total = Object.values(solved).filter(Boolean).length;
  scoreEl.textContent = total;
  if(ok && scoreBar){
    scoreBar.classList.remove('bump');
    void scoreBar.offsetWidth;
    scoreBar.classList.add('bump');
  }
}
function feedback(task, ok, okMsg, noMsg){
  const fb = task.querySelector('.fb');
  fb.className = 'fb show ' + (ok ? 'ok' : 'no');
  fb.textContent = ok ? (okMsg || '✓ Правильно!') : (noMsg || '✕ Не зовсім. Спробуй ще раз.');
}

/* ===== SINGLE ===== */
document.querySelectorAll('.task[data-type="single"]').forEach(t => {
  t.querySelectorAll('.opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const ok = opt.dataset.c === '1';
      t.querySelectorAll('.opt').forEach(o => {
        o.classList.add('locked');
        if(o.dataset.c === '1') o.classList.add('correct');
      });
      if(!ok) opt.classList.add('wrong');
      feedback(t, ok);
      award(t.id, ok);
    });
  });
});

/* ===== MULTI ===== */
document.querySelectorAll('.task[data-type="multi"]').forEach(t => {
  const btn = t.querySelector('.btn');
  t.querySelectorAll('.opt').forEach(opt => opt.addEventListener('click', () => {
    if(opt.classList.contains('locked')) return;
    opt.classList.toggle('sel');
    opt.querySelector('.box').textContent = opt.classList.contains('sel') ? '✓' : '';
  }));
  btn.addEventListener('click', () => {
    let ok = true;
    t.querySelectorAll('.opt').forEach(o => {
      const should = o.dataset.c === '1', picked = o.classList.contains('sel');
      o.classList.add('locked');
      if(should){o.classList.remove('sel');o.classList.add('correct');o.querySelector('.box').textContent = '✓';}
      if(picked && !should){o.classList.remove('sel');o.classList.add('wrong');o.querySelector('.box').textContent = '✕';}
      if(should !== picked) ok = false;
    });
    btn.disabled = true;
    feedback(t, ok);
    award(t.id, ok);
  });
});

/* ===== ORDERING ===== */
(function(){
  const list = document.getElementById('sortable');
  if(!list) return;
  const task = document.getElementById('t3');
  let dragEl = null;
  const items = () => [...list.querySelectorAll('.srt')];
  list.querySelectorAll('.srt').forEach(el => {
    el.addEventListener('dragstart', () => {dragEl = el; el.classList.add('dragging');});
    el.addEventListener('dragend', () => {el.classList.remove('dragging'); items().forEach(i => i.classList.remove('over'));});
    el.addEventListener('dragover', e => {e.preventDefault(); el.classList.add('over');});
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('over');
      if(dragEl && dragEl !== el){
        const arr = items(), di = arr.indexOf(dragEl), ti = arr.indexOf(el);
        if(di < ti) el.after(dragEl); else el.before(dragEl);
      }
    });
  });
  list.querySelectorAll('.mv button').forEach(b => b.addEventListener('click', () => {
    const row = b.closest('.srt');
    if(b.dataset.dir === 'up' && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
    if(b.dataset.dir === 'down' && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
  }));
  document.getElementById('checkOrder').addEventListener('click', () => {
    let ok = true;
    items().forEach((el, i) => {
      el.classList.remove('ok', 'bad');
      if(+el.dataset.order === i) el.classList.add('ok'); else {el.classList.add('bad'); ok = false;}
    });
    feedback(task, ok, '✓ Хронологія правильна!', '✕ Порядок ще не той — червоні картки на місці помилки.');
    if(ok) award('t3', true);
  });
})();

/* ===== MATCHING ===== */
(function(){
  const task = document.getElementById('t5');
  if(!task) return;
  const lefts = [...task.querySelectorAll('[data-side="left"]')];
  const rights = [...task.querySelectorAll('[data-side="right"]')];
  let active = null;
  const pairs = {};
  const clearActive = () => lefts.forEach(l => l.classList.remove('active'));
  const pinClass = i => ['p1', 'p2', 'p3'][i];

  lefts.forEach(l => l.addEventListener('click', () => {
    if(pairs[l.dataset.key]){
      const r = pairs[l.dataset.key];
      r.classList.remove('paired', 'p1', 'p2', 'p3'); r.querySelector('.pin').textContent = '';
      delete pairs[l.dataset.key];
    }
    l.classList.remove('paired', 'p1', 'p2', 'p3'); l.querySelector('.pin').textContent = '';
    clearActive(); active = l; l.classList.add('active');
  }));
  rights.forEach(r => r.addEventListener('click', () => {
    if(!active) return;
    for(const k in pairs){
      if(pairs[k] === r){
        const otherLeft = lefts.find(x => x.dataset.key === k);
        otherLeft.classList.remove('paired', 'p1', 'p2', 'p3');
        otherLeft.querySelector('.pin').textContent = '';
        delete pairs[k];
      }
    }
    const idx = lefts.indexOf(active);
    pairs[active.dataset.key] = r;
    const cls = pinClass(idx);
    active.classList.add('paired', cls); active.querySelector('.pin').textContent = idx + 1;
    r.classList.add('paired', cls); r.querySelector('.pin').textContent = idx + 1;
    clearActive(); active = null;
  }));
  document.getElementById('checkMatch').addEventListener('click', () => {
    let ok = true, done = 0;
    lefts.forEach(l => {
      l.classList.remove('ok', 'bad');
      const r = pairs[l.dataset.key];
      if(!r){ok = false; return;}
      done++;
      if(r.dataset.key === l.dataset.key){l.classList.add('ok'); r.classList.add('ok');}
      else {l.classList.add('bad'); r.classList.add('bad'); ok = false;}
    });
    if(done < lefts.length){feedback(task, false, '', '✕ Спершу познач усі три типи.'); return;}
    feedback(task, ok, '✓ Усі пари правильні!', '✕ Є помилки — червоним позначено невірні пари.');
    if(ok) award('t5', true);
  });
  document.getElementById('resetMatch').addEventListener('click', () => {
    [...lefts, ...rights].forEach(e => {
      e.classList.remove('paired', 'active', 'ok', 'bad', 'p1', 'p2', 'p3');
      e.querySelector('.pin').textContent = '';
    });
    for(const k in pairs) delete pairs[k];
    active = null;
    task.querySelector('.fb').className = 'fb';
  });
})();

/* ===== FLIP CARDS ===== */
document.querySelectorAll('[data-flip]').forEach(el =>
  el.addEventListener('click', () => el.classList.toggle('flipped'))
);

/* ===== CLASSIFICATION MINI-GAME (drag + click) ===== */
(function(){
  const task = document.getElementById('t6');
  if(!task) return;
  const chipsBox = document.getElementById('chips');
  const chips = [...task.querySelectorAll('.chip')];
  const bins = [...task.querySelectorAll('.bin')];
  let activeChip = null;
  let dragging = null;

  function placeChip(chip, binEl){
    if(chip.classList.contains('ok') || chip.classList.contains('bad')) return;
    chip.classList.remove('active');
    chip.dataset.placedIn = binEl.dataset.bin;
    binEl.querySelector('.bin-body').appendChild(chip);
    chip.classList.add('placed');
    activeChip = null;
  }
  function returnAllToPool(){
    chips.forEach(c => {
      c.classList.remove('placed', 'ok', 'bad', 'active');
      delete c.dataset.placedIn;
      chipsBox.appendChild(c);
    });
    activeChip = null;
    task.querySelector('.fb').className = 'fb';
  }

  /* click flow */
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if(chip.classList.contains('ok') || chip.classList.contains('bad')) return;
      chips.forEach(c => c.classList.remove('active'));
      activeChip = chip;
      chip.classList.add('active');
    });
    /* drag */
    chip.addEventListener('dragstart', e => {
      dragging = chip; chip.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try{ e.dataTransfer.setData('text/plain', ''); }catch(_){}
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      bins.forEach(b => b.classList.remove('drop-hover'));
      dragging = null;
    });
  });
  bins.forEach(bin => {
    bin.addEventListener('click', () => {
      if(!activeChip) return;
      placeChip(activeChip, bin);
    });
    bin.addEventListener('dragover', e => {e.preventDefault(); bin.classList.add('drop-hover');});
    bin.addEventListener('dragleave', () => bin.classList.remove('drop-hover'));
    bin.addEventListener('drop', e => {
      e.preventDefault(); bin.classList.remove('drop-hover');
      if(dragging) placeChip(dragging, bin);
    });
  });
  /* allow returning a placed chip to pool by clicking it again, then clicking pool */
  chipsBox.addEventListener('click', () => {
    if(activeChip && activeChip.classList.contains('placed')){
      activeChip.classList.remove('placed', 'active');
      delete activeChip.dataset.placedIn;
      chipsBox.appendChild(activeChip);
      activeChip = null;
    }
  });

  document.getElementById('checkClassify').addEventListener('click', () => {
    const allPlaced = chips.every(c => c.classList.contains('placed'));
    if(!allPlaced){feedback(task, false, '', '✕ Розклади всі картки.'); return;}
    let ok = true;
    chips.forEach(c => {
      c.classList.remove('ok', 'bad');
      if(c.dataset.key === c.dataset.placedIn) c.classList.add('ok');
      else {c.classList.add('bad'); ok = false;}
    });
    feedback(task, ok, '✓ Усі джерела на місці!', '✕ Є помилки — червоні картки не у своїй корзині.');
    if(ok) award('t6', true);
  });
  document.getElementById('resetClassify').addEventListener('click', returnAllToPool);
})();

/* ===== ANAGRAM ===== */
(function(){
  const task = document.getElementById('t7');
  if(!task) return;
  const TARGET = 'ЛІТОПИС';
  const letters = ['І', 'О', 'С', 'Л', 'И', 'Т', 'П'];
  const slotsEl = document.getElementById('anaSlots');
  const tilesEl = document.getElementById('anaTiles');
  const resEl = document.getElementById('anaResult');
  let answer = [];
  function render(){
    slotsEl.innerHTML = '';
    for(let i = 0; i < TARGET.length; i++){
      const s = document.createElement('div');
      s.className = 'slot' + (answer[i] ? ' full' : '');
      s.textContent = answer[i] ? answer[i].letter : '';
      slotsEl.appendChild(s);
    }
    [...tilesEl.children].forEach((t, i) => t.disabled = answer.some(a => a.tileIdx === i));
    if(answer.length === TARGET.length) check();
  }
  function check(){
    const word = answer.map(a => a.letter).join('');
    const ok = word === TARGET;
    feedback(task, ok, '✓ Правильно — ЛІТОПИС!', '✕ Поки не те слово. Спробуй «Скинути».');
    if(ok){
      resEl.classList.add('show');
      resEl.innerHTML = '<b>Літопис</b> — твір доби Середньовіччя, де події записували за роками («по літах»).';
      award('t7', true);
    }
  }
  letters.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'tile'; b.textContent = L;
    b.addEventListener('click', () => {if(answer.length < TARGET.length){answer.push({letter: L, tileIdx: i}); render();}});
    tilesEl.appendChild(b);
  });
  document.getElementById('anaBack').addEventListener('click', () => {answer.pop(); resEl.classList.remove('show'); task.querySelector('.fb').className = 'fb'; render();});
  document.getElementById('anaReset').addEventListener('click', () => {answer = []; resEl.classList.remove('show'); task.querySelector('.fb').className = 'fb'; render();});
  render();
})();

/* ===== TRUE / FALSE ===== */
document.querySelectorAll('.task[data-type="tf"]').forEach(t => {
  const rows = [...t.querySelectorAll('.tf-row')];
  let answered = 0, ok = true;
  rows.forEach(row => {
    row.querySelectorAll('.tf-btns button').forEach(b => {
      b.addEventListener('click', () => {
        if(row.classList.contains('done')) return;
        const correct = row.dataset.c === b.dataset.v;
        row.classList.add('done');
        b.classList.add(correct ? 'ok' : 'no');
        if(!correct){
          const right = row.querySelector('button[data-v="' + row.dataset.c + '"]');
          right.classList.add('hint');
          ok = false;
        }
        answered++;
        if(answered === rows.length){
          feedback(t, ok, '✓ Чудово, усі правильні!', '✕ Не всі правильно — зеленим позначено правильні варіанти.');
          if(ok) award(t.id, true);
        }
      });
    });
  });
});

/* ===== FIGURE REVEAL (Ken Burns on first view) ===== */
const figObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('seen');
      figObs.unobserve(e.target);
    }
  });
}, {threshold: .2});
document.querySelectorAll('figure').forEach(f => figObs.observe(f));

/* ===== SECTION REVEAL ===== */
const io = new IntersectionObserver(es => es.forEach(e => {
  if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);}
}), {threshold: .1});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ===== total tasks ===== */
document.getElementById('total').textContent = document.querySelectorAll('[data-task]').length;
