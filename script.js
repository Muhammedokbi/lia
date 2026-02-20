// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const SCOL = { online: '#57F287', idle: '#FEE75C', dnd: '#ED4245', offline: '#747F8D' };
const STR = { online: 'Çevrimiçi', idle: 'Boşta', dnd: 'Rahatsız Etme', offline: 'Çevrimdışı' };
const LCOL = { JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', 'C++': '#f34b7d', C: '#555', Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', Ruby: '#701516', Swift: '#FA7343', Kotlin: '#A97BFF', Shell: '#89e051', Vue: '#41b883', 'C#': '#178600' };
const GH_USER = 'muhammedokbi';

function lc(l) { return LCOL[l] || '#F4621F'; }
function esc(s = '') { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function timeSince(str) { const s = (Date.now() - new Date(str)) / 1000; if (s < 3600) return ~~(s / 60) + 'dk önce'; if (s < 86400) return ~~(s / 3600) + 's önce'; if (s < 2592000) return ~~(s / 86400) + 'g önce'; if (s < 31536000) return ~~(s / 2592000) + 'ay önce'; return ~~(s / 31536000) + 'y önce'; }

// ═══════════════════════════════════════
// DISCORD CONFIG
// ═══════════════════════════════════════
const HARDCODED_DC_ID = ''; // Buraya Discord ID'ni girersen otomatik açılır

function getDiscordId() { return HARDCODED_DC_ID || localStorage.getItem('dc_uid') || ''; }
function setDiscordId(id) { localStorage.setItem('dc_uid', id); }

function showDiscordSetup() {
    const wrap = document.getElementById('dcWrapper');
    wrap.innerHTML = `
<div class="setup-card">
<div class="setup-title">⚡ Discord'u Bağla</div>
<div class="setup-steps">
  <div class="setup-step"><div class="step-num">1</div><div class="step-body"><div class="step-title">Lanyard Sunucusuna Katıl</div><div class="step-desc">Discord'da bu sunucuya katılman gerekiyor (ücretsiz)</div><a href="https://discord.gg/lanyard" target="_blank" style="display:inline-block;margin-top:6px;color:var(--or);font-size:11px;text-decoration:none;border:1px solid rgba(244,98,31,.3);padding:4px 12px;">discord.gg/lanyard →</a></div></div>
  <div class="setup-step"><div class="step-num">2</div><div class="step-body"><div class="step-title">ID'ni Bul ve Gir</div><div class="step-desc">Ayarlar -> Gelişmiş -> Geliştirici Modu'nu aç. Kendi profiline sağ tıkla -> Kullanıcı ID'sini Kopyala</div><div class="id-input-wrap"><input class="id-input" id="dcIdInput" type="text" placeholder="Örn: 387272192843137025" maxlength="20"/><button class="id-btn" onclick="connectDiscord()">Bağla</button></div></div></div>
</div>
</div>`;
}

function connectDiscord() {
    const val = document.getElementById('dcIdInput')?.value?.trim();
    if (!val || !/^\d{17,19}$/.test(val)) { alert('Geçerli bir Discord User ID gir'); return; }
    setDiscordId(val); loadDiscord(val);
}

async function loadDiscord(userId) {
    if (!userId) { showDiscordSetup(); return; }
    const wrap = document.getElementById('dcWrapper');
    wrap.innerHTML = `<div class="card"><div class="ld-txt">// api.lanyard.rest<span class="ldot"></span></div></div>`;
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'ID hatalı');
        renderDiscord(json.data);
        lanyardWS(userId);
    } catch (e) {
        wrap.innerHTML = `<div class="setup-card"><div class="setup-title" style="color:var(--or)">⚠ Bağlantı Hatası</div><div style="font-size:11px;color:var(--mu);margin-bottom:14px;">${esc(e.message)}</div><button class="id-btn" onclick="showDiscordSetup()">Tekrar Dene</button></div>`;
    }
}

function renderDiscord(d) {
    const wrap = document.getElementById('dcWrapper');
    const disc = d.discord_user;
    const status = d.discord_status;
    const acts = d.activities || [];
    const avUrl = disc.avatar ? `https://cdn.discordapp.com/avatars/${disc.id}/${disc.avatar}.${disc.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128` : null;
    const init = (disc.global_name || disc.username || 'O')[0].toUpperCase();
    const avHtml = avUrl ? `<img class="dc-av" src="${avUrl}" alt="">` : `<div class="dc-av-ph">${init}</div>`;

    const spotify = d.listening_to_spotify && d.spotify ? d.spotify : null;
    const playing = acts.find(a => a.type === 0);
    const custom = acts.find(a => a.type === 4);
    let actHtml = '';

    if (spotify) {
        const bars = Array.from({ length: 12 }, (_, i) => `<div class="wf-bar" style="animation-duration: ${0.5 + Math.random()}s"></div>`).join('');
        actHtml = `
      <div class="dc-act" style="border-left-color:#1DB954; background: rgba(29, 185, 84, 0.05);">
        <div class="at" style="color:#1DB954; display:flex; justify-content:space-between; align-items:center;">
          🎵 spotify 
          <div class="wf-wrap">${bars}</div>
        </div>
        <div class="an" style="font-weight:600;">${esc(spotify.song)}</div>
        <div class="ad">${esc(spotify.artist)}</div>
      </div>`;
    } else if (playing) {
        actHtml = `<div class="dc-act"><div class="at">🎮 playing</div><div class="an">${esc(playing.name)}</div>${playing.details ? `<div class="ad">${esc(playing.details)}</div>` : ''}</div>`;
    } else if (custom?.state) {
        actHtml = `<div class="dc-act"><div class="at">💬 status</div><div class="an">${esc((custom.emoji?.name || '') + ' ' + custom.state)}</div></div>`;
    }

    wrap.innerHTML = `
    <div class="dc-card-premium" onmousemove="this.style.setProperty('--x', event.offsetX + 'px'); this.style.setProperty('--y', event.offsetY + 'px')">
      <div class="dc-glow"></div>
      <button class="dc-follow-btn" onclick="const id = getDiscordId(); window.open(id ? 'https://discord.com/users/' + id : 'https://discord.com', '_blank')">Takip Et</button>
      <div class="dc-inner">
        <div class="dc-av-wrap">
          ${avHtml}
          <div class="dc-ring ${status !== 'offline' ? 'dc-ring-pulse' : ''}" style="background:${SCOL[status] || '#747F8D'}; box-shadow: 0 0 15px ${SCOL[status] || '#747F8D'}"></div>
        </div>
        <div class="dc-info">
          <div class="dc-names">
            <div class="dc-dn">${esc(disc.global_name || disc.username)}</div>
            <div class="dc-un" style="opacity:0.5;">@${esc(disc.username)}</div>
          </div>
          <div class="dc-stxt"><span style="color:${SCOL[status]}">${STR[status] || status}</span></div>
          ${actHtml}
        </div>
      </div>
    </div>`;
    document.getElementById('heroStatus').innerHTML = `Discord: <b style="color:${SCOL[status] || '#747F8D'}">${STR[status] || status}</b>`;
    renderMusicWidget(d);
}

function renderMusicWidget(d) {
    const el = document.getElementById('musicWidget'); if (!el) return;
    const spotify = d.listening_to_spotify && d.spotify ? d.spotify : null;
    const acts = d.activities || [];

    // Daha esnek YouTube Music tespiti
    const ytMusic = acts.find(a =>
        a.name === 'YouTube Music' ||
        a.name === 'YouTube' ||
        (a.type === 2 && a.name.includes('Music'))
    );

    // Debugging için Lanyard verilerini konsola yazdır
    console.log('Lanyard Music Data:', { spotify, ytMusic, activities: acts });

    const music = spotify || (ytMusic ? {
        song: ytMusic.details || ytMusic.state,
        artist: ytMusic.details ? ytMusic.state : 'YouTube Music',
        album_art_url: ytMusic.assets?.large_image ? (ytMusic.assets.large_image.startsWith('mp:external') ? ytMusic.assets.large_image.replace(/mp:external\/[^\/]*\//, 'https://') : `https://cdn.discordapp.com/app-assets/${ytMusic.application_id}/${ytMusic.assets.large_image}.png`) : null
    } : null);

    if (!music) {
        el.classList.remove('active');
        // İçerik kaldırıldığında varsayılan görünümü geri yükle
        el.innerHTML = `
      <div class="m-widget" style="opacity: 0.5; filter: grayscale(1);">
        <div class="m-art-wrap"><div class="dc-av-ph" style="border-radius:0; width:100%; height:100%;">♫</div></div>
        <div class="m-body">
          <div class="m-title">Müzik Çalmıyor</div>
          <div class="m-artist">@Limunlupasta</div>
        </div>
      </div>`;
        return;
    }

    const art = music.album_art_url || 'https://i.ibb.co/L8m6v9z/default-art.png';
    const progress = spotify ? ((Date.now() - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start) * 100) : 0;

    el.innerHTML = `
    <div class="m-widget-inner">
      <div class="m-art-wrap">
        <img class="m-art" src="${art}" alt="Album Art">
      </div>
      <div class="m-body">
        <div class="m-title">${esc(music.song)}</div>
        <div class="m-artist">${esc(music.artist)}</div>
        <div class="m-progress-bg">
          <div class="m-progress-fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
        </div>
        <div class="m-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          Müzik Dinliyor
        </div>
      </div>
    </div>`;

    // İçerik yüklendikten sonra göster (yumuşak geçiş)
    setTimeout(() => el.classList.add('active'), 50);
}

let lws, lhb;
function lanyardWS(userId) {
    if (lws) try { lws.close(); } catch (e) { }
    lws = new WebSocket('wss://api.lanyard.rest/socket');
    lws.onopen = () => lws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
    lws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.op === 1) { clearInterval(lhb); lhb = setInterval(() => lws.readyState === 1 && lws.send(JSON.stringify({ op: 3 })), m.d.heartbeat_interval); }
        if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) renderDiscord(m.d);
    };
    lws.onclose = () => setTimeout(() => lanyardWS(userId), 7000);
}

// ═══════════════════════════════════════
// GITHUB
// ═══════════════════════════════════════
let ghData = {};
async function loadGithub() {
    const card = document.getElementById('ghCard');
    try {
        const [uR, rR, eR] = await Promise.all([
            fetch(`https://api.github.com/users/${GH_USER}`),
            fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`),
            fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=100`)
        ]);
        if (!uR.ok) throw new Error('GitHub bulunamadı.');
        const user = await uR.json();
        const repos = rR.ok ? await rR.json() : [];
        const evts = eR.ok ? await eR.json() : [];
        ghData = { user, repos, evts };

        const lmap = {};
        repos.forEach(r => { if (r.language) lmap[r.language] = (lmap[r.language] || 0) + 1; });
        const langs = Object.entries(lmap).sort((a, b) => b[1] - a[1]).slice(0, 7);
        const ltot = langs.reduce((s, [, v]) => s + v, 0);
        const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        const pushes = evts.filter(e => e.type === 'PushEvent');
        const commits = pushes.reduce((s, e) => s + (e.payload?.commits?.length || 0), 0);
        const cmap = {};
        pushes.forEach(e => { const d = e.created_at?.slice(0, 10); if (d) cmap[d] = (cmap[d] || 0) + (e.payload?.commits?.length || 1); });

        const lbarHtml = langs.map(([l, c]) => `<div class="lseg" style="flex:${(c / ltot * 100).toFixed(1)};background:${lc(l)}" title="${l}"></div>`).join('');
        const llistHtml = langs.map(([l, c]) => `<div class="li"><div class="ld" style="background:${lc(l)}"></div><span>${l}</span> ${(c / ltot * 100).toFixed(0)}%</div>`).join('');

        const skillsTable = `
  <div style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.2); border:1px solid var(--bdr); border-radius:8px; display:flex; justify-content:center;">
    <table border="0" style="border-collapse:collapse; width:100%;">
      <tr>
        <td align="center" style="padding:10px;"><img src="https://skillicons.dev/icons?i=cpp,cs,py,linux,vscode,git,tensorflow" alt="Skills 1" style="max-width:100%; height:auto;" /></td>
        <td align="center" style="padding:10px;"><img src="./Fenerbahçe_SK.png" height="48" alt="Fenerbahçe" style="filter: drop-shadow(0 0 8px rgba(232,216,75,0.3));" /></td>
        <td align="center" style="padding:10px;"><img src="https://skillicons.dev/icons?i=pytorch,arduino,opencv,flutter,dart,ubuntu,arch" alt="Skills 2" style="max-width:100%; height:auto;" /></td>
      </tr>
    </table>
  </div>`;

        card.innerHTML = `<div class="gh-top"><div class="gh-user"><img class="gh-av" src="${user.avatar_url}" alt=""><div><div class="gh-un">${esc(user.login)}</div><div class="gh-bio">${esc(user.bio || 'Software Developer')}</div></div></div><div class="gh-stats"><div class="gh-stat"><div class="gh-sval">${user.public_repos}</div><div class="gh-slbl">Repo</div></div><div class="gh-stat"><div class="gh-sval">${stars}</div><div class="gh-slbl">Yıldız</div></div><div class="gh-stat"><div class="gh-sval">${user.followers}</div><div class="gh-slbl">Takipçi</div></div><div class="gh-stat"><div class="gh-sval">${commits}</div><div class="gh-slbl">Commit</div></div></div></div><div class="cgrid" id="cgrid"></div><div class="cleg"><span>az</span><div class="lc"></div><div class="lc" style="background:rgba(244,98,31,.2)"></div><div class="lc" style="background:rgba(244,98,31,.45)"></div><div class="lc" style="background:var(--or)"></div><div class="lc" style="background:var(--lem)"></div><span>çok</span></div><div class="lbar">${lbarHtml}</div><div class="llist">${llistHtml}</div>${skillsTable}`;
        renderContrib(cmap);
    } catch (e) { card.innerHTML = `<div class="errmsg">// GitHub Hatası: ${esc(e.message)}</div>`; }
}

function renderContrib(data) {
    const el = document.getElementById('cgrid'); if (!el) return;
    el.innerHTML = ''; const COLS = window.innerWidth < 580 ? 26 : 52; el.style.gridTemplateColumns = `repeat(${COLS},1fr)`; if (window.innerWidth < 580) el.style.height = '38px';
    const now = new Date(), total = COLS * 7;
    for (let i = total - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10);
        let n = data[key] || 0;

        // Simüle edilmiş "aktiflik" görünümü (ilk günden beri dolu gözükmesi için)
        // Eğer gerçek veri yoksa, çok düşük bir ihtimalle veya sabit bir düşük seviyeyle boya
        const c = document.createElement('div');
        c.className = 'cc';

        if (n === 0) {
            c.classList.add('empty');
        } else if (n === 1) {
            c.classList.add('v1');
        } else if (n <= 3) {
            c.classList.add('v2');
        } else if (n <= 6) {
            c.classList.add('v3');
        } else if (n <= 10) {
            c.classList.add('v4');
        } else if (n > 10) {
            c.classList.add('vy');
        }

        if (n > 0) c.title = `${key}: ${n} commit`;
        el.appendChild(c);
    }
}

// ═══════════════════════════════════════
// TERMINAL
// ═══════════════════════════════════════
let termHist = [], termHIdx = -1;
const ASCII = `  ██████╗ ██╗  ██╗██████╗ ██╗\n ██╔═══██╗██║ ██╔╝██╔══██╗██║\n ██║   ██║█████╔╝ ██████╔╝██║\n ██║   ██║██╔═██╗ ██╔══██╗██║\n ╚██████╔╝██║  ██╗██████╔╝██║\n  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝`;

function prompt() { return `<span class="t-user">okbi</span><span class="t-dim">@</span><span class="t-host">ubuntu</span><span class="t-dim">:</span><span class="t-path">~</span><span class="t-dim">$</span> `; }
function addLine(html) {
    const tb = document.getElementById('termBody'); if (!tb) return;
    const inputRow = document.getElementById('termInputRow');
    const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = html;
    if (inputRow) tb.insertBefore(d, inputRow); else tb.appendChild(d);
    tb.scrollTop = tb.scrollHeight;
}
function addPrompt(cmd) { addLine(`${prompt()}<span class="t-cmd">${esc(cmd)}</span>`); }

async function runCmd(cmd) {
    const c = cmd.trim().toLowerCase(); if (!c) return;
    termHist.unshift(cmd); termHIdx = -1; addPrompt(cmd);
    switch (c) {
        case 'help': addLine(`<span class="t-sec">Komutlar:</span>\n  <span class="t-key">whoami</span>    <span class="t-dim">— kim benim</span>\n  <span class="t-key">github</span>    <span class="t-dim">— istatistikler</span>\n  <span class="t-key">projects</span>  <span class="t-dim">— projeler</span>\n  <span class="t-key">skills</span>    <span class="t-dim">— tech stack</span>\n  <span class="t-key">contact</span>   <span class="t-dim">— iletişim</span>\n  <span class="t-key">ai [soru]</span> <span class="t-dim">— asistan cevabı</span>\n  <span class="t-key">clear</span>     <span class="t-dim">— temizle</span>\n  <span class="t-key">exit</span>      <span class="t-dim">— kapat</span>`); break;
        case 'whoami': addLine(`<span class="t-sec">About:</span>\n  <span class="t-key">name</span>    <span class="t-val">Muhammed Okbi</span>\n  <span class="t-key">alias</span>   <span class="t-val">okbi</span>\n  <span class="t-key">role</span>    <span class="t-val">Software Developer</span>\n  <span class="t-key">os</span>      <span class="t-val">Ubuntu 22.04 LTS</span>\n  <span class="t-key">editor</span>  <span class="t-val">VS Code</span>`); break;
        case 'github': {
            if (ghData.user) {
                const u = ghData.user; const s = ghData.repos?.reduce((s, r) => s + (r.stargazers_count || 0), 0) || 0;
                addLine(`<span class="t-sec">GitHub:</span>\n  <span class="t-key">user</span>     <span class="t-val">${esc(u.login)}</span>\n  <span class="t-key">repos</span>    <span class="t-val">${u.public_repos}</span>\n  <span class="t-key">stars</span>    <span class="t-lem">${s}</span>\n  <span class="t-key">url</span>      <span class="t-link" onclick="window.open('https://github.com/${GH_USER}','_blank')">github.com/${GH_USER}</span>`);
            } else addLine(`<span class="t-err">// Veri yok</span>`); break;
        }
        case 'projects': {
            if (ghData.repos?.length) {
                const top = [...ghData.repos].filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
                let out = `<span class="t-sec">Projeler:</span>\n`;
                top.forEach((r, i) => out += `  <span class="t-dim">${i + 1}.</span> <span class="t-val t-link" onclick="window.open('${r.html_url}','_blank')">${esc(r.name)}</span> <span class="t-dim">[${esc(r.language || '—')}]</span>\n`);
                addLine(out);
            } else addLine(`<span class="t-err">// Veri yok</span>`); break;
        }
        case 'skills': addLine(`<span class="t-sec">Tech Stack:</span>\n  <span class="t-val">JS</span>  <span class="t-val">TS</span>  <span class="t-val">Python</span>  <span class="t-val">C#</span>  <span class="t-val">C++</span>  <span class="t-val">React</span>  <span class="t-val">Git</span>  <span class="t-val">Docker</span>`); break;
        case 'contact': addLine(`<span class="t-sec">İletişim:</span>\n  <span class="t-key">github</span>     <span class="t-link" onclick="window.open('https://github.com/${GH_USER}','_blank')">github.com/${GH_USER}</span>\n  <span class="t-key">instagram</span>  <span class="t-link" onclick="window.open('https://instagram.com/muhammedokbii','_blank')">@muhammedokbii</span>`); break;
        case 'ai': handleAI(cmd.slice(3).trim()); return;
        case 'clear': document.getElementById('termBody').innerHTML = ''; initTerm(); return;
        case 'exit': closeTerm(); return;
        default: addLine(`<span class="t-err">${esc(cmd)}: komut yok</span>`);
    }
}

function initTerm() {
    const tb = document.getElementById('termBody'); if (!tb) return;
    tb.innerHTML = `<pre class="ascii">${ASCII}</pre><span class="term-line"><span class="t-val t-bold">okbi@ubuntu</span> <span class="t-dim">— Dashboard Terminal</span></span><span class="term-line t-dim">'help' yazarak başla</span><br><div class="term-input-row" id="termInputRow">${prompt()}<input class="term-input" id="termInput" autocomplete="off" spellcheck="false"></div>`;
    setTimeout(() => document.getElementById('termInput')?.focus(), 50);
    const inp = document.getElementById('termInput');
    if (inp) {
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { const v = inp.value; inp.value = ''; runCmd(v); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (termHIdx < termHist.length - 1) { termHIdx++; inp.value = termHist[termHIdx]; } }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (termHIdx > 0) { termHIdx--; inp.value = termHist[termHIdx]; } else { termHIdx = -1; inp.value = ''; } }
        });
    }
}
function openTerm() { document.getElementById('termOverlay').classList.add('open'); initTerm(); }
function closeTerm() { document.getElementById('termOverlay').classList.remove('open'); }

async function handleAI(q) {
    if (!q) { addLine(`<span class="t-ai">Assistant:</span> <span class="t-ai-msg">Selam! Benimle 'ai [soru]' yazarak konuşabilirsin. Örneğin: 'ai okbi kim?'</span>`); return; }

    const loading = document.createElement('div');
    loading.className = 'term-line';
    loading.innerHTML = `<span class="t-ai">Assistant:</span> <span class="t-ai-msg">düşünüyor</span><span class="ai-dots"></span>`;
    const tb = document.getElementById('termBody');
    const inputRow = document.getElementById('termInputRow');
    tb.insertBefore(loading, inputRow);
    tb.scrollTop = tb.scrollHeight;

    // Yapay zeka simülasyonu
    await new Promise(r => setTimeout(r, 1200));
    loading.remove();

    let resp = "Üzgünüm, bunu tam anlayamadım. Ama okbi'nin projeleri veya yetenekleri hakkında konuşabiliriz!";
    const low = q.toLowerCase();

    if (low.includes('kim')) {
        resp = "okbi (Muhammed Okbi), yazılım dünyasında fırtınalar estiren, Ubuntu aşığı bir Software Developer! Genellikle C++, Python ve C# ile haşır neşir olur.";
    } else if (low.includes('proje')) {
        resp = "Birçok havalı projesi var! 'projects' komutunu yazarak GitHub'daki en gözde 5 projesine hemen göz atabilirsin.";
    } else if (low.includes('yetenek') || low.includes('tech') || low.includes('dil')) {
        resp = "Tech stack'i oldukça geniş: C++, C#, Python, React ve daha fazlası. Tam listeyi 'skills' komutuyla görebilirsin.";
    } else if (low.includes('selam') || low.includes('merhaba')) {
        resp = "Selam! Ben okbi'nin kişisel terminal asistanıyım. Sana nasıl yardımcı olabilirim?";
    } else if (low.includes('nasıl')) {
        resp = "Harikayım! Senin için terminalde koşturup duruyorum. Sen nasılsın?";
    } else if (low.includes('thegaca')) {
        resp = "TheGaca, okbi'nin de içinde bulunduğu elit bir geliştirici takımı! GitHub linkine hero bölümünden ulaşabilirsin.";
    }

    addLine(`<span class="t-ai">Assistant:</span> <span class="t-ai-msg">${resp}</span>`);
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const savedId = getDiscordId();
    if (savedId) loadDiscord(savedId); else showDiscordSetup();
    loadGithub();
});
