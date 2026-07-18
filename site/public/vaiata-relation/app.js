(function(){
  /* ---------- Router ---------- */
  var navBtns=document.querySelectorAll('nav button');
  var screenNav={dash:'dash',clients:'clients',client:'clients',partners:'partners',partner:'partners',deals:'deals',deal:'deals',validations:'validations',catalog:'catalog',mail:'mail',reports:'reports'};
  function go(s,arg){
    navBtns.forEach(function(b){b.classList.toggle('active',b.dataset.s===screenNav[s])});
    document.querySelectorAll('.screen').forEach(function(sc){sc.classList.toggle('on',sc.id==='s-'+s)});
    if(s==='partners') renderPartners(arg||'all');
    if(s==='clients') renderClients(arg||'all');
    window.scrollTo(0,0);
  }
  navBtns.forEach(function(b){b.addEventListener('click',function(){go(b.dataset.s)})});
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-go]');
    if(el && !e.target.closest('[data-cmt]')) go(el.dataset.go, el.dataset.arg);
  });
  document.querySelectorAll('.stat.click').forEach(function(el){
    el.addEventListener('keydown',function(e){if(e.key==='Enter') go(el.dataset.go)});
  });

  /* ---------- Données ---------- */
  var partners=[
    {n:'Camping Les Cormorans', c:'Hébergement', conv:'2024-087 · échéance 31/08/26', convW:1, portal:1, ca:'28 640 €', fiche:1},
    {n:'Hôtel des Voyageurs', c:'Hébergement', conv:'2025-014 · à jour', portal:1, ca:'19 210 €'},
    {n:'Gîtes de la Croix Rouge', c:'Hébergement', conv:'2023-051 · à jour', portal:0, ca:'6 480 €'},
    {n:'La Table du Port', c:'Restauration', conv:'2024-102 · à jour', portal:1, ca:'22 350 €'},
    {n:'Les Paniers de la Meule', c:'Restauration', conv:'2025-008 · à jour', portal:1, ca:'17 890 €'},
    {n:'Oya Découverte', c:'Activités & visites', conv:'2022-033 · à jour', portal:1, ca:'31 470 €'},
    {n:'Le Vieux Château', c:'Activités & visites', conv:'2024-071 · à jour', portal:1, ca:'12 040 €'},
    {n:'Cyclo’Côte', c:'Mobilité', conv:'2025-021 · à jour', portal:1, ca:'14 620 €'},
    {n:'Taxis de l’Île', c:'Mobilité', conv:'convention à signer', convW:1, portal:0, ca:'—'}
  ];
  var clients=[
    {n:'Les Cars Rocheteau', s:'Autocariste', ct:'Accueil groupes', ca:'16 380 €', act:'Option TR-2026-1847', rgpd:1, fiche:1},
    {n:'Autocars Sourisseau', s:'Autocariste', ct:'Service groupes', ca:'9 120 €', act:'Devis mai 2027', rgpd:1},
    {n:'CE Atlantique Habitat', s:'CE', ct:'C. Merlet', ca:'11 260 €', act:'Séminaire confirmé', rgpd:1},
    {n:'Amicale laïque de Saint-Hilaire', s:'CE', ct:'Bureau', ca:'2 106 €', act:'Devis envoyé', rgpd:1},
    {n:'Lycée Notre-Dame, Challans', s:'Scolaire', ct:'Vie scolaire', ca:'1 850 €', act:'Devis envoyé', rgpd:1},
    {n:'Voyages Grolleau', s:'TO', ct:'Production', ca:'24 730 €', act:'2 dossiers en cours', rgpd:1},
    {n:'Famille Guilbaud', s:'B2C', ct:'—', ca:'812 €', act:'Escale nature août', rgpd:0},
    {n:'M. et Mme Tesson', s:'B2C', ct:'—', ca:'486 €', act:'Traversées juillet', rgpd:1}
  ];
  function pill(ok,txtOk,txtKo,warn){return '<span class="pill '+(ok?(warn?'warn':'ok'):'neutral')+'">'+(ok?txtOk:txtKo)+'</span>'}
  function renderPartners(f){
    document.querySelectorAll('#partner-chips button').forEach(function(b){b.classList.toggle('active',b.dataset.f===f)});
    var rows='<tr><th>Partenaire</th><th>Catégorie</th><th>Convention</th><th>Portail</th><th class="num">CA apporté 2025</th></tr>';
    partners.filter(function(p){return f==='all'||p.c===f}).forEach(function(p){
      rows+='<tr class="row-link"'+(p.fiche?' data-go="partner"':'')+'><td><span class="link">'+p.n+'</span></td><td>'+p.c+'</td>'+
        '<td>'+(p.convW?'<span class="pill warn">':'<span class="pill ok">')+p.conv+'</span></td>'+
        '<td>'+pill(p.portal,'Login actif','Non ouvert')+'</td><td class="num">'+p.ca+'</td></tr>';
    });
    document.getElementById('partner-table').innerHTML=rows;
  }
  function renderClients(f){
    document.querySelectorAll('#client-chips button').forEach(function(b){b.classList.toggle('active',b.dataset.f===f)});
    var rows='<tr><th>Compte</th><th>Segment</th><th>Contact</th><th class="num">CA 2025</th><th>Dernière activité</th><th>RGPD</th></tr>';
    var lbl={Autocariste:'Autocariste',CE:'CE / association',Scolaire:'Scolaire',TO:'Tour-opérateur',B2C:'Particulier'};
    clients.filter(function(c){return f==='all'||c.s===f}).forEach(function(c){
      rows+='<tr class="row-link"'+(c.fiche?' data-go="client"':'')+'><td><span class="link">'+c.n+'</span></td><td>'+lbl[c.s]+'</td><td>'+c.ct+'</td>'+
        '<td class="num">'+c.ca+'</td><td>'+c.act+'</td><td>'+pill(c.rgpd,'Consenti','À recueillir',0)+'</td></tr>';
    });
    document.getElementById('client-table').innerHTML=rows;
  }
  document.getElementById('partner-chips').addEventListener('click',function(e){ if(e.target.dataset.f) renderPartners(e.target.dataset.f)});
  document.getElementById('client-chips').addEventListener('click',function(e){ if(e.target.dataset.f) renderClients(e.target.dataset.f)});
  renderPartners('all'); renderClients('all');

  /* ---------- Tuile CA ---------- */
  var caData={ytd:['312 480 €','+18 % vs 2025',1], mom:['64 210 €','+11 % vs juin 2026',1], yoy:['64 210 €','+23 % vs juillet 2025',1]};
  document.getElementById('ca-view').addEventListener('change',function(){
    var d=caData[this.value];
    document.getElementById('ca-val').textContent=d[0];
    var v=document.getElementById('ca-var'); v.textContent=d[1]; v.classList.toggle('down',!d[2]);
  });

  /* ---------- Recherche transversale ---------- */
  var idx=[
    {k:'client',lbl:'CLIENT',n:'Les Cars Rocheteau',d:'Autocariste · 16 380 € en 2025',go:'client'},
    {k:'client',lbl:'CLIENT',n:'CE Atlantique Habitat',d:'CE · séminaire confirmé',go:'clients',arg:'CE'},
    {k:'client',lbl:'CLIENT',n:'Voyages Grolleau',d:'Tour-opérateur',go:'clients',arg:'TO'},
    {k:'client',lbl:'CLIENT',n:'Lycée Notre-Dame, Challans',d:'Scolaire · devis envoyé',go:'clients',arg:'Scolaire'},
    {k:'p',lbl:'PARTENAIRE',n:'Camping Les Cormorans',d:'Hébergement · convention à renouveler',go:'partner'},
    {k:'p',lbl:'PARTENAIRE',n:'Oya Découverte',d:'Activités & visites',go:'partners',arg:'Activités & visites'},
    {k:'p',lbl:'PARTENAIRE',n:'Le Vieux Château',d:'1 validation en attente',go:'validations'},
    {k:'p',lbl:'PARTENAIRE',n:'Les Paniers de la Meule',d:'Restauration',go:'partners',arg:'Restauration'},
    {k:'p',lbl:'PARTENAIRE',n:'Cyclo’Côte',d:'Mobilité',go:'partners',arg:'Mobilité'},
    {k:'t',lbl:'TRANSACTION',n:'TR-2026-1847 · Les Cars Rocheteau',d:'Option · 2 340 €',go:'deal'},
    {k:'t',lbl:'TRANSACTION',n:'TR-2026-1799 · CE Atlantique Habitat',d:'Confirmé · 4 810 €',go:'deals'},
    {k:'o',lbl:'OFFRE',n:'Journée groupe insulaire',d:'à partir de 78 € / pers.',go:'catalog'},
    {k:'o',lbl:'OFFRE',n:'Séminaire à la journée',d:'à partir de 129 € / pers.',go:'catalog'},
    {k:'o',lbl:'OFFRE',n:'Escale nature · vélo & panier',d:'à partir de 54 € / pers.',go:'catalog'},
    {k:'o',lbl:'DOCUMENT',n:'Convention 2024-087 · Camping Les Cormorans',d:'PDF · SharePoint',go:'partner'},
    {k:'o',lbl:'ÉCRAN',n:'Messagerie · emails rattachés',d:'Outlook connecté',go:'mail'},
    {k:'o',lbl:'ÉCRAN',n:'Rapports · pilotage commercial',d:'CA, conversion, partenaires',go:'reports'}
  ];
  var kcls={client:'',p:'p',t:'t',o:'o'};
  var ovS=document.getElementById('ov-search'), inp=document.getElementById('search-input'), res=document.getElementById('search-results');
  function openSearch(){ovS.classList.add('show'); inp.value=''; renderSearch(''); inp.focus()}
  function closeAll(){document.querySelectorAll('.overlay').forEach(function(o){o.classList.remove('show')})}
  function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  function renderSearch(q){
    var list=idx.filter(function(it){return !q || norm(it.n+' '+it.d).indexOf(norm(q))>-1});
    if(!list.length){res.innerHTML='<div class="empty">Aucun résultat pour « '+q.replace(/</g,'&lt;')+' »</div>'; return}
    var html='', last='';
    list.forEach(function(it,i){
      if(it.lbl!==last){html+='<div class="sr-group">'+it.lbl+'S</div>'; last=it.lbl}
      html+='<div class="sr'+(i===0?' sel':'')+'" data-i="'+idx.indexOf(it)+'"><span class="k '+kcls[it.k]+'">'+it.lbl+'</span> '+it.n+'<small>'+it.d+'</small></div>';
    });
    res.innerHTML=html;
  }
  document.getElementById('search-open').addEventListener('click',openSearch);
  document.getElementById('search-open').addEventListener('keydown',function(e){if(e.key==='Enter') openSearch()});
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); openSearch()}
    if(e.key==='Escape') closeAll();
    if(ovS.classList.contains('show')&&e.key==='Enter'){var sel=res.querySelector('.sr.sel')||res.querySelector('.sr'); if(sel) sel.click()}
  });
  inp.addEventListener('input',function(){renderSearch(this.value)});
  res.addEventListener('click',function(e){
    var el=e.target.closest('.sr'); if(!el) return;
    var it=idx[+el.dataset.i]; closeAll(); go(it.go,it.arg);
  });
  document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){document.getElementById(b.dataset.close).classList.remove('show')})});
  document.querySelectorAll('.overlay').forEach(function(o){o.addEventListener('click',function(e){if(e.target===o) o.classList.remove('show')})});

  /* ---------- Validations : actions ---------- */
  document.getElementById('val-table').addEventListener('click',function(e){
    var tr=e.target.closest('tr'); if(!tr) return;
    var st=tr.querySelector('.vst');
    if(e.target.classList.contains('act-relance')){
      st.className='pill warn vst'; st.textContent='Relancé à l’instant';
      e.target.textContent='✓ Relancé'; e.target.disabled=true;
    }
    if(e.target.classList.contains('act-ok')){
      st.className='pill ok vst'; st.textContent='Validé';
      tr.querySelectorAll('button').forEach(function(b){b.disabled=true});
    }
  });
  document.getElementById('btn-portal').addEventListener('click',function(){document.getElementById('ov-portal').classList.add('show')});
  document.getElementById('portal-ok').addEventListener('click',function(){
    this.textContent='✓ Disponibilité confirmée'; this.disabled=true;
    document.getElementById('portal-msg').textContent='Côté Compagnie des Îles, la ligne passe instantanément en « Validé » et le dossier avance sans un seul email manuel.';
  });

  /* ---------- Devis (wizard) ---------- */
  var dvStep=1;
  var offerLines={
    'Journée groupe insulaire':[['Traversée A/R','Compagnie des Îles (billetterie)',870],['Visite commentée en car','Oya Découverte',540],['Vieux Château','Le Vieux Château',240],['Panier repas','Les Paniers de la Meule',690]],
    'Séminaire à la journée':[['Traversée A/R','Compagnie des Îles (billetterie)',870],['Salle + accueil café','Hôtel des Voyageurs',980],['Déjeuner assis','La Table du Port',1470],['Sortie côtière encadrée','Oya Découverte',550]],
    'Escale nature · vélo & panier':[['Traversée A/R','Compagnie des Îles (billetterie)',870],['Location vélo journée','Cyclo’Côte',390],['Panier repas','Les Paniers de la Meule',690]]
  };
  function openDevis(offer){
    dvStep=1; showStep();
    if(offer) document.getElementById('dv-offer').value=offer;
    document.getElementById('ov-devis').classList.add('show');
  }
  function showStep(){
    [1,2,3].forEach(function(i){
      document.getElementById('dv-step'+i).style.display=(i===dvStep?'block':'none');
      document.getElementById('st'+i).classList.toggle('cur',i===dvStep);
    });
    document.getElementById('dv-next').textContent=(dvStep===3?'Créer le devis (option)':'Continuer');
  }
  document.getElementById('dv-next').addEventListener('click',function(){
    if(dvStep<3){
      dvStep++;
      if(dvStep===3){
        var offer=document.getElementById('dv-offer').value;
        var client=document.getElementById('dv-client').value.split(' · ')[0];
        var pax=+document.getElementById('dv-pax').value||30;
        document.getElementById('dv-sum-client').textContent=client;
        document.getElementById('dv-sum-offer').textContent=offer+' · '+pax+' pers.';
        var base=offerLines[offer]||offerLines['Journée groupe insulaire'];
        var tot=0, html='';
        base.forEach(function(l){var m=Math.round(l[2]*pax/30); tot+=m;
          html+='<tr><td>'+l[0]+'</td><td>'+l[1]+'</td><td class="num">'+m.toLocaleString('fr-FR')+' €</td></tr>'});
        html+='<tr><td colspan="2" style="text-align:right; font-weight:650">Total</td><td class="num" style="font-weight:650">'+tot.toLocaleString('fr-FR')+' €</td></tr>';
        document.getElementById('dv-lines').innerHTML=html;
      }
      showStep();
    }else{
      closeAll(); go('deal');
      var bn=document.getElementById('shift-banner');
      bn.textContent='Devis DV-2026-0912 créé et transformé en option : chaque prestataire vient d’être notifié de sa part.';
      bn.classList.add('show');
    }
  });
  ['btn-devis-cat','btn-devis-deals','btn-devis-client'].forEach(function(id){
    var b=document.getElementById(id); if(b) b.addEventListener('click',function(){openDevis()});
  });
  document.querySelectorAll('.devis-from').forEach(function(b){b.addEventListener('click',function(){openDevis(b.dataset.offer)})});

  /* ---------- Nouvelle offre ---------- */
  document.getElementById('btn-new-offer').addEventListener('click',function(){document.getElementById('ov-offer').classList.add('show')});
  document.getElementById('of-create').addEventListener('click',function(){
    var name=document.getElementById('of-name').value||'Nouvelle offre';
    var price=document.getElementById('of-price').value||'— €';
    var card=document.createElement('div'); card.className='card pack';
    card.innerHTML='<div class="top"><h3>'+name.replace(/</g,'&lt;')+'</h3><div class="price">à partir de '+price.replace(/</g,'&lt;')+' / pers. · brouillon</div></div>'+
      '<ul><li><span>Traversée A/R</span><span>Compagnie des Îles</span></li><li><span>Visite guidée port & citadelle</span><span>Oya Découverte</span></li><li><span>Déjeuner assis</span><span>La Table du Port</span></li></ul>'+
      '<div class="ft"><button class="btn sm devis-from">Créer un devis</button><button class="btn sm ghost">Modifier</button></div>';
    document.getElementById('pack-grid').appendChild(card);
    card.querySelector('.devis-from').addEventListener('click',function(){openDevis()});
    closeAll();
    var bn=document.getElementById('offer-banner');
    bn.textContent='Offre « '+name+' » créée en brouillon. Les partenaires concernés seront notifiés à la publication.';
    bn.classList.add('show');
  });

  /* ---------- Décaler la date ---------- */
  var shifted=false;
  document.getElementById('btn-shift').addEventListener('click',function(){
    if(shifted) return; shifted=true;
    document.querySelectorAll('[data-bind="deal-date"]').forEach(function(el){el.textContent='19 oct. 2026'});
    document.querySelectorAll('#deal-lines .st').forEach(function(p,i){
      if(i===0) return;
      p.className='pill warn st'; p.textContent='Re-notifié';
    });
    var bn=document.getElementById('shift-banner');
    bn.textContent='Date décalée au 19 octobre. Les 3 prestataires externes ont été re-notifiés, leurs validations sont redemandées.';
    bn.classList.add('show');
    var li=document.createElement('li');
    li.innerHTML='<div class="who sys">YC</div><div>M. Rocheteau a rappelé : option décalée du 12 au 19 octobre. Les 3 prestataires externes ont été re-notifiés, validations redemandées.<time>automatique · à l’instant</time></div>';
    var tl=document.getElementById('deal-tl'); tl.insertBefore(li,tl.firstChild);
    this.textContent='✓ Date décalée'; this.disabled=true;
  });

  /* ---------- Commentaires ---------- */
  document.querySelectorAll('[data-cmt]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var input=document.getElementById(btn.dataset.cmt);
      var txt=input.value.trim(); if(!txt) return;
      var tl=document.getElementById(btn.dataset.tl);
      var li=document.createElement('li');
      var esc=txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/@(\w+)/g,'<span class="tag">@$1</span>');
      li.innerHTML='<div class="who red">TE</div><div>'+esc+'<time>Thomas Érard · à l’instant</time></div>';
      tl.insertBefore(li,tl.firstChild);
      input.value='';
    });
  });

  /* ---------- Messagerie : rattachement ---------- */
  document.querySelectorAll('.mail-act').forEach(function(btn){
    btn.addEventListener('click',function(){
      var tr=btn.closest('tr'), st=tr.querySelector('.mst');
      st.className='pill ok mst'; st.textContent=st.textContent.replace('Suggestion :','Rattaché ·');
      btn.outerHTML='<span class="link" data-go="deal">Ouvrir →</span>';
    });
  });
  document.querySelectorAll('.mail-new').forEach(function(btn){
    btn.addEventListener('click',function(){
      var tr=btn.closest('tr'), st=tr.querySelector('.mst');
      st.className='pill ok mst'; st.textContent='Fiche créée · Vendée Tourisme';
      btn.outerHTML='<span class="link" data-go="partners">Ouvrir →</span>';
    });
  });
})();
