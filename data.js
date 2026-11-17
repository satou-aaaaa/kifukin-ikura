// 寄附金控除いくら？の問題を作る（ブラウザと node の両方で使う）。
// 中身は、国税庁タックスアンサー No.1150「一定の寄附金を支払ったとき（寄附金控除）」に書いてあることだけ（［令和8年4月1日現在法令等］。2026-11-17 に読んだ。要点は共有フォルダ games/kifukin-ikura-research.md）。
// 1問は、総所得金額等と1年に寄附した先・額を読んで、寄附金控除の額を選ぶ。正解したら2段目「どの決まり？」を選ぶ。
// 答えはコードで計算する：（特定寄附金の合計か、総所得金額等の40％の低いほう）−2,000円。2,000円以下なら0円（控除なし）。
//   特定寄附金：国・地方公共団体（ふるさと納税）・日本赤十字社・独立行政法人・公益財団法人・社会福祉法人・更生保護法人・認定NPO法人・政党など。
//   学校の入学に関してするもの・寄附をした人に特別の利益がおよぶもの・リストに無い先（会社・町内会）は入らない。
// 政党・認定NPO法人などは税額控除も選べるが、このゲームは寄附金控除（所得控除）を選んだときだけ。総所得金額等は1万円単位にして、40％に端数が出ないようにする。
// 税額・住民税（ふるさと納税の住民税の控除）・税額控除の計算・申告の手続きは扱わない（画面に書く）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。
// KINDS の並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const AS_OF = "令和8年4月1日現在法令等";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    a: ["国税庁 タックスアンサー No.1150 一定の寄附金を支払ったとき（寄附金控除）", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1150.htm"],
  };
  const MEDIA = { a: "1年に寄附した額（所得税）" };
  const MAN = 10000;
  // 寄附金控除：（特定寄附金の合計と総所得金額等の40％の低いほう）−2,000円（No.1150）。マイナスなら0円
  function deductOf(S, A, B, aok, bok) { const t = (aok ? A : 0) + (bok ? B : 0); return Math.max(Math.min(t, S * 0.4) - 2000, 0); }
  function grpOf(S, A, B, aok, bok) {
    if ((A && !aok) || (B && !bok)) return "gai";
    const t = A + B;
    if (t <= 2000) return "none";
    if (t > S * 0.4) return "cap";
    return A && B ? "awase" : "kiso";
  }

  // 2段目「どの決まり？」
  const GROUPS = {
    kiso: { name: "寄附の額−2,000円", sub: "所得の40％までなら", set: "all" },
    awase: { name: "寄附を足す", sub: "合計−2,000円", set: "all" },
    cap: { name: "所得の40％まで", sub: "40％−2,000円", set: "all" },
    none: { name: "2,000円以下", sub: "控除なし", set: "all" },
    gai: { name: "対象にならない寄附", sub: "入学・特別の利益・ほかの先", set: "all" },
  };
  const GRP_WHY = {
    kiso: "寄附金控除は、特定寄附金の合計から2,000円を引いた額です。総所得金額等の40％までです。",
    awase: "特定寄附金がいくつかあれば、合計してから2,000円を引きます。",
    cap: "特定寄附金の合計が総所得金額等の40％を超えると、40％の額から2,000円を引きます。",
    none: "特定寄附金の合計が2,000円以下なら、引くと0円以下になるので控除はありません。",
    gai: "学校の入学に関する寄附、寄附をした人に特別の利益がおよぶ寄附、特定寄附金の先でない寄附は入りません。",
  };
  const KEY = {
    kiso: "（寄附の合計か所得の40％の低いほう）−2,000円",
    awase: "寄附はぜんぶ足してから2,000円を引く",
    cap: "所得の40％を超えた分は入らない",
    none: "2,000円以下なら0円",
    gai: "入学に関する・特別の利益・ほかの先の寄附は入らない",
  };

  // 種類：[id, 難しさ, 2段目, 場面（＄S 総所得金額等・＄A・＄B 寄附の額）, 総所得金額等 [下限, 上限, 刻み], A, B（[下限, 上限, 刻み] か "S40"（ちょうど40％）・"S40+"（40％＋1万円）・"2000-A"）, Aが特定寄附金か, Bが特定寄附金か, ヒント1]
  const SM = [3000000, 8000000, 100000], SL = [500000, 1500000, 10000];
  const D = [
    ["f_base", 0, "kiso", "総所得金額等は＄S。ふるさと納税で市に＄Aを寄附した。", SM, [10000, 100000, 1000], 0, 1, 0, "国や市町村への寄附は特定寄附金。"],
    ["r_base", 0, "kiso", "総所得金額等は＄S。日本赤十字社に＄Aを寄附した。", SM, [5000, 50000, 1000], 0, 1, 0, "寄附の額から2,000円を引く。"],
    ["z_base", 0, "kiso", "総所得金額等は＄S。公益財団法人に＄Aを寄附した。", SM, [5000, 80000, 1000], 0, 1, 0, "寄附の額から2,000円を引く。"],
    ["n_base", 0, "kiso", "総所得金額等は＄S。認定NPO法人に＄Aを寄附し、寄附金控除を選んだ。", SM, [5000, 60000, 1000], 0, 1, 0, "認定NPO法人も特定寄附金。"],
    ["s_base", 0, "kiso", "総所得金額等は＄S。社会福祉法人に＄Aを寄附した。", SM, [5000, 60000, 1000], 0, 1, 0, "社会福祉法人も特定寄附金。"],
    ["p_none", 0, "none", "総所得金額等は＄S。ふるさと納税で町に＄Aを寄附した。", SM, [500, 2000, 100], 0, 1, 0, "2,000円を引くと？"],
    ["c_cap", 0, "cap", "総所得金額等は＄S。県に＄Aを寄附した。", SL, [700000, 1500000, 10000], 0, 1, 0, "所得の40％を超えていない？"],
    ["g_nyu", 0, "gai", "総所得金額等は＄S。子の入学に関して私立学校に＄Aを寄附した。", SM, [50000, 300000, 10000], 0, 0, 0, "入学に関する寄附は？"],
    ["a_two", 0, "awase", "総所得金額等は＄S。ふるさと納税で市に＄A、町に＄Bを寄附した。", SM, [5000, 50000, 1000], [5000, 50000, 1000], 1, 1, "2つを足してから引く。"],
    ["t_seito", 0, "kiso", "総所得金額等は＄S。政党に＄Aを寄附し、寄附金控除を選んだ。", SM, [5000, 100000, 1000], 0, 1, 0, "政党への寄附も特定寄附金。"],
    ["w_2000", 1, "none", "総所得金額等は＄S。ふるさと納税で村にちょうど＄Aを寄附した。", SM, [2000, 2000, 1], 0, 1, 0, "2,000円を引くと0円。"],
    ["w_2100", 1, "kiso", "総所得金額等は＄S。日本赤十字社に＄Aを寄附した。", SM, [2100, 3000, 100], 0, 1, 0, "2,000円を少し超えると？"],
    ["c_low", 1, "cap", "総所得金額等は＄S。ふるさと納税で＄Aを寄附した。", [200000, 800000, 10000], [400000, 800000, 10000], 0, 1, 0, "所得の40％はいくら？"],
    ["g_toku", 1, "gai", "総所得金額等は＄S。自分だけが使える設備をつくる寄附として市に＄Aを出した。", SM, [100000, 500000, 10000], 0, 0, 0, "特別の利益がおよぶ寄附は？"],
    ["g_mix", 1, "gai", "総所得金額等は＄S。公益財団法人に＄A、子の入学に関して学校に＄Bを寄附した。", SM, [5000, 80000, 1000], [50000, 200000, 10000], 1, 0, "入学に関する寄附は入らない。"],
    ["a_red", 1, "awase", "総所得金額等は＄S。日本赤十字社に＄A、認定NPO法人に＄Bを寄附した（寄附金控除を選ぶ）。", SM, [3000, 30000, 1000], [3000, 30000, 1000], 1, 1, "2つを足す。"],
    ["a_cap", 1, "cap", "総所得金額等は＄S。市に＄A、県に＄Bを寄附した。", [500000, 1000000, 10000], [210000, 400000, 10000], [210000, 400000, 10000], 1, 1, "合計が所得の40％を超える？"],
    ["d_dokuho", 1, "kiso", "総所得金額等は＄S。独立行政法人に＄Aを寄附した。", SM, [5000, 80000, 1000], 0, 1, 0, "独立行政法人も特定寄附金。"],
    ["k_kosei", 1, "kiso", "総所得金額等は＄S。更生保護法人に＄Aを寄附した。", SM, [5000, 80000, 1000], 0, 1, 0, "更生保護法人も特定寄附金。"],
    ["f_many", 1, "kiso", "総所得金額等は＄S。ふるさと納税で、いくつかの市町村に合計＄Aを寄附した。", SM, [30000, 150000, 1000], 0, 1, 0, "合計から2,000円を引く。"],
    ["p_small", 1, "none", "総所得金額等は＄S。市に＄A、日本赤十字社に＄Bを寄附した。", SM, [500, 1000, 100], [500, 1000, 100], 1, 1, "合計は2,000円を超える？"],
    ["g_kaisha", 1, "gai", "総所得金額等は＄S。友人の会社に＄Aを寄附した。", SM, [10000, 200000, 10000], 0, 0, 0, "会社は特定寄附金の先？"],
    ["c_exact", 2, "kiso", "総所得金額等は＄S。県に＄Aを寄附した。", SL, "S40", 0, 1, 0, "ちょうど40％なら超えていない。"],
    ["c_plus", 2, "cap", "総所得金額等は＄S。市に＄Aを寄附した。", SL, "S40+", 0, 1, 0, "40％を1万円超えると？"],
    ["w_2100b", 2, "kiso", "総所得金額等は＄S。社会福祉法人に＄Aを寄附した。", SM, [2100, 2900, 100], 0, 1, 0, "2,000円を引いた残り。"],
    ["c_tiny", 2, "cap", "総所得金額等は＄S。ふるさと納税で＄Aを寄附した。", [50000, 200000, 10000], [100000, 200000, 10000], 0, 1, 0, "所得が少ないと40％も小さい。"],
    ["a_cap2", 2, "cap", "総所得金額等は＄S。日本赤十字社に＄A、公益財団法人に＄Bを寄附した。", [300000, 800000, 10000], [170000, 300000, 10000], [170000, 300000, 10000], 1, 1, "合計と40％、低いほう。"],
    ["g_mix2", 2, "gai", "総所得金額等は＄S。市に＄A、子の入学に関して学校に＄Bを寄附した。", SM, [500, 2000, 100], [100000, 300000, 10000], 1, 0, "入る寄附だけで2,000円を超える？"],
    ["p_two2", 2, "none", "総所得金額等は＄S。市に＄A、町に＄Bを寄附した。", SM, [500, 1500, 100], "2000-A", 1, 1, "合計はちょうど2,000円。"],
    ["a_three", 2, "awase", "総所得金額等は＄S。政党に＄A、社会福祉法人に＄Bを寄附した（寄附金控除を選ぶ）。", SM, [5000, 50000, 1000], [5000, 50000, 1000], 1, 1, "先がちがっても足す。"],
    ["g_chonai", 2, "gai", "総所得金額等は＄S。町内会のお祭りに＄Aを寄附した。", SM, [5000, 50000, 1000], 0, 0, 0, "町内会は特定寄附金の先？"],
    ["f_big", 2, "kiso", "総所得金額等は＄S。ふるさと納税で＄Aを寄附した。", [10000000, 30000000, 1000000], [100000, 500000, 10000], 0, 1, 0, "所得が多いと40％も大きい。"],
    ["c_nenkin", 2, "cap", "年金の所得など、総所得金額等は＄S。市に＄Aを寄附した。", [300000, 600000, 10000], [300000, 500000, 10000], 0, 1, 0, "40％を超えていない？"],
    ["w_2001", 2, "kiso", "総所得金額等は＄S。日本赤十字社にちょうど＄Aを寄附した。", SM, [2001, 2001, 1], 0, 1, 0, "2,000円を引いた残り。"],
    ["g_toku2", 2, "gai", "総所得金額等は＄S。寄附で建つ施設を自分の会社が専属で使う約束で、県に＄Aを寄附した。", SM, [100000, 500000, 10000], 0, 0, 0, "特別の利益がおよぶと？"],
  ];

  const yen = (n) => n.toLocaleString("ja-JP") + "円";
  const man = (n) => (n !== 0 && n % MAN === 0 ? `${(n / MAN).toLocaleString("ja-JP")}万円` : yen(n));
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pickAmt = (R, lo, hi, step) => lo + ri(R, 0, Math.floor((hi - lo) / step)) * step;
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }

  const label = (t) => (t === 0 ? "0円（控除なし）" : yen(t));
  function amt(R, sp, S, A) {
    if (sp === "S40") return S * 0.4;
    if (sp === "S40+") return S * 0.4 + 10000;
    if (sp === "2000-A") return 2000 - A;
    return sp ? pickAmt(R, sp[0], sp[1], sp[2]) : 0;
  }
  function maker(sent, ss, as, bs, aok, bok) {
    return (R) => {
      const S = pickAmt(R, ss[0], ss[1], ss[2]), A = amt(R, as, S, 0), B = amt(R, bs, S, A);
      const ans = deductOf(S, A, B, aok, bok), grp = grpOf(S, A, B, aok, bok);
      const sentence = sent.replace("＄S", man(S)).replace("＄A", man(A)).replace("＄B", man(B));
      // 選び肢：2,000円の引き忘れ・40％の上限の見落とし・対象にならない寄附を入れる・30％や50％にする・0円 から3つ
      const t = (aok ? A : 0) + (bok ? B : 0), all = A + B;
      const cand = new Set([Math.min(t, S * 0.4), t - 2000, Math.min(all, S * 0.4) - 2000, all - 2000, Math.max(Math.min(t, S * 0.3) - 2000, 0), Math.max(Math.min(t, S * 0.5) - 2000, 0), all, 0]);
      const ok = (v) => Number.isInteger(v) && v >= 0 && v !== ans;
      const wrong0 = [...cand].filter(ok);
      for (const v of [ans + 2000, ans + 1000, ans + 4000, ans + 10000, 2000]) { if (wrong0.length >= 3) break; if (ok(v) && !wrong0.includes(v)) wrong0.push(v); }
      const wrong = pickN(R, [...new Set(wrong0)].sort((x, y) => x - y), 3);
      const opts = shuffle(R, [ans, ...wrong]).map(label);
      const how = grp === "gai" && !t ? "特定寄附金がない" : t <= 2000 ? `特定寄附金${yen(t)}は2,000円以下` : t > S * 0.4 ? `所得の40％ ${yen(S * 0.4)} − 2,000円` : `特定寄附金${yen(t)} − 2,000円`;
      const full = `${sentence} → ${how}：${label(ans)}`;
      return { type: "act", q: `${sentence}　控除はいくら？`, opts, ans: label(ans), rev: false, full, S, A, B, aok: !!aok, bok: !!bok, deduct: ans, grp, v: `${S}/${A}/${B}` };
    };
  }
  // 金額の組が6通りより少ない種類は lo=hi にする（QA の「6通り以上」から外す）
  const cnt = (sp) => (Array.isArray(sp) ? Math.floor((sp[1] - sp[0]) / sp[2]) + 1 : 1);
  const KINDS = D.map(([id, lv, grp, sent, ss, as, bs, aok, bok, look]) => ({ id, lv, grp, col: "a", sent, lo: 0, hi: cnt(ss) * cnt(as) * cnt(bs) < 6 ? 0 : 1, look, src: ["a"], name: GROUPS[grp].name + "：" + sent.replace(/＄./g, "○円").slice(0, 22) + "…", key: KEY[grp], why: GRP_WHY[grp], make: maker(sent, ss, as, bs, aok, bok) }));
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const GRP_OF = Object.fromEntries(KINDS.map((k) => [k.id, k.grp]));
  const groupsOf = (g) => Object.keys(GROUPS).filter((x) => GROUPS[x].set === GROUPS[g].set);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.col], src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const KFK = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, MEDIA, AS_OF, deductOf, grpOf, kindsOf, groupsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = KFK; else root.KFK = KFK;
})(typeof self !== "undefined" ? self : this);
