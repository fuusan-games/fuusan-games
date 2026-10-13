/* ふーさんのゲームひろば：みんなの部屋（パーティー）共通スクリプト
 * 同じメンバーのまま、部屋を作り直さずに次のゲームへ移るためのしくみ。
 * URL ?party=CODE&pn=名前&ph=1（ホスト）で各ゲームに入ると、各ゲームは同じ部屋コードで自動で部屋を開く／参加する。
 * ホストが「つぎのゲーム」を選ぶと {t:'fuu-goto', game} を全員に送り、全員がそのゲームへ移動する。
 */
(function () {
  'use strict';
  var GAMES = [
    ['shitterukko', '🤫', 'しってるっこ'], ['hentekko-paint', '🖍️', 'へんてこペイント'], ['nothanks-online', '🃏', 'ノーサンキュー！'],
    ['zurekko', '🐺', 'ずれっこ'], ['oboete-order', '☕', 'おぼえてオーダー！'], ['fuuma-no-toki', '👿', '封魔の刻'],
    ['tatoete-narabe', '💬', 'たとえてナラベ！'], ['mienai-meiro', '🌙', 'みえない迷路'], ['moribiraki', '🌲', 'もりびらき'],
    ['oboeteru-watashi', '🍞', 'おぼえてる私'], ['hitokoto-hint', '💡', 'ひとことヒント'], ['kakutori-jin', '🏯', '角取り陣'],
    ['iro-tile-koubou', '🏛️', 'いろタイル工房'], ['suuretsu-jin', '🀄', '数列陣'], ['nanamekuri', '🃏', 'ななめくり'],
    ['gomoji-pitari', '✏️', 'ごもじでピタリ'], ['koroiro', '🎲', 'ころいろ'], ['yobigoe-yakata', '🕯️', 'よびごえの館'],
    ['todoke-koibumi', '💌', 'とどけ！こいぶみ'], ['sukusuku-garden', '🌱', 'すくすくガーデン'], ['oukoku-souha', '👑', '王国争覇'],
    ['niwatoridori', '🐔', 'ニワトリドリ']
  ];
  // パーティー対応済みのゲーム（順次ふやす）
  var READY = ['shitterukko', 'hentekko-paint', 'nothanks-online'];
  var HUB = 'fuusan-games';
  var SS = 'fuu-party';
  var Q = new URLSearchParams(location.search);
  function norm(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); }
  var info = null;
  if (Q.get('party')) info = { code: norm(Q.get('party')), name: String(Q.get('pn') || '').slice(0, 10), host: Q.get('ph') === '1' };
  else { try { info = JSON.parse(sessionStorage.getItem(SS)); } catch (e) {} }
  if (info && norm(info.code).length !== 4) info = null;
  if (info) { try { sessionStorage.setItem(SS, JSON.stringify(info)); } catch (e) {} }
  // サイトの一番上（/ か /リポジトリ名の親）。/<game>/ の1つ上
  var segs = location.pathname.split('/'); segs.splice(-2, 2);
  var ROOT = segs.join('/') + '/';
  var keep = ['ice', 'peerhost', 'peerport', 'peerpath', 'turbo'];
  function urlFor(game, inf) {
    inf = inf || info;
    var u = ROOT + game + '/?party=' + inf.code + '&pn=' + encodeURIComponent(inf.name) + (inf.host ? '&ph=1' : '');
    keep.forEach(function (k) { if (Q.get(k) != null) u += '&' + k + '=' + encodeURIComponent(Q.get(k)); });
    return u;
  }
  var leaving = false;
  function go(game, inf) {
    if (leaving) return; leaving = true;
    if (inf) info = inf;
    try { sessionStorage.setItem(SS, JSON.stringify(info)); } catch (e) {}
    location.href = urlFor(game);
  }
  function leave() { try { sessionStorage.removeItem(SS); } catch (e) {} info = null; P.info = null; }
  var opts = null, btn = null, sheet = null;
  function css() {
    if (document.getElementById('fuuPartyCss')) return;
    var s = document.createElement('style'); s.id = 'fuuPartyCss';
    s.textContent = '#fuuPartyBtn{position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:99990;border:0;border-radius:999px;padding:8px 13px;font:700 13px/1 system-ui,sans-serif;background:#ff7a59;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.25)}' +
      '#fuuPartyBtn.guest{background:#555;opacity:.85;font-weight:600}' +
      '#fuuPartySheet{position:fixed;inset:0;z-index:99991;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}' +
      '#fuuPartySheet .in{background:#fff;color:#222;width:100%;max-width:520px;max-height:80vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px 12px calc(14px + env(safe-area-inset-bottom));font:14px system-ui,sans-serif}' +
      '#fuuPartySheet h3{margin:0 0 4px;font-size:16px}#fuuPartySheet p{margin:0 0 10px;color:#666;font-size:12px}' +
      '#fuuPartySheet .g{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:1px solid #ddd;background:#fafafa;border-radius:10px;padding:10px;margin:0 0 6px;font:600 14px system-ui,sans-serif;color:#222}' +
      '#fuuPartySheet .g[disabled]{opacity:.4}#fuuPartySheet .g.cur{border-color:#ff7a59}#fuuPartySheet .x{width:100%;margin-top:6px;padding:10px;border:0;border-radius:10px;background:#eee;font:600 14px system-ui,sans-serif}';
    document.head.appendChild(s);
  }
  function openSheet() {
    if (!opts || !opts.isHost()) return;
    if (opts.canSwitch && !opts.canSwitch()) { alert('ゲーム中は移れません。終わってから（またはロビーで）選んでね'); return; }
    sheet = document.createElement('div'); sheet.id = 'fuuPartySheet';
    sheet.innerHTML = '<div class="in"><h3>🎲 つぎのゲームを選ぶ</h3><p>部屋 ' + info.code + ' のメンバー全員で移動します（部屋の作り直しは不要）</p>' +
      '<button class="g" data-g="' + HUB + '">🏠 ひろばの部屋にもどる</button>' +
      GAMES.map(function (g) { var ok = READY.indexOf(g[0]) >= 0; return '<button class="g' + (g[0] === opts.game ? ' cur' : '') + '" data-g="' + g[0] + '"' + (ok ? '' : ' disabled') + '>' + g[1] + ' ' + g[2] + (ok ? '' : '（準備中）') + '</button>'; }).join('') +
      '<button class="x">とじる</button></div>';
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]');
      if (b && !b.disabled) { var g = b.dataset.g; close(); P.next(g); return; }
      if (e.target === sheet || e.target.closest('.x')) close();
    });
    document.body.appendChild(sheet);
  }
  function close() { if (sheet) { sheet.remove(); sheet = null; } }
  function tick() {
    if (!btn || !opts) return;
    var h = !!opts.isHost();
    btn.classList.toggle('guest', !h);
    var can = !opts.canSwitch || opts.canSwitch();
    btn.style.display = (h ? can : true) ? '' : 'none';
    btn.textContent = h ? '🎲 つぎのゲーム' : '🏠 部屋 ' + info.code;
  }
  var P = {
    info: info, games: GAMES, ready: READY, hub: HUB, urlFor: urlFor, go: go, leave: leave, norm: norm,
    // 各ゲームから呼ぶ：{ game, isHost(), broadcast(msg), canSwitch() }
    init: function (o) {
      opts = o; if (!info) return;
      css();
      btn = document.createElement('button'); btn.id = 'fuuPartyBtn'; btn.type = 'button';
      btn.onclick = function () { if (opts.isHost()) openSheet(); else alert('みんなの部屋 ' + info.code + '\nつぎのゲームはホストが選びます。'); };
      document.body.appendChild(btn); tick(); setInterval(tick, 800);
    },
    // ホスト：全員に移動を伝えてから自分も移動
    next: function (game) {
      if (!info || !opts) return;
      try { opts.broadcast({ t: 'fuu-goto', game: game }); } catch (e) {}
      setTimeout(function () { go(game); }, 900);
    },
    // 参加者：受信メッセージを渡す。処理したら true
    handle: function (m) { if (info && m && m.t === 'fuu-goto' && typeof m.game === 'string' && /^[a-z0-9-]+$/.test(m.game)) { go(m.game); return true; } return false; },
    retries: 40, retryMs: 1500
  };
  window.FuuParty = P;
})();
