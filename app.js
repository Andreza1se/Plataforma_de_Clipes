const STORE_KEY = 'fanclips-community-v1';
const communities = [
  { id: 'neymar', name: 'Brasileirão Insane Moments', members: '24,8 mil', icon: '⚽', color: 'fandom-green', category: 'Futebol' },
  { id: 'army', name: 'ARMY Forever Jungkook Postagem', members: '18,2 mil', icon: '💜', color: 'fandom-violet', category: 'K-pop' },
  { id: 'doramas', name: 'Dorameiros', members: '12,6 mil', icon: '🎞️', color: 'fandom-coral', category: 'Doramas' },
  { id: 'anime', name: 'Anime edits', members: '9,4 mil', icon: '🌸', color: 'fandom-pink', category: 'Anime' },
  { id: 'cinema', name: 'Cena & série', members: '7,1 mil', icon: '🎬', color: 'fandom-blue', category: 'Séries' },
  { id: 'memes', name: 'Laje dos Memes', members: '5,2 mil', icon: '😂', color: 'fandom-yellow', category: 'Memes' }
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
    // { id: 'c1', title: 'O drible que parou o estádio', description: 'Um lance, mil ângulos e aquele replay que a gente vê de novo toda vez. Qual é o seu momento favorito?', category: 'Futebol', community: 'neymar', music: 'Dia de jogo · FanClips Studio', musicId: 'stadium', creator: 'Rafael Lima', userId: 'u2', views: 12480, likes: 892, duration: '0:34', art: '⚽', theme: 'thumb-ball', date: 'há 2 horas', status: 'Publicado', comments: [{ name: 'Ana Costa', text: 'Esse lance é absurdo!' }] },
    // { id: 'c2', title: 'O refrão que todo ARMY sabe', description: 'Aquela parte da música que transforma qualquer show em um só coro. 💜', category: 'K-pop', community: 'army', music: 'Afterglow · FanClips Studio', musicId: 'afterglow', creator: 'Ana Costa', userId: 'u1', views: 8560, likes: 641, duration: '0:22', art: '💜', theme: 'thumb-stage', date: 'há 5 horas', status: 'Publicado', comments: [{ name: 'Marina Alves', text: 'Army até o fim 💜' }] },
    // { id: 'c3', title: 'Esse final de dorama me destruiu', description: 'Sem spoilers: só a cena, a reação e uma trilha pra sentir tudo de novo. Qual episódio te marcou?', category: 'Doramas', community: 'doramas', music: 'First Snow · FanClips Studio', musicId: 'first-snow', creator: 'Marina Alves', userId: 'u3', views: 5390, likes: 475, duration: '0:39', art: '🎞️', theme: 'thumb-stage', date: 'ontem', status: 'Publicado', comments: [] },
    // { id: 'c4', title: 'POV: seu personagem favorito aparece', description: 'A entrada que merece replay em câmera lenta. Conta qual personagem sempre rouba a cena.', category: 'Anime', community: 'anime', music: 'Pulse · FanClips Studio', musicId: 'pulse', creator: 'Rafael Lima', userId: 'u2', views: 2310, likes: 208, duration: '0:29', art: '🌸', theme: 'thumb-road', date: 'ontem', status: 'Publicado', comments: [] },
    // { id: 'c5', title: 'Meu top 3 cenas de romance', description: 'Três cenas e uma música que combina com todas. Qual cena entraria no seu top?', category: 'Séries', community: 'cinema', music: 'First Snow · FanClips Studio', musicId: 'first-snow', creator: 'Ana Costa', userId: 'u1', views: 1800, likes: 163, duration: '0:41', art: '🎬', theme: 'thumb-field', date: 'há 3 dias', status: 'Pendente', comments: [] }
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
let previewObjectUrl = '';
let audioPreviewUrl = '';

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...structuredClone(starter), ...saved } : structuredClone(starter);
  } catch { return structuredClone(starter); }
}

function saveData() {
  const snapshot = structuredClone(db);
  snapshot.clips.forEach(clip => { if (clip.url?.startsWith('blob:')) { clip.url = ''; clip.temporaryVideo = true; } });
  localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
}

function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function csrfToken() { return document.cookie.split('; ').find(cookie => cookie.startsWith('XSRF-TOKEN='))?.slice('XSRF-TOKEN='.length) || ''; }
function initials(name = 'CA') { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
function currentUser() { return db.users.find(user => db.user && user.id === db.user.id) || db.user; }

function notify(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function setView(next) { view = next; page = 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function clipById(id) { return db.clips.find(clip => clip.id === id); }

function stopDetailMedia() {
  const dialog = document.querySelector('#detail-dialog');
  dialog?.querySelectorAll('video, audio').forEach(media => {
    media.pause();
    media.removeAttribute('src');
    media.load();
  });
}

function stopDetailMedia() {
  const dialog = document.querySelector('#detail-dialog');
  dialog?.querySelectorAll('video, audio').forEach(media => {
    media.pause();
    media.removeAttribute('src');
    media.load();
  });
}

function clipCard(clip, compact = false) {
  return `<article class="${compact ? 'compact-card' : 'clip-card'}" data-open="${escapeHTML(clip.id)}" tabindex="0" role="button" aria-label="Abrir ${escapeHTML(clip.title)}">
    <div class="clip-thumb ${escapeHTML(clip.theme)}"><span class="thumb-art">${escapeHTML(clip.art)}</span><span class="duration">${escapeHTML(clip.duration)}</span></div>
    <div class="clip-copy"><div class="clip-meta"><span class="creator-dot">${initials(clip.creator)}</span><span>${escapeHTML(clip.creator)}</span><span>·</span><span>${escapeHTML(clip.date)}</span></div>
      <h3>${escapeHTML(clip.title)}</h3><p>${escapeHTML(clip.description)}</p><div class="clip-footer"><span>◉ ${clip.views.toLocaleString('pt-BR')}</span><span>♥ ${clip.likes.toLocaleString('pt-BR')}</span>${compact ? '' : `<span class="chip">${escapeHTML(clip.category)}</span>`}${clip.music ? `<span class="music-credit">♫ ${escapeHTML(clip.music)}</span>` : ''}</div></div></article>`;
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
  const title = view === 'watched' ? 'Assistidos' : community ? `Comunidade ${communities.find(item => item.id === community)?.name || ''}` : query || category ? 'Resultados' : 'Clipes para você';
  const tabs = `<nav class="mobile-nav"><button class="${view === 'feed' ? 'active' : ''}" data-view="feed"><span>⌂</span>Para você</button><button class="${view === 'communities' ? 'active' : ''}" data-view="communities"><span>◉</span>Grupos</button><button data-action="upload"><span>＋</span>Criar</button><button data-action="profile"><span>◉</span>Perfil</button></nav>`;
  const fandoms = `<section class="fandom-strip"><div class="section-line"><div><h2>Suas comunidades</h2><span>Entre no fandom. Compartilhe o momento.</span></div><button class="text-action" data-view="communities">Ver todas</button></div><div class="fandom-rail">${communities.map(item => `<button class="fandom-item" data-community="${item.id}" aria-label="Abrir comunidade ${item.name}"><span class="fandom-ring ${item.color}"><span>${item.icon}</span></span><strong>${item.name}</strong><small>${item.members} fãs</small></button>`).join('')}</div></section>`;

  document.querySelector('#app').innerHTML = `${layoutHeading('Fandoms em primeiro lugar', title, 'Clipes curtos dos universos que você ama, com a trilha sonora certa.', '<button class="button button-subtle" data-action="admin">Painel de gestão</button>')}${fandoms}
    <div class="feed-layout"><section><div class="section-line"><h2>${view === 'watched' ? 'Seu histórico' : 'Mais recentes'}</h2><span>${clips.length} clipes</span></div>
      ${pageClips.length ? `<div class="video-list">${pageClips.map(clip => clipCard(clip)).join('')}</div>${count > 1 ? `<div class="pagination">${Array.from({ length: count }, (_, i) => `<button data-page="${i + 1}" class="${page === i + 1 ? 'active' : ''}">${i + 1}</button>`).join('')}</div>` : ''}` : `<div class="empty-state"><h2>${view === 'watched' ? 'Seu histórico está vazio' : 'Nenhum clipe encontrado'}</h2><p>${view === 'watched' ? 'Abra um clipe e marque como assistido para encontrá-lo aqui.' : 'Tente mudar a busca ou escolha outra categoria.'}</p></div>`}
    </section><aside class="sidebar"><div class="side-section"><h2>Comunidades</h2><div class="tag-list">${communities.map(item => `<button class="tag-button ${community === item.id ? 'selected' : ''}" data-community="${item.id}">${item.icon} ${item.name}</button>`).join('')}</div></div>
      <div class="side-section"><h2>Criadores da semana</h2>${db.users.filter(user => user.role !== 'Admin').slice(0, 3).map(user => `<div class="creator-row"><span class="creator-dot">${initials(user.name)}</span><div><strong>${escapeHTML(user.name)}</strong><small>@${escapeHTML(user.name.toLowerCase().replaceAll(' ', ''))}</small></div><button class="button button-quiet" data-creator="${escapeHTML(user.name)}">Ver</button></div>`).join('')}</div>
      <div class="side-section"><h2>Na FanClips</h2><div class="stats-row"><div class="stat"><b>${communities.length}</b><span>comunidades</span></div><div class="stat"><b>${db.users.length}</b><span>criadores</span></div></div></div></aside></div>${tabs}`;
}

function renderCommunities() {
  const cards = communities.map(item => `<article class="community-card ${item.color}"><div class="community-art">${item.icon}</div><div class="community-card-copy"><div class="eyebrow">${item.category}</div><h2>${item.name}</h2><p>${item.members} fãs trocando edits, cenas favoritas e novidades.</p><button class="button button-subtle" data-community="${item.id}">Abrir comunidade</button></div></article>`).join('');
  document.querySelector('#app').innerHTML = `${layoutHeading('Encontre sua galera', 'Comunidades', 'Cada fandom tem seu espaço. Entre na conversa e compartilhe seus clipes favoritos.')}
  <div class="community-grid">${cards}</div><nav class="mobile-nav"><button data-view="feed"><span>⌂</span>Para você</button><button class="active" data-view="communities"><span>◉</span>Grupos</button><button data-action="upload"><span>＋</span>Criar</button><button data-action="profile"><span>◉</span>Perfil</button></nav>`;
}

function renderProfile() {
  const user = currentUser();
  if (!user) { renderFeed(); openAuth(); return; }
  const own = db.clips.filter(clip => clip.userId === user.id);
  const clips = profileTab === 'watched' ? db.clips.filter(c => db.watched.includes(c.id)) : profileTab === 'liked' ? db.clips.filter(c => db.likes.includes(c.id)) : own;

  document.querySelector('#app').innerHTML = `${layoutHeading('Sua conta', 'Meu perfil', 'Gerencie seus clipes e os dados da sua conta.')}
    <section class="profile-head"><div class="profile-avatar">${initials(user.name)}</div><div><h2>${escapeHTML(user.name)}</h2><p>${escapeHTML(user.email)} · desde ${escapeHTML(user.joined || 'hoje')}</p><div class="profile-numbers"><span><b>${own.length}</b> clipes</span><span><b>${own.reduce((total, c) => total + c.views, 0).toLocaleString('pt-BR')}</b> visualizações</span></div></div><button class="button button-subtle" data-action="edit-profile">Editar perfil</button>${user.role === 'Admin' ? '<button class="button button-quiet" data-action="admin">Gestão</button>' : ''}</section>
    <div class="profile-tabs"><button class="${profileTab === 'clips' ? 'active' : ''}" data-profile-tab="clips">Meus clipes</button><button class="${profileTab === 'watched' ? 'active' : ''}" data-profile-tab="watched">Assistidos</button><button class="${profileTab === 'liked' ? 'active' : ''}" data-profile-tab="liked">Curtidos</button></div>
    ${clips.length ? `<div class="compact-grid">${clips.map(clip => clipCard(clip, true)).join('')}</div>` : `<div class="empty-state"><h2>Nada por aqui ainda</h2><p>Compartilhe um momento com a comunidade.</p><button class="button button-primary" data-action="upload">Enviar primeiro clipe</button></div>`}
    <nav class="mobile-nav"><button data-view="feed"><span>⌂</span>Explorar</button><button data-view="watched"><span>◷</span>Assistidos</button><button data-action="upload"><span>＋</span>Enviar</button><button class="active" data-action="profile"><span>◉</span>Perfil</button></nav>`;
}

function renderEditProfile() {
  const user = currentUser(); if (!user) { openAuth(); setView('feed'); return; }
  document.querySelector('#app').innerHTML = `${layoutHeading('Sua conta', 'Editar perfil', 'Atualize as informações da sua conta.')}
  <form class="form-panel" id="profile-form"><h2>Dados pessoais</h2><p>Seu nome aparece junto dos clipes que você publicar.</p><div class="form-grid"><div class="field full"><label for="profile-name">Nome</label><input id="profile-name" name="name" required minlength="2" maxlength="60" value="${escapeHTML(user.name)}"></div><div class="field full"><label for="profile-email">E-mail</label><input id="profile-email" name="email" type="email" required maxlength="120" value="${escapeHTML(user.email)}"></div></div><div class="form-actions"><button type="button" class="button button-quiet" data-action="profile">Cancelar</button><button class="button button-primary">Salvar alterações</button></div></form>`;
}

function renderAdmin() {
  const user = currentUser(); if (!user || user.role !== 'Admin') { notify('Acesso restrito ao administrador.'); setView('feed'); return; }
  let content = '';
  if (adminTab === 'users') content = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Cadastro</th></tr></thead><tbody>${db.users.map(u => `<tr><td>${escapeHTML(u.name)}</td><td>${escapeHTML(u.email)}</td><td>${escapeHTML(u.role)}</td><td>${escapeHTML(u.joined || 'hoje')}</td></tr>`).join('')}</tbody></table></div>`;
  else content = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Clipe</th><th>Criador</th><th>Categoria</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.clips.map(c => `<tr><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.creator)}</td><td>${escapeHTML(c.category)}</td><td><span class="status ${c.status === 'Pendente' ? 'pending' : ''}">${escapeHTML(c.status)}</span></td><td>${c.status === 'Pendente' ? `<button class="table-action" data-approve="${c.id}">Aprovar</button> ` : ''}<button class="table-action danger" data-delete="${c.id}">Remover</button></td></tr>`).join('')}</tbody></table></div>`;

  document.querySelector('#app').innerHTML = `${layoutHeading('Administração', 'Painel de gestão', 'Acompanhe os cadastros e modere os clipes enviados.')}
    <div class="stats-row" style="max-width:420px;margin-bottom:20px"><div class="stat"><b>${db.users.length}</b><span>usuários cadastrados</span></div><div class="stat"><b>${db.clips.filter(c => c.status === 'Pendente').length}</b><span>clipes aguardando revisão</span></div></div>
    <div class="admin-tabs"><button data-admin-tab="clips" class="${adminTab === 'clips' ? 'active' : ''}">Clipes (${db.clips.length})</button><button data-admin-tab="users" class="${adminTab === 'users' ? 'active' : ''}">Usuários (${db.users.length})</button></div>${content}`;
}

function render() {
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const account = document.querySelector('#account-button'), user = currentUser(); account.textContent = user ? initials(user.name) : 'CA'; account.title = user ? user.name : 'Entrar ou criar conta';
  if (view === 'profile') return renderProfile();
  if (view === 'edit-profile') return renderEditProfile();
  if (view === 'admin') return renderAdmin();
  if (view === 'communities') return renderCommunities();
  renderFeed();
}

function updateClipTimeline(changedInput = '') {
  const video = document.querySelector('#video-preview video');
  const audio = document.querySelector('#audio-preview audio');
  const videoDuration = Number.isFinite(video?.duration) ? video.duration : 0;
  const audioDuration = Number.isFinite(audio?.duration) ? audio.duration : 0;
  const videoStart = document.querySelector('#clip-video-start');
  const videoEnd = document.querySelector('#clip-video-end');
  const audioStart = document.querySelector('#clip-audio-start');
  const audioEnd = document.querySelector('#clip-audio-end');
  const offset = document.querySelector('#audio-offset');
  const audioEditor = document.querySelector('#audio-editor');
  const message = document.querySelector('#clip-timing-message');
  const submit = document.querySelector('#upload-form button[type="submit"]');
  if (!videoStart || !videoEnd) return;

  videoStart.max = videoDuration ? videoDuration.toFixed(1) : '';
  videoEnd.max = videoDuration ? videoDuration.toFixed(1) : '';
  let start = Math.max(0, Number(videoStart.value) || 0);
  let end = Math.max(0, Number(videoEnd.value) || videoDuration || 0);
  if (videoDuration) {
    start = Math.min(start, videoDuration);
    end = Math.min(end, videoDuration);
    if (end <= start) {
      if (changedInput === 'clip-video-start') start = Math.max(0, end - 0.1);
      else end = Math.min(videoDuration, start + 0.1);
    }
    videoStart.value = start.toFixed(1);
    videoEnd.value = end.toFixed(1);
  }
  const clipDuration = Math.max(0, end - start);
  document.querySelector('#video-duration-label').textContent = videoDuration
    ? `${formatClipTime(start)} – ${formatClipTime(end)} / ${formatClipTime(videoDuration)} · seleção ${formatClipTime(clipDuration)}`
    : 'Selecione um vídeo';

  const videoBar = document.querySelector('#video-selection-bar');
  videoBar.style.left = `${videoDuration ? (start / videoDuration) * 100 : 0}%`;
  videoBar.style.width = `${videoDuration ? (clipDuration / videoDuration) * 100 : 0}%`;

  if (audioEditor && audioStart && audioEnd && offset) {
    audioEditor.hidden = !audio;
    let audioOffset = Math.max(0, Number(audioStart.value) || 0);
    const maxOffset = Math.max(0, audioDuration - clipDuration);
    offset.max = maxOffset.toFixed(1);
    audioStart.max = audioDuration.toFixed(1);
    audioEnd.max = audioDuration.toFixed(1);

    if (changedInput === 'clip-audio-end') {
      audioOffset = Math.max(0, (Number(audioEnd.value) || clipDuration) - clipDuration);
    }
    audioOffset = Math.min(audioOffset, maxOffset);
    offset.value = audioOffset.toFixed(1);
    audioStart.value = audioOffset.toFixed(1);
    audioEnd.value = Math.min(audioDuration, audioOffset + clipDuration).toFixed(1);

    const audioBar = document.querySelector('#audio-selection-bar');
    audioBar.style.left = `${audioDuration ? (audioOffset / audioDuration) * 100 : 0}%`;
    audioBar.style.width = `${audioDuration ? (clipDuration / audioDuration) * 100 : 0}%`;
    document.querySelector('#audio-duration-label').textContent = audioDuration
      ? `Janela ${formatClipTime(audioOffset)} – ${formatClipTime(audioOffset + clipDuration)} / ${formatClipTime(audioDuration)}`
      : 'Lendo duração da trilha';

    const tooShort = Boolean(audio && audioDuration && audioDuration + 0.05 < clipDuration);
    if (message) {
      message.classList.toggle('timing-error', tooShort);
      message.textContent = tooShort
        ? `A trilha (${formatClipTime(audioDuration)}) é menor que o vídeo selecionado (${formatClipTime(clipDuration)}). Escolha uma trilha mais longa ou reduza o trecho do vídeo.`
        : 'A janela selecionada terá a mesma duração do trecho de vídeo.';
    }
    if (submit) submit.disabled = tooShort || Boolean(audio && !audioDuration);
  }
}

function formatClipTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const remainder = (value % 60).toFixed(1).replace(/\.0$/, '');
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function openAuth(mode = 'login') {
  const dialog = document.querySelector('#auth-dialog');
  if (dialog.open) dialog.close();
  const title = mode === 'register' ? 'Criar conta' : 'Entrar na FanClips';

  dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><div><h2>${title}</h2><p>${mode === 'register' ? 'Junte-se à comunidade de criadores.' : 'Acesse seu perfil e seus clipes.'}</p></div><button class="icon-close" data-close="auth-dialog" aria-label="Fechar">×</button></div>
    <form id="auth-form">${mode === 'register' ? '<div class="field"><label for="auth-name">Nome</label><input id="auth-name" name="name" required minlength="2" maxlength="60" autocomplete="name"></div>' : ''}<div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" required maxlength="120" autocomplete="email"></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required minlength="6" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"></div>
    <button class="button button-primary">${mode === 'register' ? 'Criar conta' : 'Entrar'}</button></form><p class="dialog-note">${mode === 'register' ? 'Já tem conta?' : 'Ainda não tem conta?'} <button data-auth-mode="${mode === 'register' ? 'login' : 'register'}">${mode === 'register' ? 'Entrar' : 'Criar uma conta'}</button></p><div class="notice">Acesso de demonstração: <b>admin@fanclips.app</b> · senha: <b>admin123</b></div></div>`;
  dialog.showModal();
}

function openUpload() {
  if (!currentUser()) { openAuth(); return; }
  const dialog = document.querySelector('#upload-dialog');

  dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><div><h2>Criar Clip</h2><p>Escolha um vídeo, sua comunidade e a trilha que combina.</p></div><button class="icon-close" data-close="upload-dialog" aria-label="Fechar">×</button></div>
    <form id="upload-form">
  <div class="field"><label for="clip-file">Enviar arquivo de vídeo</label><input id="clip-file" name="file" type="file" accept="video/mp4,video/webm,video/quicktime"></div>
  <div id="video-preview" class="upload-preview" hidden></div>
  <div class="field"><label for="clip-tiktok">Ou link de vídeo do TikTok</label><input id="clip-tiktok" name="tiktokUrl" type="url" placeholder="https://www.tiktok.com/@criador/video/..."></div>
  
  <section class="clip-editor" aria-label="Corte do vídeo e seleção da trilha">
    <div class="clip-editor-heading"><strong>Trecho do vídeo</strong><span id="video-duration-label">Selecione um vídeo</span></div>
    <div class="clip-time-fields">
      <label>Início <input id="clip-video-start" name="videoStart" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>
      <label>Fim <input id="clip-video-end" name="videoEnd" type="number" min="0.1" step="0.1" value="30" inputmode="decimal"></label>
    </div>
    <div class="timeline-track video-timeline" aria-label="Trecho selecionado do vídeo"><span id="video-selection-bar"></span></div>
  </section>
  <section class="clip-editor audio-editor" id="audio-editor" hidden aria-label="Seleção do trecho da trilha">
    <div class="clip-editor-heading"><strong>Trecho da trilha</strong><span id="audio-duration-label">Selecione um áudio</span></div>
    <div class="clip-time-fields">
      <label>Início <input id="clip-audio-start" name="audioStart" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>
      <label>Fim <input id="clip-audio-end" name="audioEnd" type="number" min="0" step="0.1" value="0" inputmode="decimal"></label>
    </div>
    <div class="timeline-track audio-timeline" aria-label="Janela de áudio selecionada dentro da trilha"><span id="audio-selection-bar"></span></div>
    <input id="audio-offset" class="audio-offset" type="range" min="0" max="0" step="0.1" value="0" aria-label="Deslocar trecho selecionado na trilha">
    <p id="clip-timing-message" class="field-hint" aria-live="polite">A janela selecionada terá a mesma duração do trecho de vídeo.</p>
  </section>

  <div class="field"><label for="clip-title">Título do clip</label><input id="clip-title" name="title" required minlength="4" maxlength="80"></div>
  <div class="field"><label for="clip-description">Descrição</label><textarea id="clip-description" name="description" required minlength="10" maxlength="300"></textarea></div>
  <div class="field"><label for="clip-community">Comunidade</label><select id="clip-community" name="community" required><option value="">Escolha o fandom</option>${communities.map(item => `<option value="${item.id}">${item.name} · ${item.category}</option>`).join('')}<option value="other">Outro fandom</option></select></div>
  
  <div class="field">
    <label for="clip-audio">Enviar trilha sonora (opcional)</label>
    <input id="clip-audio" name="audio" type="file" accept=".mp3,.webm,audio/mpeg,audio/webm">
  </div>
  <div id="audio-preview" class="upload-preview" hidden></div>
  
  <button type="submit" class="button button-primary">Publicar clip</button>
</form></div>`;
  dialog.showModal();
}

function openDetail(id) {
  const clip = clipById(id); if (!clip) return;
  const dialog = document.querySelector('#detail-dialog'); if (dialog.open) dialog.close(); const comments = [...(clip.comments || []), ...(db.comments[id] || [])];

  dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><div><div class="eyebrow">${escapeHTML(clip.category)} · ${escapeHTML(clip.date)}</div></div><button class="icon-close" data-close="detail-dialog" aria-label="Fechar">×</button></div>
    <div class="detail-layout"><div><div class="detail-preview ${escapeHTML(clip.theme)}">${clip.tiktokUrl ? `<iframe src="https://www.tiktok.com/player/v1/${escapeHTML(clip.tiktokUrl.match(/\/video\/(\d+)/)?.[1] || '')}?autoplay=0" title="${escapeHTML(clip.title)}" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>` : clip.url ? `<video id="clip-player" src="${escapeHTML(clip.url)}" controls playsinline preload="metadata" aria-label="${escapeHTML(clip.title)}"></video>${clip.audioUrl ? `<audio id="clip-overlay-audio" src="${escapeHTML(clip.audioUrl)}" preload="auto"></audio>` : ''}` : `<span class="thumb-art">${escapeHTML(clip.art)}</span>`}<span class="duration">${escapeHTML(clip.duration)}</span></div><div class="detail-copy"><h2>${escapeHTML(clip.title)}</h2><div class="clip-meta"><span class="creator-dot">${initials(clip.creator)}</span><span>${escapeHTML(clip.creator)}</span><span>· ${clip.views.toLocaleString('pt-BR')} visualizações</span></div><p>${escapeHTML(clip.description)}</p><div class="detail-actions"><button class="button button-subtle" data-like="${clip.id}">${db.likes.includes(clip.id) ? '♥ Curtido' : '♡ Curtir'} · ${clip.likes.toLocaleString('pt-BR')}</button><button class="button button-quiet" data-watch="${clip.id}">${db.watched.includes(clip.id) ? '✓ Assistido' : '◷ Marcar assistido'}</button></div></div></div>
      <section class="comments"><h3>Comentários (${comments.length})</h3>${comments.length ? comments.map(c => `<p class="comment"><b>${escapeHTML(c.name)}</b>${escapeHTML(c.text)}</p>`).join('') : '<p class="comment">Seja a primeira pessoa a comentar.</p>'}<form class="comment-form" data-comment="${clip.id}"><input name="comment" maxlength="240" required placeholder="Escreva um comentário"><button class="button button-primary">Enviar</button></form></section></div></div>`;

  dialog.showModal();
  const video = dialog.querySelector('#clip-player');
  const overlayAudio = dialog.querySelector('#clip-overlay-audio');

  if (video && overlayAudio) {
    const vStart = Math.max(0, Number(clip.videoStart) || 0);
    const aStart = Math.max(0, Number(clip.audioStart) || 0);
    // Garantir que vEnd tenha um limite real matemático
    let vEnd = Number(clip.videoEnd) || Infinity;
    
    // Variável que impede o código de atrapalhar enquanto você arrasta a barra
    let isSeeking = false;

    // Apenas alinha o áudio se ele estiver muito fora de sincronia (> 0.2s)
    const forceSync = () => {
      if (overlayAudio.readyState < 1 || !Number.isFinite(overlayAudio.duration)) return;
      const elapsed = Math.max(0, video.currentTime - vStart);
      
      // O símbolo % (módulo) garante que se o vídeo for longo, o áudio reinicia perfeitamente
      const position = (aStart + elapsed) % overlayAudio.duration;
      
      if (Math.abs(overlayAudio.currentTime - position) > 0.2) {
        overlayAudio.currentTime = position;
      }
    };

    video.muted = true;
    overlayAudio.muted = false;
    overlayAudio.volume = 0.8;

    const initVideoBounds = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
      if (vEnd === Infinity || vEnd > duration) vEnd = duration;
      if (video.currentTime < vStart || video.currentTime > vEnd) {
        video.currentTime = vStart;
      }
    };
    
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) initVideoBounds();
    else video.addEventListener('loadedmetadata', initVideoBounds, { once: true });

    if (overlayAudio.readyState >= HTMLMediaElement.HAVE_METADATA) forceSync();
    else overlayAudio.addEventListener('loadedmetadata', forceSync, { once: true });

    video.addEventListener('play', () => {
      forceSync();
      overlayAudio.playbackRate = video.playbackRate;
      overlayAudio.play().catch(() => notify('Permita a reprodução de áudio.'));
    });
    
    video.addEventListener('pause', () => overlayAudio.pause());

    // Quando o usuário CLICA e começa a arrastar a barra
    video.addEventListener('seeking', () => {
      isSeeking = true;
    });

    // Quando o usuário SOLTA a barra
    video.addEventListener('seeked', () => {
      isSeeking = false;
      // Impede de arrastar pra fora do corte inicial
      if (video.currentTime < vStart) {
        video.currentTime = vStart;
        return; // Retorna pois o comando acima vai acionar outro 'seeked' naturalmente
      }
      // Impede de arrastar além do corte final
      if (video.currentTime > vEnd) {
        video.currentTime = vEnd - 0.1; 
        return;
      }
      // Se soltou dentro do limite certo, sincroniza o áudio!
      forceSync();
    });

    video.addEventListener('timeupdate', () => {
      if (isSeeking) return; // Deixa o usuário arrastar em paz sem bugar
      
      // Chegou no fim do corte, reseta pros tempos iniciais criando o "Loop" perfeito
      if (video.currentTime >= vEnd - 0.05) {
        video.currentTime = vStart;
        overlayAudio.currentTime = aStart % overlayAudio.duration;
        if (!video.paused) overlayAudio.play().catch(() => {});
      }
    });

    video.addEventListener('ratechange', () => { overlayAudio.playbackRate = video.playbackRate; });
  }

  if (!db.watched.includes(id)) { clip.views++; saveData(); }
}

function act(action) {
  if (action === 'upload') return openUpload();
  if (action === 'profile') return setView('profile');
  if (action === 'admin') return setView('admin');
  if (action === 'edit-profile') return setView('edit-profile');
  if (action === 'account') {
    if (currentUser()) {
      const dialog = document.querySelector('#auth-dialog');
      dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><div><h2>${escapeHTML(currentUser().name)}</h2><p>${escapeHTML(currentUser().email)}</p></div><button class="icon-close" data-close="auth-dialog" aria-label="Fechar">×</button></div><button class="button button-subtle" data-action="profile">Meu perfil</button>${currentUser().role === 'Admin' ? '<button class="button button-quiet" data-action="admin" style="margin-top:8px">Painel de gestão</button>' : ''}<button class="button button-quiet" data-action="logout" style="margin-top:8px">Sair da conta</button></div>`; dialog.showModal();
    } else openAuth();
  }
}

document.addEventListener('click', async event => {
  const target = event.target.closest('button,[data-open]'); if (!target) return;
  if (target.dataset.view) { community = ''; setView(target.dataset.view); return; }
  if (target.dataset.action) { if (target.dataset.action === 'logout') { db.user = null; saveData(); document.querySelector('#auth-dialog').close(); setView('feed'); notify('Você saiu da conta.'); } else act(target.dataset.action); return; }
  if (target.dataset.close) {
    if (target.dataset.close === 'detail-dialog') stopDetailMedia();
    document.querySelector(`#${target.dataset.close}`).close();
    return;
  }
  if (target.dataset.authMode) { openAuth(target.dataset.authMode); return; }
  if (target.dataset.open) { openDetail(target.dataset.open); return; }
  if (target.dataset.community) { community = target.dataset.community; category = ''; query = ''; document.querySelector('#search').value = ''; setView('feed'); return; }
  if (target.dataset.category !== undefined) { category = target.dataset.category; page = 1; render(); return; }
  if (target.dataset.page) { page = Number(target.dataset.page); render(); return; }
  if (target.dataset.adminTab) { adminTab = target.dataset.adminTab; render(); return; }
  if (target.dataset.profileTab) { profileTab = target.dataset.profileTab; render(); return; }
  if (target.dataset.creator) { document.querySelector('#search').value = target.dataset.creator; query = target.dataset.creator; setView('feed'); return; }
  if (target.dataset.approve) { const clip = clipById(target.dataset.approve); if (clip) { const serverId = clip.id.match(/^server-(\d+)$/)?.[1]; if (serverId) { try { const response = await fetch(`/api/clips/${serverId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrfToken() }, body: JSON.stringify({ status: 'Publicado' }) }); if (!response.ok) throw new Error('Não foi possível publicar o clipe no servidor.'); } catch (error) { notify(error.message); return; } } clip.status = 'Publicado'; clip.date = 'agora'; saveData(); render(); notify('Clipe aprovado e publicado.'); } return; }
  if (target.dataset.delete) { const clip = clipById(target.dataset.delete); if (clip && confirm(`Remover “${clip.title}” da plataforma?`)) { db.clips = db.clips.filter(item => item !== clip.id); saveData(); render(); notify('Clipe removido.'); } return; }
  if (target.dataset.watch) { const id = target.dataset.watch; db.watched.includes(id) ? db.watched = db.watched.filter(item => item !== id) : db.watched.push(id); saveData(); openDetail(id); return; }
  if (target.dataset.like) { if (!currentUser()) { openAuth(); return; } const id = target.dataset.like, clip = clipById(id); if (db.likes.includes(id)) { db.likes = db.likes.filter(item => item !== id); clip.likes--; } else { db.likes.push(id); clip.likes++; } saveData(); openDetail(id); return; }
});

document.querySelector('#detail-dialog').addEventListener('close', stopDetailMedia);

document.querySelector('#account-button').addEventListener('click', () => act('account'));
document.querySelector('#detail-dialog').addEventListener('close', stopDetailMedia);
document.querySelector('#search').addEventListener('input', event => { query = event.target.value; category = ''; community = ''; page = 1; if (view !== 'feed') view = 'feed'; render(); });

document.addEventListener('change', event => {
  if (event.target.id === 'clip-file') {
    const file = event.target.files?.[0], preview = document.querySelector('#video-preview');
    if (!preview) return;
    if (!file) { preview.hidden = true; updateClipTimeline(); return; }
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov)$/i.test(file.name)) { event.target.value = ''; notify('Escolha um arquivo MP4, WebM ou MOV.'); return; }
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file); preview.hidden = false;
    preview.innerHTML = `<video src="${previewObjectUrl}" controls muted playsinline></video><span>${escapeHTML(file.name)}</span>`;
    
    const video = preview.querySelector('video');
    video.addEventListener('loadedmetadata', () => {
      if (video.duration > 180) {
        event.target.value = ''; preview.hidden = true; URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = ''; notify('O clip precisa ter no máximo 3 minutos.');
      } else {
        const endInput = document.querySelector('#clip-video-end');
        if (endInput) {
          endInput.value = Math.min(Number(endInput.value) || video.duration, video.duration).toFixed(1);
          endInput.max = video.duration.toFixed(1);
        }
        updateClipTimeline();
      }
    });

    // NOVO: Prender a prévia do vídeo no tempo selecionado
    video.addEventListener('timeupdate', () => {
      const vStart = Number(document.querySelector('#clip-video-start')?.value) || 0;
      const vEnd = Number(document.querySelector('#clip-video-end')?.value) || video.duration;
      if (video.currentTime >= vEnd - 0.05) {
        video.currentTime = vStart;
        if (!video.paused) video.play().catch(()=>{});
      }
    });
    video.addEventListener('play', () => {
      const vStart = Number(document.querySelector('#clip-video-start')?.value) || 0;
      const vEnd = Number(document.querySelector('#clip-video-end')?.value) || video.duration;
      if (video.currentTime < vStart || video.currentTime >= vEnd) {
        video.currentTime = vStart;
      }
    });
  }

  if (event.target.id === 'clip-audio') {
    const file = event.target.files?.[0], preview = document.querySelector('#audio-preview');
    if (!preview) return;
    if (!file) { preview.hidden = true; preview.replaceChildren(); updateClipTimeline(); return; }
    if (!file.type.startsWith('audio/') && !/\.(mp3|webm)$/i.test(file.name)) { event.target.value = ''; notify('Escolha um arquivo MP3 ou WebM.'); return; }

    preview.hidden = false;
    preview.innerHTML = `<audio src="${URL.createObjectURL(file)}" controls></audio><span>${escapeHTML(file.name)}</span>`;
    const audioEl = preview.querySelector('audio');
    
    audioEl.addEventListener('loadedmetadata', () => updateClipTimeline());
    audioEl.addEventListener('error', () => {
      const message = document.querySelector('#clip-timing-message');
      if (message) { message.classList.add('timing-error'); message.textContent = 'Não foi possível ler a duração deste arquivo de áudio.'; }
      const submit = document.querySelector('#upload-form button[type="submit"]');
      if (submit) submit.disabled = true;
    });

    // NOVO: Prender a prévia do áudio no tempo selecionado
    audioEl.addEventListener('timeupdate', () => {
      const aStart = Number(document.querySelector('#clip-audio-start')?.value) || 0;
      const aEnd = Number(document.querySelector('#clip-audio-end')?.value) || audioEl.duration;
      if (audioEl.currentTime >= aEnd - 0.05) {
        audioEl.currentTime = aStart;
        if (!audioEl.paused) audioEl.play().catch(()=>{});
      }
    });
    audioEl.addEventListener('play', () => {
      const aStart = Number(document.querySelector('#clip-audio-start')?.value) || 0;
      const aEnd = Number(document.querySelector('#clip-audio-end')?.value) || audioEl.duration;
      if (audioEl.currentTime < aStart || audioEl.currentTime >= aEnd) {
        audioEl.currentTime = aStart;
      }
    });

    updateClipTimeline();
  }
});

document.addEventListener('input', event => {
  if (['clip-video-start', 'clip-video-end', 'clip-audio-start', 'clip-audio-end'].includes(event.target.id)) {
    updateClipTimeline(event.target.id);
  }
  if (event.target.id === 'audio-offset') {
    const audioStart = document.querySelector('#clip-audio-start');
    if (audioStart) audioStart.value = event.target.value;
    updateClipTimeline('clip-audio-start');
  }
});

document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); document.querySelector('#search').focus(); } if (event.key === 'Enter' && event.target.matches('[data-open]')) openDetail(event.target.dataset.open); });

document.addEventListener('submit', async event => {
  if (event.target.id === 'auth-form') {
    event.preventDefault(); const form = new FormData(event.target), email = String(form.get('email')).trim().toLowerCase(), password = String(form.get('password'));
    if (event.submitter && event.target.querySelector('#auth-name')) {
      if (db.users.some(user => user.email.toLowerCase() === email)) { notify('Esse e-mail já tem cadastro.'); return; }
      const user = { id: `u${Date.now()}`, name: String(form.get('name')).trim(), email, password, role: 'Usuário', joined: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) }; db.users.push(user); db.user = user; saveData(); document.querySelector('#auth-dialog').close(); render(); notify('Conta criada. Boas-vindas à FanClips!'); return;
    }
    const user = db.users.find(item => item.email.toLowerCase() === email);
    if (!user) { notify('Conta não encontrada. Crie uma conta para continuar.'); return; }
    if (user.password !== password) { notify('Senha incorreta.'); return; }
    db.user = user; saveData(); document.querySelector('#auth-dialog').close(); render(); notify(`Bem-vindo, ${user.name.split(' ')[0]}!`); return;
  }

  if (event.target.id === 'upload-form') {
    event.preventDefault(); const form = new FormData(event.target), user = currentUser();
    const file = event.target.querySelector('#clip-file').files?.[0];
    const audioFile = event.target.querySelector('#clip-audio')?.files?.[0];
    const tiktokUrl = String(form.get('tiktokUrl') || '').trim();

    if (!file && !tiktokUrl) { notify('Envie um vídeo ou informe um link do TikTok.'); return; }
    if (file && tiktokUrl) { notify('Escolha um arquivo ou um link do TikTok, não os dois.'); return; }
    if (tiktokUrl && audioFile) { notify('A trilha MP3 pode ser combinada apenas com um vídeo enviado.'); return; }
    if (tiktokUrl && !/^https:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/i.test(tiktokUrl)) { notify('Informe o link de um vídeo público do TikTok.'); return; }

    const selectedCommunity = communities.find(item => item.id === String(form.get('community')));
    const selectedVideo = event.target.querySelector('#video-preview video');
    const vStart = Number(form.get('videoStart')) || 0;
    const vEnd = Number(form.get('videoEnd')) || 30;
    const aStart = Number(form.get('audioStart')) || 0;
    const clipDuration = vEnd - vStart;
    const audioDuration = event.target.querySelector('#audio-preview audio')?.duration || 0;
    if (!Number.isFinite(clipDuration) || clipDuration <= 0) { notify('O fim do vídeo precisa ser maior que o início.'); return; }
    if (audioFile && (!audioDuration || audioDuration + 0.05 < clipDuration)) {
      notify('A trilha de áudio precisa ter pelo menos a duração do trecho de vídeo.');
      return;
    }
    const duration = `${Math.floor(clipDuration / 60)}:${String(Math.floor(clipDuration % 60)).padStart(2, '0')}`;
    const musicTitle = audioFile ? `Trilha personalizada · ${audioFile.name}` : 'Som original do vídeo';
    const musicId = audioFile ? 'custom-audio' : 'original-audio';

    const payload = new FormData();
    for (const key of ['title', 'description', 'community']) payload.append(key, String(form.get(key) || ''));

    payload.append('category', selectedCommunity?.category || 'Outros');
    payload.append('creator', user.name);
    payload.append('userId', String(user.id));
    payload.append('music', musicTitle);
    payload.append('musicId', musicId);
    payload.append('duration', duration);
    payload.append('videoStart', vStart);
    payload.append('videoEnd', vEnd);
    payload.append('audioStart', aStart);
    payload.append('audioEnd', Number(form.get('audioEnd')) || aStart + clipDuration);
    payload.append('art', selectedCommunity?.icon || '🎞️');
    payload.append('theme', ['thumb-field', 'thumb-ball', 'thumb-stage', 'thumb-road'][db.clips.length % 4]);

    if (file) payload.append('video', file);
    if (audioFile) payload.append('audio', audioFile);
    if (tiktokUrl) payload.append('tiktokUrl', tiktokUrl);

    try {
      const response = await fetch('/api/clips', { method: 'POST', headers: { 'X-XSRF-TOKEN': csrfToken() }, body: payload });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Não foi possível publicar o clip.');
      db.clips.unshift(result); saveData(); document.querySelector('#upload-dialog').close(); setView('profile'); notify('Clip enviado para revisão.');
    } catch (error) { notify(error.message || 'Não foi possível conectar ao servidor.'); }
    return;
  }

  if (event.target.id === 'profile-form') {
    event.preventDefault(); const form = new FormData(event.target), user = currentUser(), email = String(form.get('email')).trim().toLowerCase();
    if (db.users.some(item => item.id !== user.id && item.email.toLowerCase() === email)) { notify('Esse e-mail já está em uso.'); return; }
    user.name = String(form.get('name')).trim(); user.email = email; db.user = user; db.clips.filter(c => c.userId === user.id).forEach(c => c.creator = user.name); saveData(); setView('profile'); notify('Perfil atualizado.'); return;
  }

  if (event.target.matches('[data-comment]')) {
    event.preventDefault(); if (!currentUser()) { openAuth(); return; } const id = event.target.dataset.comment, textValue = String(new FormData(event.target).get('comment')).trim(); if (!textValue) return;
    (db.comments[id] ||= []).push({ name: currentUser().name, text: textValue }); saveData(); openDetail(id); return;
  }
});

async function initializeBackend() {
  try {
    const response = await fetch('/api/clips'); if (!response.ok) return;
    const serverClips = await response.json();
    // O servidor é a fonte de verdade para clipes persistidos; substitui versões antigas
    // guardadas no navegador e preserva apenas os clipes locais ainda não sincronizados.
    const localClips = db.clips.filter(clip => !String(clip.id).startsWith('server-'));
    db.clips = [...localClips, ...serverClips];
  } catch { }
}
initializeBackend().finally(render);
