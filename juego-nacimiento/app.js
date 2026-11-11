/* Juego bíblico: el nacimiento de Jesucristo · Templo Bíblico Emmanuel */
(function () {
  'use strict';
  const D = window.DATOS;
  const KEY = 'tbe-nacimiento-v2';
  const PASOS = [
    ['video', 'Cápsula'], ['lectura', 'Lectura'], ['devocional', 'Devocional'],
    ['juego', 'Juego'], ['memoriza', 'Memoriza'], ['expresa', 'Expresa'], ['fin', 'Resultado'],
  ];
  const $app = document.getElementById('app');

  /* ---------- estado ---------- */
  let S = { grupo: 'jovenes-adultos', progreso: {}, notas: {} };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) S = Object.assign(S, s); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const barajar = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ ]/g, '').trim();
  const grupo = () => D.grupos[S.grupo];
  const todos = (g = grupo()) => g.bloques.flatMap((b) => b.niveles.map((n) => Object.assign(n, { bloque: b })));
  const estrellas = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ---------- mapas ---------- */
  function proj(m, lon, lat) {
    const r = Math.PI / 180, yv = (p) => Math.log(Math.tan(Math.PI / 4 + (p * r) / 2));
    return [m.W / 2 + m.scale * (lon - m.center[0]) * r - m.x0, m.H / 2 - m.scale * (yv(lat) - yv(m.center[1])) - m.y0];
  }
  function km(a, b) {
    const r = Math.PI / 180, R = 6371;
    const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /** Devuelve un elemento .mapa con puntos; opts: {puntos:[nombres], ruta:[a,b], onTap(nombre, g)} */
  /** Mapa 2D interactivo: arrastrar, pellizcar o rueda para acercar, botones ＋ − ⟲,
   *  cámara que se ajusta a los puntos, ruta curva animada y viajero que la recorre.
   *  opts: {puntos:[nombres], ruta:[a,b], desde:'este'|'cerca', hacia:'este', icono:'🫏', onTap(nombre,g), enfoque:[nombres]} */
  let mapaN = 0;
  function mapa(clave, opts) {
    const m = D.mapas[clave], uid = 'm' + (++mapaN);
    const u = m.w / 55, fs = m.w / 21;
    const P = (n) => { const L = D.lugares[n]; const [x, y] = proj(m, L.lon, L.lat); return { n, x, y }; };
    const pts = (opts.puntos || []).map(P);
    // ruta (curva) con salida o llegada aproximada cuando el texto no da el lugar
    let A = opts.ruta && opts.ruta[0] ? P(opts.ruta[0]) : null, B = opts.ruta && opts.ruta[1] ? P(opts.ruta[1]) : null;
    const lejos = (p, k) => ({ x: Math.min(m.w * 0.97, p.x + m.w * 0.33 * k), y: p.y - m.h * 0.06 * k });
    if (!A && B && opts.desde) A = opts.desde === 'cerca' ? { x: B.x + u * 5, y: B.y + u * 4 } : lejos(B, 1);
    if (A && !B && opts.hacia) B = lejos(A, 1);
    let rutaSVG = '', viajero = '', destino = '';
    if (A && B) {
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const cx = (A.x + B.x) / 2 - (dy / L) * L * 0.22, cy = (A.y + B.y) / 2 + (dx / L) * L * 0.22;
      const d = `M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`;
      rutaSVG = `<path d="${d}" fill="none" stroke="#3a2814" stroke-opacity=".35" stroke-width="${u * 1.1}" stroke-linecap="round" transform="translate(${u * .25} ${u * .35})"/>
        <path d="${d}" fill="none" stroke="#fff3d0" stroke-width="${u * 1.15}" stroke-linecap="round"/>
        <path id="${uid}r" class="ruta-linea" d="${d}" fill="none" stroke="#a3281b" stroke-width="${u * .7}" stroke-linecap="round" pathLength="1" style="stroke-dasharray:1 1.2;stroke-dashoffset:1.1"/>`;
      viajero = `<g><g class="esc"><text x="0" y="0" text-anchor="middle" font-size="${fs * 1.6}" style="filter:drop-shadow(0 ${u * .2}px ${u * .25}px rgba(0,0,0,.5))">${opts.icono || '🚶'}</text></g>
        <animateMotion dur="2.6s" begin="0.3s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 0 .55 1"><mpath href="#${uid}r"/></animateMotion></g>`;
      destino = `<circle class="pulso" cx="${B.x}" cy="${B.y}" r="${u * 2.2}" fill="none" stroke="#a3281b" stroke-width="${u * .45}"/>`;
    }
    const etiquetas = (m.etiquetas || []).map(([t, lon, lat]) => {
      const [x, y] = proj(m, lon, lat), mar = /^(Mar|Río)/.test(t);
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="${fs * (mar ? 0.8 : 0.9)}" letter-spacing="${mar ? 0 : fs * 0.15}" fill="${mar ? '#2f5668' : '#5b3e1d'}" fill-opacity=".75">${esc(t)}</text>`;
    }).join('');
    // alfiler con relieve: sombra, cuerpo con degradado y brillo
    const marcas = pts.map((p) => {
      const lab = (D.lugares[p.n].lab) || (p.x > m.w * 0.62 ? 'izq' : 'der'), izq = lab === 'izq', s = u * 1.5;
      return `<g class="pt" data-n="${esc(p.n)}" transform="translate(${p.x} ${p.y})"><g class="esc">
        <ellipse cx="0" cy="0" rx="${s * .9}" ry="${s * .32}" fill="rgba(40,20,5,.35)"/>
        <path d="M0,0 C${-s * .25},${-s * .9} ${-s},${-s * 1.3} ${-s},${-s * 2.1} A${s},${s} 0 1 1 ${s},${-s * 2.1} C${s},${-s * 1.3} ${s * .25},${-s * .9} 0,0Z" fill="url(#${uid}g)" stroke="#5a1309" stroke-width="${u * .18}"/>
        <circle class="nucleo" cx="0" cy="${-s * 2.1}" r="${s * .42}" fill="#fff6dc"/>
        <text x="${izq ? -s * 1.35 : s * 1.35}" y="${-s * 1.75}" text-anchor="${izq ? 'end' : 'start'}" font-family="Georgia,serif" font-weight="700" font-size="${fs}" fill="#2f1e0a" stroke="#fff3d0" stroke-width="${fs * 0.24}" paint-order="stroke">${esc(p.n.trim())}</text>
      </g></g>`;
    }).join('');
    const caja = el(`<div class="mapa-caja"><div class="mapa" style="aspect-ratio:${m.imgW}/${m.imgH}"><div class="mundo">
      <img src="${m.img}" alt="Mapa ${clave === 'H' ? 'de Tierra Santa' : 'de la región'}" width="${m.imgW}" height="${m.imgH}" draggable="false">
      <svg viewBox="0 0 ${m.w} ${m.h}" preserveAspectRatio="none" role="img" aria-label="Mapa con lugares"><defs>
        <radialGradient id="${uid}g" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#ff8a6a"/><stop offset=".5" stop-color="#c0311c"/><stop offset="1" stop-color="#6e170b"/></radialGradient></defs>
        ${etiquetas}${rutaSVG}${destino}${marcas}${viajero}</svg></div></div>
      <div class="ctrl"><span class="pista">✋ Arrastra · 🤏 pellizca para acercar</span><button class="zmas" aria-label="Acercar">＋</button><button class="zmenos" aria-label="Alejar">−</button><button class="zcentro" aria-label="Volver a centrar">⟲</button></div></div>`);
    const node = caja.querySelector('.mapa');
    const mundo = node.querySelector('.mundo'), svg = node.querySelector('svg');
    let cam = { s: 1, tx: 0, ty: 0 };
    const tam = () => ({ W: node.clientWidth, H: node.clientHeight });
    const limitar = () => { const { W, H } = tam(); cam.s = Math.max(1, Math.min(6, cam.s)); cam.tx = Math.min(0, Math.max(W - W * cam.s, cam.tx)); cam.ty = Math.min(0, Math.max(H - H * cam.s, cam.ty)); };
    const aplicar = (anim) => { limitar(); mundo.classList.toggle('anim', !!anim); mundo.style.transform = `translate(${cam.tx}px,${cam.ty}px) scale(${cam.s})`; mundo.style.setProperty('--k', String(1 / Math.sqrt(cam.s))); };
    const enfocar = (anim) => {
      const lista = (opts.enfoque ? opts.enfoque.map(P) : [A, B].filter(Boolean));
      const { W, H } = tam(); if (!W) return;
      if (!lista.length) { cam = { s: 1, tx: 0, ty: 0 }; return aplicar(anim); }
      const k = W / m.w, xs = lista.map((p) => p.x * k), ys = lista.map((p) => p.y * k);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const bw = Math.max(x1 - x0, W * 0.18), bh = Math.max(y1 - y0, H * 0.18);
      const s = Math.min(W / (bw * 1.9), H / (bh * 1.9), 4);
      cam = { s, tx: W / 2 - ((x0 + x1) / 2) * s, ty: H / 2 - ((y0 + y1) / 2 + H * 0.04) * s };
      aplicar(anim);
    };
    const zoomEn = (f, cx, cy) => { const { W, H } = tam(); cx = cx ?? W / 2; cy = cy ?? H / 2; const s2 = Math.max(1, Math.min(6, cam.s * f)); cam.tx = cx - (cx - cam.tx) * (s2 / cam.s); cam.ty = cy - (cy - cam.ty) * (s2 / cam.s); cam.s = s2; aplicar(true); };
    caja.querySelector('.zmas').onclick = () => zoomEn(1.5);
    caja.querySelector('.zmenos').onclick = () => zoomEn(1 / 1.5);
    caja.querySelector('.zcentro').onclick = () => enfocar(true);
    // gestos: arrastrar, pellizcar y rueda
    const ptrs = new Map(); let movido = 0, ini = null;
    node.addEventListener('pointerdown', (e) => { node.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = 0; ini = { ...cam }; mundo.classList.remove('anim'); });
    node.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId); const now = { x: e.clientX, y: e.clientY };
      if (ptrs.size === 1) { cam.tx += now.x - prev.x; cam.ty += now.y - prev.y; movido += Math.abs(now.x - prev.x) + Math.abs(now.y - prev.y); aplicar(false); }
      else if (ptrs.size === 2) {
        const [o] = [...ptrs.entries()].filter(([id]) => id !== e.pointerId).map(([, v]) => v);
        const d0 = Math.hypot(prev.x - o.x, prev.y - o.y), d1 = Math.hypot(now.x - o.x, now.y - o.y);
        const r = node.getBoundingClientRect();
        if (d0 > 0) { const f = d1 / d0, cx = (now.x + o.x) / 2 - r.left, cy = (now.y + o.y) / 2 - r.top; const s2 = Math.max(1, Math.min(6, cam.s * f)); cam.tx = cx - (cx - cam.tx) * (s2 / cam.s); cam.ty = cy - (cy - cam.ty) * (s2 / cam.s); cam.s = s2; aplicar(false); }
        movido += 50;
      }
      ptrs.set(e.pointerId, now);
    });
    const soltar = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const unico = ptrs.size === 1; ptrs.delete(e.pointerId);
      if (unico && movido < 8 && opts.onTap && e.type === 'pointerup') {
        // toque: elegir el lugar más cercano (Belén y Jerusalén están a ≈9 km)
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const q = pt.matrixTransform(svg.getScreenCTM().inverse());
        let best = null, bd = Infinity;
        pts.forEach((p) => { const d = Math.hypot(p.x - q.x, (p.y - u * 3 * (1 / Math.sqrt(cam.s))) - q.y); if (d < bd) { bd = d; best = p; } });
        if (best && bd < u * 9 / Math.sqrt(cam.s)) opts.onTap(best.n, svg.querySelector(`.pt[data-n="${CSS.escape(best.n)}"]`));
      }
    };
    node.addEventListener('pointerup', soltar); node.addEventListener('pointercancel', soltar);
    node.addEventListener('wheel', (e) => { e.preventDefault(); const r = node.getBoundingClientRect(); zoomEn(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    // ajustar la cámara cuando el mapa ya tiene tamaño en pantalla
    const ro = new ResizeObserver(() => { if (node.clientWidth) { enfocar(false); ro.disconnect(); } });
    ro.observe(node);
    return caja;
  }

  /* ---------- navegación ---------- */
  const tabs = document.getElementById('tabs');
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ir(b.dataset.tab); });
  function marcarTab(t) { tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); }
  const VISTAS = { inicio, niveles, ruta, mapa: mapaTab, notas, nivel };
  const urlDe = (tab, arg) => location.href.split('#')[0] + '#' + tab + (arg ? '/' + arg : '');
  function ir(tab, arg, push = true) {
    if (!VISTAS[tab] || (tab === 'nivel' && !todos().some((n) => n.id === arg))) { tab = 'inicio'; arg = null; }
    cerrarModal();
    marcarTab(tab === 'nivel' ? 'niveles' : tab);
    VISTAS[tab](arg);
    try { if (push) history.pushState({ tab, arg }, '', urlDe(tab, arg)); } catch (e) {}
    top();
  }
  // Botón "atrás" del celular o del navegador
  window.addEventListener('popstate', (e) => {
    if (modalAbierto) { cerrarModal(); return; }
    const st = (e.state && e.state.tab) ? e.state : leerHash();
    ir(st.tab, st.arg, false);
  });
  function leerHash() { const [tab, arg] = location.hash.replace('#', '').split('/'); return { tab: tab || 'inicio', arg: arg ? decodeURIComponent(arg) : null }; }

  /** Barra de navegación superior de cada sección: Volver + ruta + Inicio. */
  function migas(partes, salir) {
    const n = el(`<nav class="migas" aria-label="Navegación"><button class="volver" aria-label="Volver">←</button>
      <span class="ruta-migas">${partes.map(esc).join(' › ')}</span>
      ${salir ? '<button class="salir">✕ Salir</button>' : ''}<button class="casa" aria-label="Ir al inicio">🏠</button></nav>`);
    n.querySelector('.volver').onclick = () => { if (history.state && history.state.tab && history.length > 1) history.back(); else ir('inicio'); };
    n.querySelector('.casa').onclick = () => ir('inicio');
    if (salir) n.querySelector('.salir').onclick = salir;
    return n;
  }

  /* ---------- ventana a pantalla completa (mapas) ---------- */
  let modalAbierto = null;
  function abrirModal(titulo, contenido) {
    cerrarModal();
    const m = el(`<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><div class="modal-top"><b>${esc(titulo)}</b>
      <button class="primary" id="cerrarModal">✕ Cerrar</button></div><div class="modal-cuerpo"></div></div>`);
    m.querySelector('.modal-cuerpo').append(contenido);
    m.querySelector('#cerrarModal').onclick = () => history.back();
    document.body.append(m); document.body.classList.add('con-modal'); modalAbierto = m;
    try { history.pushState({ modal: true }, '', location.href); } catch (e) {}
    m.querySelector('#cerrarModal').focus();
  }
  function cerrarModal() { if (modalAbierto) { modalAbierto.remove(); modalAbierto = null; document.body.classList.remove('con-modal'); } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalAbierto) history.back(); });
  function botonAmpliar(clave, opts, titulo) {
    const b = el(`<button class="ampliar">🔍 Ampliar mapa</button>`);
    b.onclick = () => abrirModal(titulo || 'Mapa', mapa(clave, Object.assign({}, opts, { onTap: null })));
    return b;
  }

  /* ---------- botón para subir ---------- */
  const subir = el(`<button class="subir hidden" aria-label="Volver arriba">↑</button>`);
  document.body.append(subir);
  subir.onclick = () => top();
  window.addEventListener('scroll', () => subir.classList.toggle('hidden', window.scrollY < 500), { passive: true });

  function selectorGrupo() {
    const n = el(`<div class="seg" role="group" aria-label="Grupo de edad">
      <button data-g="ninos">Niños (6-11)</button><button data-g="jovenes-adultos">Jóvenes y adultos</button></div>`);
    n.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.g === S.grupo);
      b.onclick = () => { S.grupo = b.dataset.g; guardar(); ir('inicio'); };
    });
    return n;
  }
  const hechos = (lista = todos()) => lista.filter((n) => S.progreso[n.id]).length;

  function inicio() {
    $app.innerHTML = `<div class="hero"><div class="chip" style="color:var(--gold2);position:relative">Templo Bíblico Emmanuel</div>
      <h1>El nacimiento de Jesucristo</h1>
      <p class="lead">De Génesis a Apocalipsis: las profecías, los lugares y el porqué de cada viaje, con la Reina-Valera 1960.</p>
      <button class="gold ver-intro" id="verIntro">▶ Ver la intro</button></div>`;
    document.getElementById('verIntro').onclick = () => intro(true);
    $app.append(selectorGrupo());
    const lista = todos(), sig = lista.find((n) => !S.progreso[n.id]) || lista[0];
    $app.append(el(`<div class="card dorada"><div class="chip">Continuar · Bloque ${sig.bloque.num}</div><h2>${esc(sig.titulo)}</h2>
      <p class="muted">${esc(sig.pasajes.join(' · '))}</p><p class="muted">${hechos(lista)} de ${lista.length} niveles completados</p>
      <button class="primary full" id="seguir">▶ Jugar este nivel</button></div>`));
    document.getElementById('seguir').onclick = () => ir('nivel', sig.id);
    const menu = el(`<div class="menu">
      <button data-t="niveles"><span class="ico">📖</span><b>Niveles</b><small>Video, lectura, devocional, juego, memoria</small></button>
      <button data-t="ruta"><span class="ico">✨</span><b>Ruta de la promesa</b><small>De Génesis 3:15 a Apocalipsis 22:16</small></button>
      <button data-t="mapa"><span class="ico">🗺️</span><b>Mapa de viajes</b><small>Distancias y por qué se movieron</small></button>
      <button data-t="notas"><span class="ico">✍️</span><b>Mis notas</b><small>Lo que has expresado con tus palabras</small></button></div>`);
    menu.querySelectorAll('button').forEach((b) => (b.onclick = () => ir(b.dataset.t)));
    $app.append(menu);
    $app.append(el(`<p class="muted" style="margin-top:18px">Contenido basado en la Escritura (RVR1960). Las distancias son en línea recta y aproximadas. Tu progreso se guarda en este dispositivo.</p>`));
  }

  let abierto = null;
  function niveles() {
    $app.innerHTML = '';
    $app.append(migas(['Inicio', 'Niveles']));
    $app.append(el(`<div><h1>Niveles</h1><p class="lead">10 bloques, de Génesis a Apocalipsis. Toca un bloque para ver sus niveles.</p></div>`));
    $app.append(selectorGrupo());
    const bl = grupo().bloques;
    if (!abierto) { const b = bl.find((x) => x.niveles.some((n) => !S.progreso[n.id])) || bl[0]; abierto = b.id; }
    bl.forEach((b) => {
      const h = hechos(b.niveles), on = b.id === abierto;
      const card = el(`<div class="card bloque ${on ? 'dorada' : ''}"><button class="cab" aria-expanded="${on}"><span class="bn">${b.num}</span>
        <span class="bt"><b>${esc(b.titulo)}</b><small>${esc(b.sub)} · ${h}/${b.niveles.length}</small><span class="barrita"><i style="width:${(h / b.niveles.length) * 100}%"></i></span></span><span class="fl">${on ? '▲' : '▼'}</span></button></div>`);
      card.querySelector('.cab').onclick = () => { abierto = on ? '-' : b.id; const y = window.scrollY; niveles(); window.scrollTo(0, y); };
      if (on) b.niveles.forEach((n, i) => {
        const p = S.progreso[n.id];
        const c = el(`<div class="nivel"><div class="num">${i + 1}</div><div class="info"><b>${esc(n.titulo)}</b>
          <span class="muted">${esc(n.pasajes.join(' · '))}</span><div class="stars">${p ? estrellas(p.estrellas) : 'Sin jugar'}</div></div>
          <button class="primary">${p ? 'Repetir' : 'Jugar'}</button></div>`);
        c.querySelector('button').onclick = () => ir('nivel', n.id);
        card.append(c);
      });
      $app.append(card);
    });
  }

  /* ---------- nivel ---------- */
  let N = null, paso = 0, puntos = 0, total = 0, pasos = PASOS;
  function nivel(id) {
    N = todos().find((n) => n.id === id); paso = 0; puntos = 0; total = 0;
    pasos = PASOS.filter((p) => p[0] !== 'video' || N.devocional.capsula);
    abierto = N.bloque.id; pintarPaso();
  }
  function cabecera() {
    return `<div id="migasNivel"></div><div class="chip">Bloque ${N.bloque.num} · ${esc(N.titulo)}</div>
      <div class="steps">${pasos.map((p, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div>
      <div class="steplabel">Paso ${paso + 1} de ${pasos.length} · ${pasos[paso][1]}</div>`;
  }
  function barra(sigTexto, accion, ocultar) {
    const b = el(`<div class="fixbar"><button id="atras">← Atrás</button><button class="primary" id="sig">${sigTexto}</button></div>`);
    b.querySelector('#atras').onclick = () => { if (paso === 0) ir('niveles'); else { paso--; pintarPaso(); } };
    const s = b.querySelector('#sig'); s.onclick = accion || (() => { paso++; pintarPaso(); });
    if (ocultar) s.classList.add('hidden');
    return b;
  }
  function pintarPaso() {
    const dv = N.devocional; const k = pasos[paso][0];
    $app.innerHTML = cabecera(); ponerMigasNivel();
    if (k === 'video') {
      $app.append(el(`<div class="card"><h2>${esc(dv.capsula_titulo)}</h2>
        <video controls playsinline preload="metadata" poster="${dv.capsula.replace('.mp4', '.jpg')}" src="${dv.capsula}"></video>
        ${dv.capsula_nota ? `<p class="muted">${esc(dv.capsula_nota)}</p>` : ''}</div>`));
      $app.append(barra('Siguiente →'));
    } else if (k === 'lectura') {
      $app.append(el(`<div class="card"><h2>Lee la Palabra</h2>${dv.lectura.map((v) => `<p class="ref">${esc(v.cita)}</p><blockquote>${esc(v.texto)}</blockquote>`).join('')}
        <p class="muted">Reina-Valera 1960</p></div>`));
      $app.append(barra('Siguiente →'));
    } else if (k === 'devocional') {
      const p = dv.predicacion;
      $app.append(el(`<div class="card"><div class="chip">Contexto</div><p>${esc(dv.contexto)}</p>
        ${dv.porque ? `<div class="badge">${esc(D.tipos[dv.porque.tipo])}</div><p class="muted">${esc(dv.porque.texto)}</p>` : ''}
        ${dv.nota ? `<p class="muted"><b>Nota:</b> ${esc(dv.nota)}</p>` : ''}</div>`));
      $app.append(el(`<div class="card dorada"><div class="chip">Mini predicación</div><h2>${esc(p.titulo)}</h2>
        ${p.puntos.map((x, i) => `<div class="punto"><h3>${i + 1}. ${esc(x.titulo)}</h3><p>${esc(x.texto)}</p><span class="ref">${esc(x.cita)}</span></div>`).join('')}
        <p><b>${esc(p.conclusion)}</b></p></div>`));
      $app.append(el(`<div class="card"><div class="chip">Para mi vida</div><ul>${dv.aplicaciones.map((a) => `<li><p>${esc(a)}</p></li>`).join('')}</ul></div>`));
      $app.append(barra('Ir al juego →'));
    } else if (k === 'juego') { juego(0); }
    else if (k === 'memoriza') { memoriza(); }
    else if (k === 'expresa') {
      const c = el(`<div class="card"><h2>Exprésalo con tus palabras</h2><p>${esc(dv.expresa)}</p>
        <textarea id="nota" placeholder="Escribe aquí...">${esc(S.notas[N.id] || '')}</textarea>
        <p class="muted">Se guarda solo en este dispositivo.</p></div>`);
      $app.append(c);
      $app.append(barra('Guardar y terminar →', () => { S.notas[N.id] = document.getElementById('nota').value.trim(); guardar(); paso++; pintarPaso(); }));
    } else if (k === 'fin') { fin(); }
  }

  function ponerMigasNivel() {
    const h = $app.querySelector('#migasNivel'); if (!h) return;
    h.replaceWith(migas(['Bloque ' + N.bloque.num, N.titulo], () => { if (paso === 0 || PASOS_FIN() || confirm('¿Salir del nivel? Tu avance en este nivel no se guardará.')) ir('niveles'); }));
  }
  const PASOS_FIN = () => pasos[paso] && pasos[paso][0] === 'fin';
  function juego(i) {
    const qs = N.preguntas;
    if (i >= qs.length) { paso++; return pintarPaso(); }
    const q = qs[i];
    $app.innerHTML = cabecera(); ponerMigasNivel();
    const c = el(`<div class="card"><div class="steplabel">Pregunta ${i + 1} de ${qs.length}</div><h2>${esc(q.pregunta)}</h2><div class="opciones" id="op"></div><div id="fb"></div></div>`);
    $app.append(c);
    const op = c.querySelector('#op'), fb = c.querySelector('#fb');
    const responder = (ok, detalle) => {
      total++; if (ok) puntos++;
      fb.className = 'fb ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = `<b>${ok ? '¡Correcto!' : 'Revisa el texto.'}</b> ${esc(detalle || '')}<br><span class="ref">${esc(q.cita)}</span>`;
      const s = $app.querySelector('#sig'); s.classList.remove('hidden'); s.focus();
    };
    if (q.tipo === 'opcion' || q.tipo === 'distancia') {
      q.opciones.forEach((o, k) => {
        const b = el(`<button>${esc(o)}</button>`);
        b.onclick = () => {
          op.querySelectorAll('button').forEach((x, j) => { x.disabled = true; if (j === q.respuesta) x.classList.add('ok'); });
          if (k !== q.respuesta) b.classList.add('bad');
          responder(k === q.respuesta, q.explicacion);
        };
        op.append(b);
      });
    } else if (q.tipo === 'mapa') {
      let hecho = false;
      op.append(mapa(q.mapa, {
        puntos: q.opciones, enfoque: q.opciones,
        onTap: (n, g) => {
          if (hecho) return; hecho = true;
          const ok = n === q.respuesta;
          g.querySelector('path').setAttribute('fill', ok ? '#3f8a4a' : '#b0472f');
          responder(ok, (ok ? '' : `Era ${q.respuesta.trim()}. `) + (q.explicacion || ''));
        },
      }));
      op.append(el(`<p class="muted">Toca un punto rojo del mapa.</p>`), botonAmpliar(q.mapa, { puntos: q.opciones, enfoque: q.opciones }, 'Mapa de la pregunta'));
    } else if (q.tipo === 'ordenar') {
      const zona = el(`<div class="orden" aria-label="Tu orden"></div>`), piezas = el(`<div class="piezas"></div>`), elegidos = [];
      barajar(q.eventos).forEach((e) => {
        const b = el(`<button>${esc(e)}</button>`);
        b.onclick = () => {
          elegidos.push(e); b.disabled = true; b.classList.add('hidden');
          zona.innerHTML = elegidos.map((x, j) => `${j + 1}. ${esc(x)}`).join('<br>');
          if (elegidos.length === q.eventos.length) {
            const ok = JSON.stringify(elegidos) === JSON.stringify(q.orden_correcto);
            responder(ok, 'Orden correcto: ' + q.orden_correcto.join(' → '));
          }
        };
        piezas.append(b);
      });
      op.append(el(`<p class="muted">Toca los eventos en orden.</p>`), zona, piezas);
    } else if (q.tipo === 'completar') {
      const inp = el(`<input autocomplete="off" placeholder="Escribe la palabra que falta">`), b = el(`<button class="primary full" style="margin-top:8px">Comprobar</button>`);
      b.onclick = () => { if (!inp.value.trim()) return inp.focus(); b.disabled = true; inp.disabled = true; responder(norm(inp.value) === norm(q.respuesta), 'Respuesta: ' + q.respuesta); };
      op.append(inp, b);
    }
    const bar = barra('Siguiente →', () => juego(i + 1), true);
    $app.append(bar);
  }

  function trozos(texto) {
    const w = texto.split(/\s+/), out = [], t = w.length > 24 ? 4 : 3;
    for (let i = 0; i < w.length; i += t) out.push(w.slice(i, i + t).join(' '));
    return out;
  }
  function memoriza() {
    const v = N.devocional.memoriza, partes = trozos(v.texto);
    let n = 0;
    const c = el(`<div class="card"><h2>Memoriza</h2><p class="ref">${esc(v.cita)}</p>
      <blockquote id="verso">${esc(v.texto)}</blockquote>
      <button class="primary full" id="empezar">Ya lo leí: ¡a armarlo!</button>
      <div id="armar" class="hidden"><p class="muted">Toca las partes en orden.</p><div class="orden" id="zona"></div><div class="piezas" id="piezas"></div></div>
      <div id="listo" class="fb ok hidden"><b>¡Muy bien!</b> Repítelo en voz alta tres veces sin mirar.</div></div>`);
    $app.append(c);
    const zona = c.querySelector('#zona'), pz = c.querySelector('#piezas');
    c.querySelector('#empezar').onclick = () => {
      c.querySelector('#verso').classList.add('hidden'); c.querySelector('#empezar').classList.add('hidden'); c.querySelector('#armar').classList.remove('hidden');
      barajar(partes.map((p, i) => [p, i])).forEach(([p, i]) => {
        const b = el(`<button>${esc(p)}</button>`);
        b.onclick = () => {
          if (i !== n) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
          n++; b.classList.add('hidden'); zona.textContent = partes.slice(0, n).join(' ');
          if (n === partes.length) { c.querySelector('#listo').classList.remove('hidden'); $app.querySelector('#sig').classList.remove('hidden'); }
        };
        pz.append(b);
      });
    };
    $app.append(barra('Siguiente →', null, true));
  }

  function fin() {
    const pct = total ? puntos / total : 0, est = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    const prev = S.progreso[N.id];
    if (!prev || prev.estrellas <= est) S.progreso[N.id] = { estrellas: est, puntos, total };
    guardar();
    const lista = todos(), i = lista.indexOf(N), sig = lista[i + 1];
    $app.append(el(`<div class="card final dorada"><div class="medalla">${est === 3 ? '🏆' : est === 2 ? '⭐' : '📖'}</div><div class="big">${estrellas(est)}</div><h2>${puntos} de ${total} respuestas correctas</h2>
      <p class="muted">Aplicación del nivel</p><p>${esc(N.aplicacion)}</p>
      <p class="ref">Versículo para memorizar: ${esc(N.devocional.memoriza.cita)}</p></div>`));
    const r = el(`<div class="row"></div>`);
    const b1 = el(`<button class="full">Repetir nivel</button>`); b1.onclick = () => ir('nivel', N.id);
    r.append(b1);
    if (sig) { const b2 = el(`<button class="primary full">Siguiente nivel: ${esc(sig.titulo)} →</button>`); b2.onclick = () => ir('nivel', sig.id); r.append(b2); }
    else { const b2 = el(`<button class="primary full">Ver la ruta de la promesa →</button>`); b2.onclick = () => ir('ruta'); r.append(b2); }
    const b3 = el(`<button class="full">📖 Volver a los niveles</button>`); b3.onclick = () => ir('niveles');
    const b4 = el(`<button class="full">🏠 Ir al inicio</button>`); b4.onclick = () => ir('inicio');
    r.append(b3, b4);
    $app.append(r);
  }

  /* ---------- ruta de la promesa ---------- */
  function ruta() {
    $app.innerHTML = '';
    $app.append(migas(['Inicio', 'Ruta de la promesa']));
    $app.append(el(`<div><h1>Ruta de la promesa</h1><p class="lead">Desde el pecado de Adán hasta Apocalipsis: lo que Dios prometió sobre el Mesías y lo que significa para nosotros.</p></div>`));
    $app.append(el(`<div class="card"><h2>Cápsula: el linaje prometido</h2><video controls playsinline preload="metadata" poster="videos/capsula-ruta.jpg" src="videos/capsula-ruta.mp4"></video></div>`));
    const r = el(`<div class="ruta"></div>`);
    D.ruta.forEach((p, i) => {
      r.append(el(`<div class="paso"><div class="card"><div class="chip">${i + 1} · ${esc(p.cita)}</div><h3>${esc(p.titulo)}</h3>
        <blockquote>${esc(p.texto)}</blockquote><p><b>Para nosotros:</b> ${esc(p.para_nosotros)}</p></div></div>`));
    });
    $app.append(r);
    const j = el(`<div class="card dorada"><h2>Reto: ordena la ruta</h2><p class="muted">Toca las citas en el orden en que aparecen en la ruta.</p><div class="orden" id="z"></div><div class="piezas" id="p"></div><div id="f"></div><button class="full" id="otra">Otro reto</button></div>`);
    $app.append(j);
    const reto = () => {
      const idx = barajar(D.ruta.map((_, i) => i)).slice(0, 5).sort((a, b) => a - b), elegidos = [];
      const z = j.querySelector('#z'), p = j.querySelector('#p'), f = j.querySelector('#f');
      z.textContent = ''; p.innerHTML = ''; f.className = ''; f.innerHTML = '';
      barajar(idx).forEach((k) => {
        const b = el(`<button>${esc(D.ruta[k].cita)}</button>`);
        b.onclick = () => {
          elegidos.push(k); b.classList.add('hidden'); z.textContent = elegidos.map((x) => D.ruta[x].cita).join(' → ');
          if (elegidos.length === idx.length) {
            const ok = elegidos.every((x, i) => x === idx[i]);
            f.className = 'fb ' + (ok ? 'ok' : 'bad');
            f.innerHTML = ok ? '<b>¡Correcto!</b>' : '<b>Casi.</b> Orden: ' + idx.map((x) => esc(D.ruta[x].cita)).join(' → ');
          }
        };
        p.append(b);
      });
    };
    j.querySelector('#otra').onclick = reto; reto();
  }

  /* ---------- mapa de viajes ---------- */
  let viajeSel = 'censo';
  function mapaTab() {
    $app.innerHTML = '';
    $app.append(migas(['Inicio', 'Mapa de viajes']));
    $app.append(el(`<div><h1>Mapa de viajes</h1><p class="lead">Por qué se movieron: unas veces por mandato del rey, otras por aviso en sueños.</p></div>`));
    const chips = el(`<div class="viajes" role="tablist" aria-label="Viajes"></div>`);
    D.viajes.forEach((v) => {
      const b = el(`<button class="${v.id === viajeSel ? 'on' : ''}">${esc(v.titulo)}</button>`);
      b.onclick = () => { viajeSel = v.id; mapaTab(); };
      chips.append(b);
    });
    $app.append(chips);
    const on = chips.querySelector('.on'); if (on) chips.scrollLeft = on.offsetLeft - 16;
    const v = D.viajes.find((x) => x.id === viajeSel);
    const puntos = v.mapa === 'H' ? ['Nazaret', 'Belén', 'Jerusalén', 'Ramá'] : v.mapa === 'M' ? ['Ur', 'Harán', 'Siquem', 'Egipto  ', 'Monte Sinaí'] : [...new Set([v.de, v.a, 'Egipto'].filter(Boolean))];
    const card = el(`<div class="card"></div>`);
    const om = Object.assign({ puntos, ruta: [v.de, v.a], icono: ICONOS[v.id] || '🚶' }, PISTAS[v.id] || {});
    card.append(mapa(v.mapa, om), botonAmpliar(v.mapa, om, v.titulo));
    const A = v.de && D.lugares[v.de], B = v.a && D.lugares[v.a];
    const d = A && B ? Math.round(km(A, B)) : null;
    card.append(el(`<div><h2 style="margin-top:12px">${esc(v.titulo)}</h2><div class="badge">${esc(D.tipos[v.tipo])}</div>
      <p>${esc(v.motivo)}</p><p class="ref">${esc(v.cita)}</p>
      ${d ? `<div class="dist">≈ <span id="kmCont" data-km="${d}">0</span> km</div><p class="muted">En línea recta entre ${esc(v.de.trim())} (${A.lat.toFixed(2)}° N, ${A.lon.toFixed(2)}° E) y ${esc(v.a.trim())} (${B.lat.toFixed(2)}° N, ${B.lon.toFixed(2)}° E). El camino real es más largo.</p>` : '<p class="muted">El texto no indica el punto exacto de partida o llegada, así que no se calcula distancia.</p>'}
      ${[v.de, v.a].filter(Boolean).map((n) => `<p class="muted">• ${esc(n.trim())}: ${esc(D.lugares[n].nota)}</p>`).join('')}</div>`));
    $app.append(card);
    const kc = card.querySelector('#kmCont');
    if (kc) { const fin = +kc.dataset.km, t0 = performance.now(); const paso = (t) => { const f = Math.min(1, (t - t0 - 300) / 2300); kc.textContent = Math.max(0, Math.round(fin * (f < 0 ? 0 : 1 - Math.pow(1 - f, 3)))); if (f < 1) requestAnimationFrame(paso); }; requestAnimationFrame(paso); }
  }
  const ICONOS = { censo: '🫏', pastores: '🐑', presentacion: '🫏', magos1: '🐪', magos2: '🐪', magos3: '🐪', huida: '🫏', regreso: '🫏', nazaret: '🫏', ur: '🐪', haran: '🐪', hambre: '🐪', jacob: '🐪', exodo: '🚶' };
  const PISTAS = { pastores: { desde: 'cerca' }, magos1: { desde: 'este' }, magos3: { hacia: 'este' } };

  /* ---------- intro con el logo ---------- */
  function intro(forzar) {
    let visto = false; try { visto = sessionStorage.getItem('tbe-intro') === '1'; } catch (e) {}
    if (visto && !forzar) return;
    const n = el(`<div class="intro" role="dialog" aria-label="Presentación"><div class="rayos"></div>
      <button class="saltar">Saltar ⏭</button>
      <div class="sello"><img src="assets/logo.png" alt="Logo del Templo Bíblico Emmanuel"></div>
      <div class="l1">Templo Bíblico Emmanuel presenta</div>
      <div class="l2">El nacimiento de Jesucristo</div>
      <div class="l3">De Génesis a Apocalipsis · Reina-Valera 1960</div>
      <button class="gold entrar">Comenzar ▶</button></div>`);
    const cerrar = () => { try { sessionStorage.setItem('tbe-intro', '1'); } catch (e) {} n.classList.add('fuera'); setTimeout(() => n.remove(), 650); };
    n.querySelector('.saltar').onclick = cerrar; n.querySelector('.entrar').onclick = cerrar;
    document.body.append(n); n.querySelector('.entrar').focus({ preventScroll: true });
  }

  /* ---------- notas ---------- */
  function notas() {
    $app.innerHTML = '';
    $app.append(migas(['Inicio', 'Mis notas']));
    $app.append(el(`<div><h1>Mis notas</h1><p class="lead">Lo que has expresado con tus palabras en cada nivel.</p></div>`));
    let alguna = false;
    Object.values(D.grupos).forEach((g) => todos(g).forEach((n) => {
      const t = S.notas[n.id]; if (!t) return; alguna = true;
      $app.append(el(`<div class="card"><div class="chip">${esc(g.titulo)} · Bloque ${n.bloque.num}</div><h3>${esc(n.titulo)}</h3><p>${esc(t).replace(/\n/g, '<br>')}</p></div>`));
    }));
    if (!alguna) $app.append(el(`<div class="card"><p>Aún no tienes notas. Al final de cada nivel podrás escribir con tus palabras lo que aprendiste.</p></div>`));
  }

  intro(false);
  { const st = leerHash(); ir(st.tab, st.arg, false); try { history.replaceState({ tab: st.tab, arg: st.arg }, '', urlDe(st.tab, st.arg)); } catch (e) {} }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
