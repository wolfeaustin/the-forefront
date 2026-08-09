(function(){
  var KEY = 'forefront:activity:__DATE__';
  // localStorage with in-memory fallback (some embedded previews block storage)
  var store;
  try {
    localStorage.setItem('__ff_test','1');
    localStorage.removeItem('__ff_test');
    store = localStorage;
  } catch (e) {
    var mem = {};
    store = {
      getItem: function(k){ return (k in mem) ? mem[k] : null; },
      setItem: function(k,v){ mem[k] = v; }
    };
  }

  function load(){
    try { return JSON.parse(store.getItem(KEY)) || {read:{}, saved:{}}; }
    catch(e){ return {read:{}, saved:{}}; }
  }
  function persist(){ try { store.setItem(KEY, JSON.stringify(data)); } catch(e){} }

  var data = load();
  var stories = Array.prototype.slice.call(document.querySelectorAll('.story'));

  function storyId(s){
    var h = s.querySelector('h2');
    return h ? h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60) : '';
  }

  // Activity stat in the header bar
  var bar = document.querySelector('.filterstat');
  var stat = document.createElement('span');
  stat.className = 'youstat';
  if (bar) bar.appendChild(stat);

  function render(){
    var readCount = 0, savedCount = 0;
    stories.forEach(function(s){
      var k = storyId(s);
      var isRead = !!data.read[k], isSaved = !!data.saved[k];
      if (isRead) readCount++;
      if (isSaved) savedCount++;
      s.classList.toggle('read', isRead);
      var btn = s.querySelector('.savebtn');
      if (btn){
        btn.textContent = isSaved ? 'Saved ✓' : 'Save';
        btn.classList.toggle('on', isSaved);
      }
    });
    stat.innerHTML = 'You: <b>' + readCount + '</b> read · <b>' + savedCount + '</b> saved';
  }

  stories.forEach(function(s){
    var k = storyId(s);

    // Any click into the story's content counts as engagement
    s.querySelectorAll('a, .playbtn, .hl').forEach(function(el){
      el.addEventListener('click', function(){
        data.read[k] = Date.now();
        persist(); render();
      });
    });

    // Save button in the source row
    var row = s.querySelector('.srcrow');
    if (row){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip savebtn';
      btn.addEventListener('click', function(ev){
        ev.stopPropagation();
        if (data.saved[k]) { delete data.saved[k]; } else { data.saved[k] = Date.now(); }
        persist(); render();
      });
      var meta = row.querySelector('.meta');
      row.insertBefore(btn, meta || null);
    }
  });

  render();
})();
