const STORE_KEY = 'fanclips-community-v1';
const communities = [
  { id: 'neymar', name: 'Neymar', members: '24,8 mil', icon: '⚽', color: 'fandom-green', category: 'Futebol' },
  { id: 'army', name: 'ARMY', members: '18,2 mil', icon: '💜', color: 'fandom-violet', category: 'K-pop' },
  { id: 'doramas', name: 'Dorameiros', members: '12,6 mil', icon: '🎞️', color: 'fandom-coral', category: 'Doramas' },
  { id: 'anime', name: 'Anime edits', members: '9,4 mil', icon: '🌸', color: 'fandom-pink', category: 'Anime' },
  { id: 'cinema', name: 'Cena & série', members: '7,1 mil', icon: '🎬', color: 'fandom-blue', category: 'Séries' }
];
const musicTracks = [
  { id: 'pulse', title: 'Pulse', artist: 'FanClips Studio', style: 'Pop eletrônico', color: '#c6f36b', frequency: 220 },
  { id: 'afterglow', title: 'Afterglow', artist: 'FanClips Studio', style: 'Lo-fi', color: '#a7a0ff', frequency: 174 },
  { id: 'stadium', title: 'Dia de jogo', artist: 'FanClips Studio', style: 'Hino de estádio', color: '#ff9366', frequency: 196 },
  { id: 'first-snow', title: 'First Snow', artist: 'FanClips Studio', style: 'Romance', color: '#8dbbff', frequency: 262 }
];
const starter = {
  user: null,
  users: [
    { id: 'u1', name: 'Ana Costa', email: 'ana@fanclips.app', password: 'demo123', role: 'Usuário', joined: '04 nov 2026' },
    { id: 'u2', name: 'Rafael Lima', email: 'rafael@fanclips.app', password: 'demo123', role: 'Usuário', joined: '02 nov 2026' },
    { id: 'u3', name: 'Marina Alves', email: 'marina@fanclips.app', password: 'demo123', role: 'Usuário', joined: '31 out 2026' },
    { id: 'admin', name: 'Caio Admin', email: 'admin@fanclips.app', password: 'admin123', role: 'Admin', joined: '01 out 2026' }
  ],
  clips: [
    { id: 'c1', title: 'O drible que parou o estádio', description: 'Um lance, mil ângulos e aquele replay que a gente vê de novo toda vez. Qual é o seu momento favorito?', category: 'Futebol', community: 'neymar', music: 'Dia de jogo · FanClips Studio', musicId: 'stadium', creator: 'Rafael Lima', userId: 'u2', views: 12480, likes: 892, duration: '0:34', art: '⚽', theme: 'thumb-ball', date: 'há 2 horas', status: 'Publicado', comments: [{name:'Ana Costa',text:'Esse lance é absurdo!'}] },
    { id: 'c2', title: 'O refrão que todo ARMY sabe', description: 'Aquela parte da música que transforma qualquer show em um só coro. 💜', category: 'K-pop', community: 'army', music: 'Afterglow · FanClips Studio', musicId: 'afterglow', creator: 'Ana Costa', userId: 'u1', views: 8560, likes: 641, duration: '0:22', art: '💜', theme: 'thumb-stage', date: 'há 5 horas', status: 'Publicado', comments: [{name:'Marina Alves',text:'Army até o fim 💜'}] },
    { id: 'c3', title: 'Esse final de dorama me destruiu', description: 'Sem spoilers: só a cena, a reação e uma trilha pra sentir tudo de novo. Qual episódio te marcou?', category: 'Doramas', community: 'doramas', music: 'First Snow · FanClips Studio', musicId: 'first-snow', creator: 'Marina Alves', userId: 'u3', views: 5390, likes: 475, duration: '0:39', art: '🎞️', theme: 'thumb-stage', date: 'ontem', status: 'Publicado', comments: [] },
    { id: 'c4', title: 'POV: seu personagem favorito aparece', description: 'A entrada que merece replay em câmera lenta. Conta qual personagem sempre rouba a cena.', category: 'Anime', community: 'anime', music: 'Pulse · FanClips Studio', musicId: 'pulse', creator: 'Rafael Lima', userId: 'u2', views: 2310, likes: 208, duration: '0:29', art: '🌸', theme: 'thumb-road', date: 'ontem', status: 'Publicado', comments: [] },
    { id: 'c5', title: 'Meu top 3 cenas de romance', description: 'Três cenas e uma música que combina com todas. Qual cena entraria no seu top?', category: 'Séries', community: 'cinema', music: 'First Snow · FanClips Studio', musicId: 'first-snow', creator: 'Ana Costa', userId: 'u1', views: 1800, likes: 163, duration: '0:41', art: '🎬', theme: 'thumb-field', date: 'há 3 dias', status: 'Pendente', comments: [] }
  ],
  watched: [], likes: [], comments: {}
};

let db = loadData();
let view = 'feed';
let query = '';
let category = '';
let community = '';
let page = 1;
let adminTab = 'clips';
let profileTab = 'clips';
let toastTimer;
let audioContext;
let musicOscillators = [];
let previewObjectUrl = '';

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...structuredClone(starter), ...saved } : structuredClone(starter);
  } catch { return structuredClone(starter); }
}
function saveData() {
  const snapshot=structuredClone(db);
  snapshot.clips.forEach(clip=>{if(clip.url?.startsWith('blob:')){clip.url='';clip.temporaryVideo=true;}});
  localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
}
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function initials(name = 'CA') { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
function currentUser() { return db.users.find(user => db.user && user.id === db.user.id) || db.user; }
function notify(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
function stopMusicPreview() {
  musicOscillators.forEach(oscillator => { try { oscillator.stop(); } catch {} });
  musicOscillators = [];
  document.querySelector('#preview-mix')?.classList.remove('is-playing');
}
function startTrack(trackId) {
  stopMusicPreview();
  const track=musicTracks.find(item=>item.id===trackId);
  if(!track)return;
  audioContext ||= new window.AudioContext();
  if(audioContext.state==='suspended') audioContext.resume();
  const master=audioContext.createGain(); master.gain.value=.035; master.connect(audioContext.destination);
  [1,1.25,1.5].forEach((ratio,index)=>{
    const oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
    oscillator.type=index===1?'triangle':'sine'; oscillator.frequency.value=track.frequency*ratio;
    gain.gain.value=index===0?.55:.18; oscillator.connect(gain); gain.connect(master); oscillator.start();
    musicOscillators.push(oscillator);
  });
  document.querySelector('#preview-mix')?.classList.add('is-playing');
}
function playMusicPreview() {
  const chosen=document.querySelector('input[name="music"]:checked')?.value;
  startTrack(chosen);
  setTimeout(stopMusicPreview,12000);
}
function setView(next) { view = next; page = 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function clipById(id) { return db.clips.find(clip => clip.id === id); }
function clipCard(clip, compact = false) {
  return `<article class="${compact ? 'compact-card' : 'clip-card'}" data-open="${escapeHTML(clip.id)}" tabindex="0" role="button" aria-label="Abrir ${escapeHTML(clip.title)}">
    <div class="clip-thumb ${escapeHTML(clip.theme)}"><span class="thumb-art">${escapeHTML(clip.art)}</span><span class="duration">${escapeHTML(clip.duration)}</span></div>
    <div class="clip-copy"><div class="clip-meta"><span class="creator-dot">${initials(clip.creator)}</span><span>${escapeHTML(clip.creator)}</span><span>·</span><span>${escapeHTML(clip.date)}</span></div>
      <h3>${escapeHTML(clip.title)}</h3><p>${escapeHTML(clip.description)}</p><div class="clip-footer"><span>◉ ${clip.views.toLocaleString('pt-BR')}</span><span>♥ ${clip.likes.toLocaleString('pt-BR')}</span>${compact ? '' : `<span class="chip">${escapeHTML(clip.category)}</span>`}${clip.music?`<span class="music-credit">♫ ${escapeHTML(clip.music)}</span>`:''}</div></div></article>`;
}
function layoutHeading(kicker, title, subtitle, actions = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}
function visibleClips() {
  let clips = db.clips.filter(clip => clip.status === 'Publicado');
  if (view === 'watched') clips = clips.filter(clip => db.watched.includes(clip.id));
  if (community) clips = clips.filter(clip => clip.community === community);
  if (category) clips = clips.filter(clip => clip.category === category);
  if (query.trim()) {
    const q = query.toLocaleLowerCase('pt-BR');
    clips = clips.filter(clip => `${clip.title} ${clip.description} ${clip.creator} ${clip.category}`.toLocaleLowerCase('pt-BR').includes(q));
  }
  return clips;
}
function renderFeed() {
  const clips = visibleClips();
  const pageSize = 5, count = Math.ceil(clips.length / pageSize) || 1, pageClips = clips.slice((page - 1) * pageSize, page * pageSize);
  const title = view === 'watched' ? 'Assistidos' : community ? `Comunidade ${communities.find(item=>item.id===community)?.name||''}` : query || category ? 'Resultados' : 'Clipes para você';
  const tabs = `<nav class="mobile-nav"><button class="${view === 'feed' ? 'active' : ''}" data-view="feed"><span>⌂</span>Para você</button><button class="${view === 'communities' ? 'active' : ''}" data-view="communities"><span>◉</span>Grupos</button><button data-action="upload"><span>＋</span>Criar</button><button data-action="profile"><span>◉</span>Perfil</button></nav>`;
  const fandoms = `<section class="fandom-strip"><div class="section-line"><div><h2>Suas comunidades</h2><span>Entre no fandom. Compartilhe o momento.</span></div><button class="text-action" data-view="communities">Ver todas</button></div><div class="fandom-rail">${communities.map(item=>`<button class="fandom-item" data-community="${item.id}" aria-label="Abrir comunidade ${item.name}"><span class="fandom-ring ${item.color}"><span>${item.icon}</span></span><strong>${item.name}</strong><small>${item.members} fãs</small></button>`).join('')}</div></section>`;
  document.querySelector('#app').innerHTML = `${layoutHeading('Fandoms em primeiro lugar', title, 'Clipes curtos dos universos que você ama, com a trilha sonora certa.', '<button class="button button-subtle" data-action="admin">Painel de gestão</button>')}${fandoms}
    <div class="feed-layout"><section><div class="section-line"><h2>${view === 'watched' ? 'Seu histórico' : 'Mais recentes'}</h2><span>${clips.length} clipes</span></div>
      ${pageClips.length ? `<div class="video-list">${pageClips.map(clip => clipCard(clip)).join('')}</div>${count > 1 ? `<div class="pagination">${Array.from({length:count},(_,i)=>`<button data-page="${i+1}" class="${page===i+1?'active':''}">${i+1}</button>`).join('')}</div>` : ''}` : `<div class="empty-state"><h2>${view === 'watched' ? 'Seu histórico está vazio' : 'Nenhum clipe encontrado'}</h2><p>${view === 'watched' ? 'Abra um clipe e marque como assistido para encontrá-lo aqui.' : 'Tente mudar a busca ou escolha outra categoria.'}</p></div>`}
    </section><aside class="sidebar"><div class="side-section"><h2>Comunidades</h2><div class="tag-list">${communities.map(item=>`<button class="tag-button ${community===item.id?'selected':''}" data-community="${item.id}">${item.icon} ${item.name}</button>`).join('')}</div></div>
      <div class="side-section"><h2>Criadores da semana</h2>${db.users.filter(user=>user.role!=='Admin').slice(0,3).map(user=>`<div class="creator-row"><span class="creator-dot">${initials(user.name)}</span><div><strong>${escapeHTML(user.name)}</strong><small>@${escapeHTML(user.name.toLowerCase().replaceAll(' ',''))}</small></div><button class="button button-quiet" data-creator="${escapeHTML(user.name)}">Ver</button></div>`).join('')}</div>
      <div class="side-section"><h2>Na FanClips</h2><div class="stats-row"><div class="stat"><b>${communities.length}</b><span>comunidades</span></div><div class="stat"><b>${db.users.length}</b><span>criadores</span></div></div></div></aside></div>${tabs}`;
}
function renderCommunities() {
  const cards=communities.map(item=>`<article class="community-card ${item.color}"><div class="community-art">${item.icon}</div><div class="community-card-copy"><div class="eyebrow">${item.category}</div><h2>${item.name}</h2><p>${item.members} fãs trocando edits, cenas favoritas e novidades.</p><button class="button button-subtle" data-community="${item.id}">Abrir comunidade</button></div></article>`).join('');
  document.querySelector('#app').innerHTML=`${layoutHeading('Encontre sua galera','Comunidades','Cada fandom tem seu espaço. Entre na conversa e compartilhe seus clipes favoritos.')}
  <div class="community-grid">${cards}</div><nav class="mobile-nav"><button data-view="feed"><span>⌂</span>Para você</button><button class="active" data-view="communities"><span>◉</span>Grupos</button><button data-action="upload"><span>＋</span>Criar</button><button data-action="profile"><span>◉</span>Perfil</button></nav>`;
}
function renderProfile() {
  const user = currentUser();
  if (!user) { renderFeed(); openAuth(); return; }
  const own = db.clips.filter(clip => clip.userId === user.id);
  const clips = profileTab === 'watched' ? db.clips.filter(c=>db.watched.includes(c.id)) : profileTab === 'liked' ? db.clips.filter(c=>db.likes.includes(c.id)) : own;
  document.querySelector('#app').innerHTML = `${layoutHeading('Sua conta','Meu perfil','Gerencie seus clipes e os dados da sua conta.')}
    <section class="profile-head"><div class="profile-avatar">${initials(user.name)}</div><div><h2>${escapeHTML(user.name)}</h2><p>${escapeHTML(user.email)} · desde ${escapeHTML(user.joined || 'hoje')}</p><div class="profile-numbers"><span><b>${own.length}</b> clipes</span><span><b>${own.reduce((total,c)=>total+c.views,0).toLocaleString('pt-BR')}</b> visualizações</span></div></div><button class="button button-subtle" data-action="edit-profile">Editar perfil</button>${user.role==='Admin'?'<button class="button button-quiet" data-action="admin">Gestão</button>':''}</section>
    <div class="profile-tabs"><button class="${profileTab==='clips'?'active':''}" data-profile-tab="clips">Meus clipes</button><button class="${profileTab==='watched'?'active':''}" data-profile-tab="watched">Assistidos</button><button class="${profileTab==='liked'?'active':''}" data-profile-tab="liked">Curtidos</button></div>
    ${clips.length?`<div class="compact-grid">${clips.map(clip=>clipCard(clip,true)).join('')}</div>`:`<div class="empty-state"><h2>Nada por aqui ainda</h2><p>Compartilhe um momento com a comunidade.</p><button class="button button-primary" data-action="upload">Enviar primeiro clipe</button></div>`}
    <nav class="mobile-nav"><button data-view="feed"><span>⌂</span>Explorar</button><button data-view="watched"><span>◷</span>Assistidos</button><button data-action="upload"><span>＋</span>Enviar</button><button class="active" data-action="profile"><span>◉</span>Perfil</button></nav>`;
}
function renderEditProfile() {
  const user=currentUser(); if(!user){openAuth();setView('feed');return;}
  document.querySelector('#app').innerHTML=`${layoutHeading('Sua conta','Editar perfil','Atualize as informações da sua conta.')}
  <form class="form-panel" id="profile-form"><h2>Dados pessoais</h2><p>Seu nome aparece junto dos clipes que você publicar.</p><div class="form-grid"><div class="field full"><label for="profile-name">Nome</label><input id="profile-name" name="name" required minlength="2" maxlength="60" value="${escapeHTML(user.name)}"></div><div class="field full"><label for="profile-email">E-mail</label><input id="profile-email" name="email" type="email" required maxlength="120" value="${escapeHTML(user.email)}"></div></div><div class="form-actions"><button type="button" class="button button-quiet" data-action="profile">Cancelar</button><button class="button button-primary">Salvar alterações</button></div></form>`;
}
function renderAdmin() {
  const user=currentUser(); if(!user||user.role!=='Admin'){notify('Acesso restrito ao administrador.');setView('feed');return;}
  let content='';
  if(adminTab==='users') content=`<div class="table-wrap"><table class="data-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Cadastro</th></tr></thead><tbody>${db.users.map(u=>`<tr><td>${escapeHTML(u.name)}</td><td>${escapeHTML(u.email)}</td><td>${escapeHTML(u.role)}</td><td>${escapeHTML(u.joined||'hoje')}</td></tr>`).join('')}</tbody></table></div>`;
  else content=`<div class="table-wrap"><table class="data-table"><thead><tr><th>Clipe</th><th>Criador</th><th>Categoria</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.clips.map(c=>`<tr><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.creator)}</td><td>${escapeHTML(c.category)}</td><td><span class="status ${c.status==='Pendente'?'pending':''}">${escapeHTML(c.status)}</span></td><td>${c.status==='Pendente'?`<button class="table-action" data-approve="${c.id}">Aprovar</button> `:''}<button class="table-action danger" data-delete="${c.id}">Remover</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelector('#app').innerHTML=`${layoutHeading('Administração','Painel de gestão','Acompanhe os cadastros e modere os clipes enviados.')}
    <div class="stats-row" style="max-width:420px;margin-bottom:20px"><div class="stat"><b>${db.users.length}</b><span>usuários cadastrados</span></div><div class="stat"><b>${db.clips.filter(c=>c.status==='Pendente').length}</b><span>clipes aguardando revisão</span></div></div>
    <div class="admin-tabs"><button data-admin-tab="clips" class="${adminTab==='clips'?'active':''}">Clipes (${db.clips.length})</button><button data-admin-tab="users" class="${adminTab==='users'?'active':''}">Usuários (${db.users.length})</button></div>${content}`;
}
function render() {
  document.querySelectorAll('.nav-link').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  const account=document.querySelector('#account-button'), user=currentUser(); account.textContent=user?initials(user.name):'CA'; account.title=user?user.name:'Entrar ou criar conta';
  if(view==='profile') return renderProfile();
  if(view==='edit-profile') return renderEditProfile();
  if(view==='admin') return renderAdmin();
  if(view==='communities') return renderCommunities();
  renderFeed();
}
function openAuth(mode='login') {
  const dialog=document.querySelector('#auth-dialog');
  if(dialog.open) dialog.close();
  const title=mode==='register'?'Criar conta':'Entrar na FanClips';
  dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><h2>${title}</h2><p>${mode==='register'?'Junte-se à comunidade de criadores.':'Acesse seu perfil e seus clipes.'}</p></div><button class="icon-close" data-close="auth-dialog" aria-label="Fechar">×</button></div>
    <form id="auth-form">${mode==='register'?'<div class="field"><label for="auth-name">Nome</label><input id="auth-name" name="name" required minlength="2" maxlength="60" autocomplete="name"></div>':''}<div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" required maxlength="120" autocomplete="email"></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required minlength="6" autocomplete="${mode==='register'?'new-password':'current-password'}"></div>
    <button class="button button-primary">${mode==='register'?'Criar conta':'Entrar'}</button></form><p class="dialog-note">${mode==='register'?'Já tem conta?':'Ainda não tem conta?'} <button data-auth-mode="${mode==='register'?'login':'register'}">${mode==='register'?'Entrar':'Criar uma conta'}</button></p><div class="notice">Acesso de demonstração: <b>admin@fanclips.app</b> · senha: <b>admin123</b></div></div>`;
  dialog.showModal();
}
function openUpload() {
  if(!currentUser()){openAuth();return;}
  const dialog=document.querySelector('#upload-dialog');
  dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><h2>Criar Clip</h2><p>Escolha um vídeo, sua comunidade e a trilha que combina.</p></div><button class="icon-close" data-close="upload-dialog" aria-label="Fechar">×</button></div>
    <form id="upload-form"><div class="field"><label for="clip-file">Vídeo curto</label><input id="clip-file" name="file" type="file" accept="video/*"><span class="field-hint">MP4 ou MOV, com até 3 minutos.</span></div><div id="video-preview" class="upload-preview" hidden></div><div class="field"><label for="clip-title">Título do clip</label><input id="clip-title" name="title" required minlength="4" maxlength="80" placeholder="Ex.: a cena que mudou tudo"></div><div class="field"><label for="clip-description">Descrição</label><textarea id="clip-description" name="description" required minlength="10" maxlength="300" placeholder="Conte um pouco sobre esse momento"></textarea></div><div class="field"><label for="clip-community">Comunidade</label><select id="clip-community" name="community" required><option value="">Escolha o fandom</option>${communities.map(item=>`<option value="${item.id}">${item.name} · ${item.category}</option>`).join('')}<option value="other">Outro fandom</option></select></div><div class="field"><label>Escolha uma trilha</label><div class="music-picker">${musicTracks.map((track,index)=>`<label class="music-option"><input type="radio" name="music" value="${track.id}" ${index===0?'checked':''}><span class="music-play" style="--track-color:${track.color}">♫</span><span class="music-name"><b>${track.title}</b><small>${track.artist} · ${track.style}</small></span><span class="music-duration">0:30</span></label>`).join('')}</div></div><button type="button" class="button button-quiet" id="preview-mix">▶ Ouvir prévia da trilha</button><div class="notice">As trilhas disponíveis aqui são exemplos instrumentais. Na plataforma real, será preciso integrar um catálogo com licença de uso.</div><div class="notice">Prévia local: o arquivo escolhido fica neste navegador e se perde ao recarregar. O envio com armazenamento permanente exige servidor.</div><button class="button button-primary">Publicar clip</button></form></div>`;
  dialog.showModal();
}
function openDetail(id) {
  const clip=clipById(id); if(!clip)return;
  const dialog=document.querySelector('#detail-dialog'); if(dialog.open) dialog.close(); const comments=[...(clip.comments||[]),...(db.comments[id]||[])];
  dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><div class="eyebrow">${escapeHTML(clip.category)} · ${escapeHTML(clip.date)}</div></div><button class="icon-close" data-close="detail-dialog" aria-label="Fechar">×</button></div>
    <div class="detail-layout"><div><div class="detail-preview ${escapeHTML(clip.theme)}">${clip.url?`<video src="${escapeHTML(clip.url)}" controls playsinline preload="metadata" aria-label="${escapeHTML(clip.title)}"></video>`:`<span class="thumb-art">${escapeHTML(clip.art)}</span>`}<span class="duration">${escapeHTML(clip.duration)}</span></div><div class="detail-copy"><h2>${escapeHTML(clip.title)}</h2><div class="clip-meta"><span class="creator-dot">${initials(clip.creator)}</span><span>${escapeHTML(clip.creator)}</span><span>· ${clip.views.toLocaleString('pt-BR')} visualizações</span></div><p>${escapeHTML(clip.description)}</p><div class="detail-actions"><button class="button button-subtle" data-like="${clip.id}">${db.likes.includes(clip.id)?'♥ Curtido':'♡ Curtir'} · ${clip.likes.toLocaleString('pt-BR')}</button><button class="button button-quiet" data-watch="${clip.id}">${db.watched.includes(clip.id)?'✓ Assistido':'◷ Marcar assistido'}</button></div></div></div>
      <section class="comments"><h3>Comentários (${comments.length})</h3>${comments.length?comments.map(c=>`<p class="comment"><b>${escapeHTML(c.name)}</b>${escapeHTML(c.text)}</p>`).join(''):'<p class="comment">Seja a primeira pessoa a comentar.</p>'}<form class="comment-form" data-comment="${clip.id}"><input name="comment" maxlength="240" required placeholder="Escreva um comentário"><button class="button button-primary">Enviar</button></form></section></div></div>`;
  dialog.showModal();
  const video=dialog.querySelector('video');
  if(video&&clip.musicId){video.addEventListener('play',()=>startTrack(clip.musicId));video.addEventListener('pause',stopMusicPreview);video.addEventListener('ended',stopMusicPreview);}
  if(!db.watched.includes(id)){clip.views++;saveData();}
}
function act(action) {
  if(action==='upload') return openUpload();
  if(action==='profile') return setView('profile');
  if(action==='admin') return setView('admin');
  if(action==='edit-profile') return setView('edit-profile');
  if(action==='account') {
    if(currentUser()) {
      const dialog=document.querySelector('#auth-dialog');
      dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><h2>${escapeHTML(currentUser().name)}</h2><p>${escapeHTML(currentUser().email)}</p></div><button class="icon-close" data-close="auth-dialog" aria-label="Fechar">×</button></div><button class="button button-subtle" data-action="profile">Meu perfil</button>${currentUser().role==='Admin'?'<button class="button button-quiet" data-action="admin" style="margin-top:8px">Painel de gestão</button>':''}<button class="button button-quiet" data-action="logout" style="margin-top:8px">Sair da conta</button></div>`; dialog.showModal();
    } else openAuth();
  }
}

document.addEventListener('click', event => {
  const target=event.target.closest('button,[data-open]'); if(!target)return;
  if(target.dataset.view){community='';setView(target.dataset.view);return;}
  if(target.dataset.action){if(target.dataset.action==='logout'){db.user=null;saveData();document.querySelector('#auth-dialog').close();setView('feed');notify('Você saiu da conta.');}else act(target.dataset.action);return;}
  if(target.dataset.close){document.querySelector(`#${target.dataset.close}`).close();return;}
  if(target.dataset.authMode){openAuth(target.dataset.authMode);return;}
  if(target.dataset.open){openDetail(target.dataset.open);return;}
  if(target.dataset.community){community=target.dataset.community;category='';query='';document.querySelector('#search').value='';setView('feed');return;}
  if(target.dataset.category!==undefined){category=target.dataset.category;page=1;render();return;}
  if(target.dataset.page){page=Number(target.dataset.page);render();return;}
  if(target.dataset.adminTab){adminTab=target.dataset.adminTab;render();return;}
  if(target.dataset.profileTab){profileTab=target.dataset.profileTab;render();return;}
  if(target.dataset.creator){document.querySelector('#search').value=target.dataset.creator;query=target.dataset.creator;setView('feed');return;}
  if(target.dataset.approve){const clip=clipById(target.dataset.approve);if(clip){clip.status='Publicado';clip.date='agora';saveData();render();notify('Clipe aprovado e publicado.');}return;}
  if(target.dataset.delete){const clip=clipById(target.dataset.delete);if(clip&&confirm(`Remover “${clip.title}” da plataforma?`)){db.clips=db.clips.filter(item=>item.id!==clip.id);saveData();render();notify('Clipe removido.');}return;}
  if(target.dataset.watch){const id=target.dataset.watch;db.watched.includes(id)?db.watched=db.watched.filter(item=>item!==id):db.watched.push(id);saveData();openDetail(id);return;}
  if(target.dataset.like){if(!currentUser()){openAuth();return;}const id=target.dataset.like,clip=clipById(id);if(db.likes.includes(id)){db.likes=db.likes.filter(item=>item!==id);clip.likes--;}else{db.likes.push(id);clip.likes++;}saveData();openDetail(id);return;}
});
document.querySelector('#account-button').addEventListener('click',()=>act('account'));
document.querySelector('#search').addEventListener('input',event=>{query=event.target.value;category='';community='';page=1;if(view!=='feed')view='feed';render();});
document.addEventListener('change',event=>{
  if(event.target.id==='clip-file'){
    const file=event.target.files?.[0], preview=document.querySelector('#video-preview'); if(!file||!preview)return;
    if(!file.type.startsWith('video/')){event.target.value='';notify('Escolha um arquivo de vídeo.');return;}
    if(previewObjectUrl)URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl=URL.createObjectURL(file);preview.hidden=false;
    preview.innerHTML=`<video src="${previewObjectUrl}" controls muted playsinline></video><span>${escapeHTML(file.name)}</span>`;
    const video=preview.querySelector('video');video.addEventListener('loadedmetadata',()=>{if(video.duration>180){event.target.value='';preview.hidden=true;URL.revokeObjectURL(previewObjectUrl);previewObjectUrl='';notify('O clip precisa ter no máximo 3 minutos.');}});
  }
  if(event.target.name==='music')stopMusicPreview();
});
document.addEventListener('click',event=>{if(event.target.closest('#preview-mix')){if(musicOscillators.length)stopMusicPreview();else playMusicPreview();}});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();document.querySelector('#search').focus();}if(event.key==='Enter'&&event.target.matches('[data-open]'))openDetail(event.target.dataset.open);});
document.addEventListener('submit',event=>{
  if(event.target.id==='auth-form'){
    event.preventDefault();const form=new FormData(event.target),email=String(form.get('email')).trim().toLowerCase(),password=String(form.get('password'));
    if(event.submitter&&event.target.querySelector('#auth-name')){
      if(db.users.some(user=>user.email.toLowerCase()===email)){notify('Esse e-mail já tem cadastro.');return;}
      const user={id:`u${Date.now()}`,name:String(form.get('name')).trim(),email,password,role:'Usuário',joined:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date())};db.users.push(user);db.user=user;saveData();document.querySelector('#auth-dialog').close();render();notify('Conta criada. Boas-vindas à FanClips!');return;
    }
    const user=db.users.find(item=>item.email.toLowerCase()===email);
    if(!user){notify('Conta não encontrada. Crie uma conta para continuar.');return;}
    if(user.password!==password){notify('Senha incorreta.');return;}
    db.user=user;saveData();document.querySelector('#auth-dialog').close();render();notify(`Bem-vindo, ${user.name.split(' ')[0]}!`);return;
  }
  if(event.target.id==='upload-form'){
    event.preventDefault();const form=new FormData(event.target),user=currentUser(),url=String(form.get('url')).trim();
    const file=event.target.querySelector('#clip-file').files?.[0];
    if(!file&&!url){notify('Escolha um arquivo de vídeo para continuar.');return;}
    if(url&&!/^https?:\/\//i.test(url)){notify('O link precisa começar com http:// ou https://');return;}
    const selectedCommunity=communities.find(item=>item.id===String(form.get('community')));
    const track=musicTracks.find(item=>item.id===String(form.get('music')))||musicTracks[0];
    const selectedVideo=event.target.querySelector('#video-preview video');
    const duration=selectedVideo?.duration?`${Math.floor(selectedVideo.duration/60)}:${String(Math.floor(selectedVideo.duration%60)).padStart(2,'0')}`:'0:30';
    db.clips.unshift({id:`c${Date.now()}`,title:String(form.get('title')).trim(),description:String(form.get('description')).trim(),category:selectedCommunity?.category||'Outros',community:selectedCommunity?.id||'other',music:`${track.title} · ${track.artist}`,musicId:track.id,creator:user.name,userId:user.id,views:0,likes:0,duration,art:selectedCommunity?.icon||'🎞️',theme:['thumb-field','thumb-ball','thumb-stage','thumb-road'][db.clips.length%4],date:'agora',status:'Pendente',comments:[],url:file?previewObjectUrl:url});saveData();stopMusicPreview();document.querySelector('#upload-dialog').close();setView('profile');notify('Clip enviado para revisão.');return;
  }
  if(event.target.id==='profile-form'){
    event.preventDefault();const form=new FormData(event.target),user=currentUser(),email=String(form.get('email')).trim().toLowerCase();
    if(db.users.some(item=>item.id!==user.id&&item.email.toLowerCase()===email)){notify('Esse e-mail já está em uso.');return;}
    user.name=String(form.get('name')).trim();user.email=email;db.user=user;db.clips.filter(c=>c.userId===user.id).forEach(c=>c.creator=user.name);saveData();setView('profile');notify('Perfil atualizado.');return;
  }
  if(event.target.matches('[data-comment]')){
    event.preventDefault();if(!currentUser()){openAuth();return;}const id=event.target.dataset.comment,textValue=String(new FormData(event.target).get('comment')).trim();if(!textValue)return;
    (db.comments[id] ||= []).push({name:currentUser().name,text:textValue});saveData();openDetail(id);return;
  }
});
render();
