 const score = document.getElementById('score');
  let solved = {};

  function addPoint(id, correct){
    if(solved[id] !== undefined) return;
    solved[id] = correct;
    if(correct){
      let total = Object.values(solved).filter(Boolean).length;
      score.textContent = total;
    }
  }

  function showFeedback(q, ok){
    const fb = q.querySelector('.feedback');
    fb.className = 'feedback show ' + (ok ? 'ok' : 'no');
    fb.textContent = ok ? '✓ Супер! Правильно.' : '✕ Подумай ще. Глянь правильну відповідь.';
  }

  // SINGLE choice + odd-one-out
  document.querySelectorAll('.q[data-type="single"]').forEach(q=>{
    q.querySelectorAll('.opt').forEach(opt=>{
      opt.addEventListener('click', ()=>{
        const correct = opt.dataset.correct === '1';
        q.querySelectorAll('.opt').forEach(o=>{
          o.classList.add('locked');
          if(o.dataset.correct === '1') o.classList.add('correct');
        });
        if(!correct) opt.classList.add('wrong');
        showFeedback(q, correct);
        addPoint(q.id, correct);
      });
    });
  });

  // MULTIPLE choice
  document.querySelectorAll('.q[data-type="multi"]').forEach(q=>{
    const btn = q.querySelector('.q-btn');
    q.querySelectorAll('.opt').forEach(opt=>{
      opt.addEventListener('click', ()=>{
        if(opt.classList.contains('locked')) return;
        opt.classList.toggle('sel');
        const box = opt.querySelector('.box');
        box.textContent = opt.classList.contains('sel') ? '✓' : '';
      });
    });
    btn.addEventListener('click', ()=>{
      let ok = true;
      q.querySelectorAll('.opt').forEach(o=>{
        const should = o.dataset.correct === '1';
        const picked = o.classList.contains('sel');
        o.classList.add('locked');
        if(should){ o.classList.remove('sel'); o.classList.add('correct'); o.querySelector('.box').textContent='✓'; }
        if(picked && !should){ o.classList.remove('sel'); o.classList.add('wrong'); o.querySelector('.box').textContent='✕'; }
        if(should !== picked) ok = false;
      });
      btn.disabled = true;
      showFeedback(q, ok);
      addPoint(q.id, ok);
    });
  });

  // reveal on scroll
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
