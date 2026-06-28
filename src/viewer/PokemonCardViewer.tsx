import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import CardImage from '../components/CardImage';
import type { Card, CardLanguage } from '../types';
import { s } from './styleString';
import { glyphFor, themeVars, toRefCard, type RefCard, type ThemeName } from './refModel';
import { t, tv } from './i18n';

type Props = {
  cards: Card[];
  pdfUrl: string | null;
  indexPageCount: number;
  lang?: CardLanguage;
  langSwitch?: ReactNode;
};

const ACCENT_LIGHT = '#5558d6';
const ACCENT_DARK = '#7d82f0';
const STORAGE_KEY = 'ptcg-viewer-v1';

type View = 'grid' | 'table';

type Persisted = {
  theme?: ThemeName;
  view?: View;
  favorites?: number[];
  compare?: number[];
  sidebarWidth?: number;
};

const FACETS: { key: keyof RefCard | 'hasAbility'; label: string; opts: string[] }[] = [
  { key: 'supertype', label: '種別', opts: ['ポケモン', 'トレーナーズ', 'エネルギー'] },
  { key: 'stage', label: '進化段階', opts: ['たね', '1進化', '2進化'] },
  { key: 'type', label: 'タイプ', opts: ['草', '炎', '水', '雷', '超', '闘', '悪', '鋼', '竜', '無'] },
  { key: 'catTags', label: 'カテゴリ', opts: ['ポケモンex', 'メガポケモン', 'サポート', 'グッズ', 'ポケモンのどうぐ', 'スタジアム', '基本エネルギー', '特殊エネルギー'] },
  { key: 'expansion', label: '拡張', opts: [] },
  { key: 'flagTags', label: 'フラグ', opts: ['ex', 'メガ', 'ACE SPEC', 'テラ'] },
  { key: 'hasAbility', label: '特性', opts: ['特性あり'] },
];

function loadPersisted(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const SCOPED_CSS = `
.pcv *{box-sizing:border-box;}
.pcv-tile:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:var(--border-2);}
.pcv-row:hover{background:var(--hover) !important;}
.pcv-search:focus{border-color:var(--accent) !important;box-shadow:0 0 0 3px var(--accent-soft);}
.pcv-more:hover{background:var(--hover);}
.pcv-cmpimg:hover{border-color:var(--accent);}
@keyframes ptcgpop{from{transform:translateX(20px);opacity:0}to{transform:none;opacity:1}}
@keyframes ptcgshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.pcv ::-webkit-scrollbar{width:10px;height:10px}
.pcv ::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:8px;border:2px solid transparent;background-clip:padding-box}
.pcv ::-webkit-scrollbar-track{background:transparent}
.pcv-imgfill.is-loading,.pcv-imgfill.is-empty{display:none}
.pcv-imgfill{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;}
`;

export default function PokemonCardViewer({ cards, pdfUrl, indexPageCount, lang = 'JP', langSwitch }: Props) {
  const en = lang === 'EN';
  const tr = (key: string) => t(lang, key);
  const tval = (value: string | null | undefined) => tv(lang, value);
  const persisted = useRef(loadPersisted()).current;
  const refCards = useMemo(() => cards.map(toRefCard), [cards]);
  const expansions = useMemo(
    () => Array.from(new Set(refCards.map((c) => c.expansion).filter(Boolean))).sort(),
    [refCards],
  );

  const [theme, setTheme] = useState<ThemeName>(persisted.theme || 'light');
  const [mode, setMode] = useState<'search' | 'deck'>('search');
  const [view, setView] = useState<View>(persisted.view || 'grid');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [favOnly, setFavOnly] = useState(false);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [favorites, setFavorites] = useState<number[]>(persisted.favorites || []);
  const [compare, setCompare] = useState<number[]>(persisted.compare || []);
  const [compareMode, setCompareMode] = useState<'images' | 'details'>('images');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(persisted.sidebarWidth || 332);
  const [renderLimit, setRenderLimit] = useState(120);
  const [collapsedFacets, setCollapsedFacets] = useState<Set<string>>(() => new Set(['expansion']));

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, view, favorites, compare, sidebarWidth }),
      );
    } catch {
      // ignore
    }
  }, [theme, view, favorites, compare, sidebarWidth]);

  const accent = theme === 'dark' ? ACCENT_DARK : ACCENT_LIGHT;
  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const cmpSet = useMemo(() => new Set(compare), [compare]);
  const byId = useMemo(() => new Map(refCards.map((c) => [c.id, c])), [refCards]);

  const matchOne = (card: RefCard, key: string, set: Set<string>) => {
    if (!set || set.size === 0) return true;
    if (key === 'hasAbility') return card.hasAbility;
    let v = (card as unknown as Record<string, unknown>)[key];
    if (key === 'stage') v = card.supertype === 'ポケモン' ? card.stage : null;
    if (Array.isArray(v)) return v.some((x) => set.has(String(x)));
    if (v == null) return false;
    return set.has(String(v));
  };
  const matchSearch = (card: RefCard, q: string) => {
    if (!q) return true;
    const hay = [
      card.name, card.num, card.type, card.supertype, card.category, card.expansion, card.flag,
      card.ability?.name, card.ability?.text,
    ]
      .concat(card.attacks.map((a) => a.name))
      .concat(card.attacks.map((a) => a.text))
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.indexOf(q.toLowerCase()) !== -1;
  };

  const q = query.trim();
  const sets = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    Object.keys(filters).forEach((k) => {
      if (filters[k] && filters[k].size) out[k] = filters[k];
    });
    return out;
  }, [filters]);

  const filteredAll = useMemo(
    () => refCards.filter((c) => matchSearch(c, q) && Object.keys(sets).every((k) => matchOne(c, k, sets[k]))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refCards, q, sets],
  );

  const result = useMemo(() => {
    let r = favOnly ? filteredAll.filter((c) => favSet.has(c.id)) : filteredAll;
    const dir = sortDir === 'asc' ? 1 : -1;
    r = r.slice().sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name, 'ja') * dir;
        case 'hp': av = a.hp ?? -1; bv = b.hp ?? -1; break;
        case 'retreat': av = a.retreat ?? -1; bv = b.retreat ?? -1; break;
        case 'dpe': av = a.dpe; bv = b.dpe; break;
        case 'expansion': return (a.expansion.localeCompare(b.expansion) || a.gid - b.gid) * dir;
        default: av = a.gid; bv = b.gid;
      }
      if (av === bv) return (a.gid - b.gid) * dir;
      return (av - bv) * dir;
    });
    return r;
  }, [filteredAll, favOnly, favSet, sortKey, sortDir]);

  const resultCount = result.length;
  const visible = result.slice(0, renderLimit);

  const toggleFacet = (key: string, val: string) => {
    setFilters((f) => {
      const next = { ...f };
      const cur = new Set(next[key] ? Array.from(next[key]) : []);
      if (cur.has(val)) cur.delete(val);
      else cur.add(val);
      next[key] = cur;
      return next;
    });
    setRenderLimit(120);
  };
  const toggleFav = (id: number) =>
    setFavorites((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.concat([id])));
  const toggleCompare = (id: number) => {
    setCompare((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.length >= 12 ? a : a.concat([id])));
    setSidebarOpen(true);
  };
  const stepCard = (d: number) => {
    const i = result.findIndex((c) => c.id === selectedId);
    if (i === -1) return;
    setSelectedId(result[(i + d + result.length) % result.length].id);
  };
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const move = (ev: MouseEvent) => setSidebarWidth(Math.max(260, Math.min(560, startW + (startX - ev.clientX))));
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  // ---- style builders (ported) ----
  const seg = (on: boolean) =>
    `height:26px;padding:0 12px;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-family:'Noto Sans JP',sans-serif;transition:all .12s;background:${on ? 'var(--panel)' : 'transparent'};color:${on ? 'var(--text)' : 'var(--text-2)'};box-shadow:${on ? 'var(--shadow)' : 'none'};font-weight:${on ? '600' : '400'};`;
  const segIcon = (on: boolean) =>
    `width:30px;height:26px;border:none;border-radius:7px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .12s;background:${on ? 'var(--panel)' : 'transparent'};color:${on ? 'var(--text)' : 'var(--text-2)'};box-shadow:${on ? 'var(--shadow)' : 'none'};`;
  const toolBtn = (on: boolean) =>
    `display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;cursor:pointer;font-size:12px;font-family:'Noto Sans JP',sans-serif;transition:all .12s;border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};background:${on ? 'var(--accent)' : 'var(--bg)'};color:${on ? '#fff' : 'var(--text)'};`;
  const shapeBtn = (active: boolean, sm: boolean) => {
    const base = `border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:${sm ? '11px' : '12px'};line-height:1;transition:all .12s;`;
    const sz = sm ? 'width:24px;height:24px;' : 'width:25px;height:25px;';
    if (active) return `${base}${sz}background:var(--accent);border:1px solid var(--accent);color:#fff;`;
    return `${base}${sz}background:${sm ? 'var(--panel-2)' : 'rgba(255,255,255,.86)'};border:1px solid var(--border);color:var(--text-2);backdrop-filter:blur(4px);`;
  };

  // ---- facet groups with counts ----
  const passesExcept = (card: RefCard, exceptKey: string) => {
    if (!matchSearch(card, q)) return false;
    for (const k in sets) {
      if (k === exceptKey) continue;
      if (!matchOne(card, k, sets[k])) return false;
    }
    return true;
  };
  // Display label for a facet option value (the stored value stays canonical/JP).
  const optLabel = (facetKey: string, value: string) =>
    facetKey === 'hasAbility' ? tr('hasAbilityOpt') : tval(value);

  const facetGroups = FACETS.map((F) => {
    const opts = (F.key === 'expansion' ? expansions : F.opts);
    const base = refCards.filter((c) => passesExcept(c, F.key as string));
    const active = sets[F.key as string] || new Set<string>();
    return {
      key: F.key as string,
      label: tr(`facet_${F.key as string}`),
      options: opts.map((o) => {
        const count =
          F.key === 'hasAbility'
            ? base.filter((c) => c.hasAbility).length
            : base.filter((c) => {
                let v = (c as unknown as Record<string, unknown>)[F.key as string];
                if (F.key === 'stage') v = c.supertype === 'ポケモン' ? c.stage : null;
                if (Array.isArray(v)) return v.includes(o);
                return v === o;
              }).length;
        const on = active.has(o);
        return { key: o, label: optLabel(F.key as string, o), count: count.toLocaleString(), on, count0: count === 0 };
      }),
    };
  });

  const chips: { label: string; onRemove: () => void }[] = [];
  Object.keys(sets).forEach((k) => {
    Array.from(sets[k]).forEach((v) =>
      chips.push({ label: `${tr(`facet_${k}`)} · ${optLabel(k, v)}`, onRemove: () => toggleFacet(k, v) }),
    );
  });

  const compareItems = compare.map((id) => byId.get(id)).filter((c): c is RefCard => Boolean(c));
  const sc = selectedId != null ? byId.get(selectedId) ?? null : null;

  // ---- layout flags (twin layout only) ----
  const showLeftRail = true;
  const showRightCompare = sidebarOpen;
  const showBottomCompare = false;
  const showReopenHandle = !sidebarOpen;

  const rootStyle = {
    ...themeVars(theme, accent),
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: "'Noto Sans JP',system-ui,-apple-system,sans-serif",
    fontSize: '13px',
    lineHeight: 1.55,
    letterSpacing: '.01em',
  } as React.CSSProperties;

  const TH = (extra: string) =>
    s(`text-align:left;font-weight:600;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--text-3);padding:8px 10px;border-bottom:1px solid var(--border-2);${extra}`);

  function CardArt({ card, fontSize }: { card: RefCard; fontSize: number }) {
    const page = card.id + indexPageCount;
    return (
      <>
        <div style={s('position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,var(--hover) 0,var(--hover) 1px,transparent 1px,transparent 9px);')} />
        <div style={s('position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,var(--panel) 50%,transparent 65%);background-size:200% 100%;animation:ptcgshimmer 3.2s ease-in-out infinite;opacity:.5;')} />
        <span style={s(`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text);opacity:.07;font-size:${fontSize}px;`)}>{glyphFor(card.type)}</span>
        {pdfUrl ? <CardImage url={pdfUrl} page={page} alt={card.name} scale={1} thumb className="pcv-imgfill" /> : null}
      </>
    );
  }

  // ---- Filters partial ----
  function Filters({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
    const horizontal = orientation === 'horizontal';
    const groupsWrap = horizontal
      ? 'display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px 24px;'
      : 'display:flex;flex-direction:column;gap:16px;';
    return (
      <div style={s(`padding:14px 16px;display:flex;flex-direction:column;gap:12px;${horizontal ? '' : 'height:100%;'}`)}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;')}>
          <span style={s('font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--text-2);')}>{tr('filters')}</span>
          {chips.length ? (
            <button onClick={() => { setFilters({}); setRenderLimit(120); }} style={s("border:none;background:none;color:var(--accent);cursor:pointer;font-size:11px;font-family:'Noto Sans JP',sans-serif;padding:2px 4px;")}>{tr('clearAll')}</button>
          ) : null}
        </div>
        {chips.length ? (
          <div style={s('display:flex;flex-wrap:wrap;gap:5px;padding-bottom:4px;border-bottom:1px dashed var(--border);')}>
            {chips.map((chip, i) => (
              <button key={i} onClick={chip.onRemove} style={s("display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 6px 0 9px;border-radius:7px;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent);cursor:pointer;font-size:11px;font-family:'Noto Sans JP',sans-serif;")}>{chip.label} <span style={s('font-size:11px;opacity:.8;')}>✕</span></button>
            ))}
          </div>
        ) : null}
        <div style={s(groupsWrap)}>
          {facetGroups.map((g) => {
            const collapsed = collapsedFacets.has(g.key);
            const activeCount = g.options.filter((o) => o.on).length;
            return (
            <div key={g.key} style={s('display:flex;flex-direction:column;gap:7px;min-width:0;')}>
              <button
                onClick={() =>
                  setCollapsedFacets((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.key)) next.delete(g.key);
                    else next.add(g.key);
                    return next;
                  })
                }
                style={s('display:flex;align-items:center;gap:6px;border:none;background:none;padding:0;cursor:pointer;color:var(--text-2);font-family:\'Noto Sans JP\',sans-serif;')}
              >
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-3);width:8px;")}>{collapsed ? '▸' : '▾'}</span>
                <span style={s('font-size:11px;font-weight:600;color:var(--text-2);')}>{g.label}</span>
                {activeCount ? <span style={s("font-family:'JetBrains Mono',monospace;font-size:9px;color:#fff;background:var(--accent);border-radius:8px;padding:0 5px;")}>{activeCount}</span> : null}
              </button>
              {collapsed ? null : (
              <div style={s('display:flex;flex-wrap:wrap;gap:5px;padding-left:14px;')}>
                {g.options.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => toggleFacet(g.key, o.key)}
                    style={s(`display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px;border-radius:8px;cursor:pointer;font-size:11.5px;font-family:'Noto Sans JP',sans-serif;white-space:nowrap;transition:all .1s;border:1px solid ${o.on ? 'var(--accent)' : 'var(--border)'};background:${o.on ? 'var(--accent)' : 'var(--panel)'};color:${o.on ? '#fff' : o.count0 ? 'var(--text-3)' : 'var(--text)'};opacity:${o.count0 && !o.on ? '.45' : '1'};`)}
                  >
                    {o.label} <span style={s("font-family:'JetBrains Mono',monospace;font-size:9.5px;opacity:.7;")}>{o.count}</span>
                  </button>
                ))}
              </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- CompareTray partial ----
  function CompareTray({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
    const horizontal = orientation === 'horizontal';
    const scroll = horizontal ? 'flex:1;overflow-x:auto;overflow-y:hidden;padding:12px 13px;' : 'flex:1;overflow:auto;padding:12px 13px;';
    const imageGrid = horizontal ? 'display:flex;gap:10px;height:100%;align-items:stretch;' : 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    const detailList = horizontal ? 'display:flex;gap:10px;height:100%;' : 'display:flex;flex-direction:column;gap:9px;';
    const has = compareItems.length > 0;
    return (
      <div style={s('display:flex;flex-direction:column;min-height:0;background:var(--panel);height:100%;')}>
        <div style={s('flex:none;display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--border);background:var(--panel);')}>
          <span style={s('font-size:14px;')}>📌</span>
          <span style={s('font-weight:700;font-size:13px;')}>{tr('compareTray')}</span>
          <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-3);")}>{compareItems.length}/12</span>
          <div style={s('flex:1;')} />
          <div style={s('display:flex;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:2px;gap:2px;')}>
            <button onClick={() => setCompareMode('images')} style={s(seg(compareMode === 'images'))}>{tr('images')}</button>
            <button onClick={() => setCompareMode('details')} style={s(seg(compareMode === 'details'))}>{tr('details')}</button>
          </div>
          {has ? (
            <button onClick={() => setCompare([])} title={tr('removeAll')} style={s('width:28px;height:26px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text-2);cursor:pointer;font-size:12px;')}>✕</button>
          ) : null}
          <button onClick={() => setSidebarOpen(false)} title={tr('collapse')} style={s('width:28px;height:26px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text-2);cursor:pointer;font-size:12px;')}>⤬</button>
        </div>
        {!has ? (
          <div style={s('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text-3);padding:24px;text-align:center;')}>
            <div style={s('width:44px;height:44px;border-radius:11px;border:1.5px dashed var(--border-2);display:flex;align-items:center;justify-content:center;font-size:18px;')}>＋</div>
            <div style={s('font-size:12px;line-height:1.7;')}>{tr('compareEmpty')}</div>
          </div>
        ) : compareMode === 'images' ? (
          <div style={s(scroll)}>
            <div style={s(imageGrid)}>
              {compareItems.map((it) => (
                <div key={it.id} style={s(horizontal ? 'position:relative;flex:none;width:128px;' : 'position:relative;')}>
                  <div onClick={() => setSelectedId(it.id)} className="pcv-cmpimg" style={s('cursor:pointer;aspect-ratio:.72;border-radius:9px;overflow:hidden;border:1px solid var(--border);background:var(--panel-2);position:relative;')}>
                    <CardArt card={it} fontSize={38} />
                    <span style={s('position:absolute;left:0;right:0;bottom:0;padding:5px 6px;background:linear-gradient(transparent,var(--panel));font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;z-index:1;')}>{it.name}</span>
                  </div>
                  <button onClick={() => toggleCompare(it.id)} title={tr('remove')} style={s('position:absolute;right:5px;top:5px;width:20px;height:20px;border-radius:6px;border:1px solid var(--border);background:rgba(255,255,255,.86);backdrop-filter:blur(4px);color:var(--text-2);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;z-index:2;')}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={s(scroll)}>
            <div style={s(detailList)}>
              {compareItems.map((it) => (
                <div key={it.id} style={s(horizontal ? 'display:flex;gap:10px;padding:9px;border:1px solid var(--border);border-radius:10px;background:var(--panel);min-width:300px;' : 'display:flex;gap:10px;padding:9px;border:1px solid var(--border);border-radius:10px;background:var(--panel);min-width:0;')}>
                  <div onClick={() => setSelectedId(it.id)} style={s('cursor:pointer;flex:none;width:54px;aspect-ratio:.72;border-radius:7px;overflow:hidden;border:1px solid var(--border);background:var(--panel-2);position:relative;')}>
                    <CardArt card={it} fontSize={24} />
                  </div>
                  <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;')}>
                    <div style={s('display:flex;align-items:center;gap:6px;')}>
                      <span style={s('font-weight:700;font-size:12.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{it.name}</span>
                      {it.flag ? <span style={s("font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;color:var(--bg);background:var(--text);border-radius:4px;padding:1px 5px;")}>{tval(it.flag)}</span> : null}
                      <button onClick={() => toggleCompare(it.id)} style={s('width:18px;height:18px;border:none;border-radius:5px;background:var(--hover);color:var(--text-2);cursor:pointer;font-size:10px;')}>✕</button>
                    </div>
                    <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;font-size:10.5px;')}>
                      {([
                        { id: 'hp', label: tr('hp'), value: it.hp == null ? '—' : String(it.hp), strong: true },
                        { id: 'type', label: tr('type'), value: glyphFor(it.type), strong: true },
                        { id: 'weak', label: tr('weakness'), value: it.weakness ? glyphFor(it.weakness) : '—', strong: false },
                        { id: 'retreat', label: tr('retreat'), value: it.retreat == null ? '—' : String(it.retreat), strong: false },
                        { id: 'dpe', label: tr('maxDpe'), value: it.dpe ? it.dpe.toFixed(1) : '—', accent: true },
                        { id: 'ability', label: tr('ability'), value: it.hasAbility && it.ability ? it.ability.name : '—', strong: false },
                      ]).map((r) => (
                        <div key={r.id} style={s('display:flex;justify-content:space-between;gap:4px;min-width:0;')}>
                          <span style={s('color:var(--text-3);flex:none;')}>{r.label}</span>
                          <span style={s(`font-family:'JetBrains Mono',monospace;${r.accent ? 'font-weight:600;color:var(--accent);' : r.strong ? 'font-weight:600;' : ''}overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`)}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pcv" style={rootStyle}>
      <style>{SCOPED_CSS}</style>

      {/* HEADER */}
      <header style={s('flex:none;display:flex;align-items:center;gap:18px;height:52px;padding:0 16px;border-bottom:1px solid var(--border);background:var(--panel);')}>
        <div style={s('display:flex;align-items:center;gap:10px;')}>
          <div style={s("width:26px;height:26px;border-radius:7px;background:var(--text);color:var(--bg);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;letter-spacing:-.04em;")}>A</div>
          <div style={s('display:flex;flex-direction:column;line-height:1.15;')}>
            <span style={s('font-weight:700;font-size:13px;letter-spacing:.02em;')}>PTCG ABC Viewer</span>
            <span style={s("font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;letter-spacing:.02em;")}>card database</span>
          </div>
        </div>
        <div style={s('display:flex;background:var(--panel-2);border:1px solid var(--border);border-radius:9px;padding:2px;gap:2px;')}>
          <button onClick={() => setMode('search')} style={s(seg(mode === 'search'))}>{tr('searchMode')}</button>
          <button onClick={() => setMode('deck')} style={s(seg(mode === 'deck'))}>{tr('deckMode')}</button>
        </div>
        <div style={s('flex:1;')} />
        <div style={s("display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2);")}>
          <span style={s('display:flex;align-items:center;gap:6px;')}><span style={s('width:6px;height:6px;border-radius:50%;background:var(--accent);')} />{lang}</span>
          <span>{en ? <><b style={s('color:var(--text);')}>{refCards.length.toLocaleString()}</b> cards</> : <>全 <b style={s('color:var(--text);')}>{refCards.length.toLocaleString()}</b> 枚</>}</span>
        </div>
        {langSwitch ? <div style={s('display:flex;align-items:center;')}>{langSwitch}</div> : null}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={tr('themeToggle')} style={s('flex:none;width:32px;height:32px;border-radius:9px;border:1px solid var(--border);background:var(--panel-2);color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;')}>{theme === 'dark' ? '☀' : '☾'}</button>
      </header>

      {/* TOOLBAR */}
      <div style={s('flex:none;display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border);background:var(--panel);')}>
        <div style={s('display:flex;flex-direction:column;line-height:1.2;min-width:128px;')}>
          <span style={s("font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;")}>{resultCount.toLocaleString()} <span style={s('color:var(--text-3);font-weight:400;')}>{en ? 'results' : '件'}</span></span>
          <span style={s("font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;")}>{en ? `Showing ${Math.min(renderLimit, resultCount).toLocaleString()}` : `${Math.min(renderLimit, resultCount).toLocaleString()} 件表示中`}</span>
        </div>
        <div style={s('position:relative;flex:1;max-width:420px;')}>
          <span style={s('position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:13px;pointer-events:none;')}>⌕</span>
          <input className="pcv-search" value={query} onChange={(e) => { setQuery(e.target.value); setRenderLimit(120); }} placeholder={tr('searchPlaceholder')} style={s("width:100%;height:34px;padding:0 30px 0 30px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--text);font-family:'Noto Sans JP',sans-serif;font-size:12.5px;outline:none;")} />
          {q.length > 0 ? (
            <button onClick={() => { setQuery(''); setRenderLimit(120); }} style={s('position:absolute;right:7px;top:50%;transform:translateY(-50%);width:20px;height:20px;border:none;border-radius:6px;background:var(--hover);color:var(--text-2);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;')}>✕</button>
          ) : null}
        </div>
        <div style={s('display:flex;align-items:center;gap:4px;')}>
          <div style={s('position:relative;')}>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={s("appearance:none;height:34px;padding:0 28px 0 11px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--text);font-family:'Noto Sans JP',sans-serif;font-size:12.5px;cursor:pointer;outline:none;")}>
              <option value="id">{tr('sort_id')}</option>
              <option value="name">{tr('sort_name')}</option>
              <option value="hp">{tr('sort_hp')}</option>
              <option value="retreat">{tr('sort_retreat')}</option>
              <option value="dpe">{tr('sort_dpe')}</option>
              <option value="expansion">{tr('sort_expansion')}</option>
            </select>
            <span style={s('position:absolute;right:9px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:10px;color:var(--text-3);')}>▾</span>
          </div>
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} title={tr('sortDir')} style={s("width:34px;height:34px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--text);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:13px;")}>{sortDir === 'asc' ? '↑' : '↓'}</button>
        </div>
        <div style={s('width:1px;height:22px;background:var(--border);')} />
        <button onClick={() => { setFavOnly(!favOnly); setRenderLimit(120); }} title={tr('favoritesOnly')} style={s(toolBtn(favOnly))}><span style={s('font-size:13px;')}>★</span> {tr('favorites')}</button>
        <div style={s('display:flex;background:var(--panel-2);border:1px solid var(--border);border-radius:9px;padding:2px;gap:2px;')}>
          <button onClick={() => setView('grid')} title={tr('gridView')} style={s(segIcon(view === 'grid'))}>▦</button>
          <button onClick={() => setView('table')} title={tr('tableView')} style={s(segIcon(view === 'table'))}>▤</button>
        </div>
      </div>

      {/* BODY */}
      <div style={s('flex:1;display:flex;min-height:0;')}>
        {showLeftRail ? (
          <aside style={s('flex:none;width:248px;border-right:1px solid var(--border);background:var(--panel);overflow:auto;')}>
            <Filters orientation="vertical" />
          </aside>
        ) : null}

        <div style={s('flex:1;display:flex;flex-direction:column;min-width:0;')}>
          {mode === 'deck' ? (
            <div style={s('flex:none;display:flex;align-items:center;gap:10px;padding:9px 16px;background:var(--accent-soft);border-bottom:1px solid var(--border);font-size:12px;color:var(--text-2);')}>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.08em;color:var(--accent);border:1px solid var(--accent);border-radius:5px;padding:2px 7px;")}>DECK</span>
              <span>{tr('deckBanner')}</span>
            </div>
          ) : null}

          <main style={s('flex:1;overflow:auto;min-height:0;')}>
            {resultCount === 0 ? (
              <div style={s('height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:var(--text-3);padding:40px;')}>
                <div style={s('width:56px;height:56px;border-radius:14px;border:1.5px dashed var(--border-2);display:flex;align-items:center;justify-content:center;font-size:24px;')}>⌕</div>
                <div style={s('text-align:center;line-height:1.7;')}>
                  <div style={s('font-size:14px;font-weight:600;color:var(--text-2);')}>{tr('noResults')}</div>
                  <div style={s('font-size:12px;')}>{tr('noResultsHint')}</div>
                </div>
                <button onClick={() => { setFilters({}); setQuery(''); setFavOnly(false); setRenderLimit(120); }} style={s("margin-top:4px;height:32px;padding:0 16px;border:1px solid var(--border);border-radius:9px;background:var(--panel);color:var(--text);cursor:pointer;font-size:12px;font-family:'Noto Sans JP',sans-serif;")}>{tr('clearConditions')}</button>
              </div>
            ) : view === 'grid' ? (
              <div style={s('display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;padding:16px;')}>
                {visible.map((c) => {
                  const sel = c.id === selectedId;
                  return (
                    <div key={c.id} className="pcv-tile" onClick={() => setSelectedId(c.id)} style={s(`cursor:pointer;border-radius:11px;overflow:hidden;border:1px solid ${sel ? 'var(--accent)' : 'var(--border)'};background:var(--panel);box-shadow:var(--shadow);transition:transform .14s,box-shadow .14s,border-color .14s;`)}>
                      <div style={s('position:relative;aspect-ratio:.72;background:var(--panel-2);overflow:hidden;border-bottom:1px solid var(--border);')}>
                        <CardArt card={c} fontSize={52} />
                        {c.flag ? <span style={s("position:absolute;left:8px;top:8px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.04em;color:var(--bg);background:var(--text);border-radius:5px;padding:2px 6px;z-index:2;")}>{tval(c.flag)}</span> : null}
                        <div style={s('position:absolute;right:7px;top:7px;display:flex;flex-direction:column;gap:5px;z-index:2;')}>
                          <button onClick={(e) => { e.stopPropagation(); toggleFav(c.id); }} title={tr('favorites')} style={s(shapeBtn(favSet.has(c.id), false))}>{favSet.has(c.id) ? '★' : '☆'}</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleCompare(c.id); }} title={tr('compare')} style={s(shapeBtn(cmpSet.has(c.id), false))}>{cmpSet.has(c.id) ? '✓' : '＋'}</button>
                        </div>
                        {sel ? <span style={s('position:absolute;inset:0;border:2px solid var(--accent);pointer-events:none;z-index:2;')} /> : null}
                      </div>
                      <div style={s('padding:8px 9px 9px;display:flex;flex-direction:column;gap:4px;')}>
                        <div style={s('display:flex;align-items:baseline;gap:6px;')}>
                          <span style={s('font-weight:600;font-size:12.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{c.name}</span>
                          {c.hp != null ? <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2);flex:none;")}><span style={s('font-size:8px;')}>HP</span>{c.hp}</span> : null}
                        </div>
                        <div style={s("display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-3);")}>
                          <span>#{String(c.gid).padStart(4, '0')}</span>
                          <span style={s('display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;border-radius:4px;border:1px solid var(--border-2);font-size:9px;color:var(--text-2);')}>{glyphFor(c.type)}</span>
                          <span style={s('overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{tval(c.stage)}</span>
                          <span style={s('flex:1;')} />
                          {c.retreat != null ? <span title={tr('retreatEnergy')}>⟲{c.retreat}</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table style={s('width:100%;border-collapse:collapse;font-size:12px;')}>
                <thead>
                  <tr style={s('position:sticky;top:0;z-index:2;background:var(--panel-2);')}>
                    <th style={TH('width:38px;')} />
                    <th style={TH("width:78px;font-family:'JetBrains Mono',monospace;")}>ID</th>
                    <th style={TH('')}>{tr('colName')}</th>
                    <th style={TH('width:84px;')}>{tr('colKind')}</th>
                    <th style={TH('width:84px;')}>{tr('colStage')}</th>
                    <th style={TH('width:52px;text-align:center;')}>{tr('type')}</th>
                    <th style={TH('width:56px;text-align:right;')}>HP</th>
                    <th style={TH('width:60px;text-align:right;')}>{tr('retreat')}</th>
                    <th style={TH('width:72px;')}>{tr('expansion')}</th>
                    <th style={TH('width:86px;text-align:right;')}>{tr('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => {
                    const sel = c.id === selectedId;
                    return (
                      <tr key={c.id} className="pcv-row" onClick={() => setSelectedId(c.id)} style={s(`cursor:pointer;background:${sel ? 'var(--accent-soft)' : 'transparent'};transition:background .1s;`)}>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);')}>
                          <div style={s('width:24px;height:34px;border-radius:4px;background:var(--panel-2);border:1px solid var(--border);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text);')}>
                            <span style={s('opacity:.5;')}>{glyphFor(c.type)}</span>
                            {pdfUrl ? <CardImage url={pdfUrl} page={c.id + indexPageCount} alt="" scale={1} thumb className="pcv-imgfill" /> : null}
                          </div>
                        </td>
                        <td style={s("padding:5px 10px;border-bottom:1px solid var(--border);font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2);")}>#{String(c.gid).padStart(4, '0')}</td>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);')}>
                          <div style={s('display:flex;align-items:center;gap:7px;')}>
                            <span style={s('font-weight:600;')}>{c.name}</span>
                            {c.flag ? <span style={s("font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;color:var(--bg);background:var(--text);border-radius:4px;padding:1px 5px;")}>{tval(c.flag)}</span> : null}
                            {c.hasAbility ? <span title={tr('hasAbilityOpt')} style={s('font-size:9px;color:var(--accent);border:1px solid var(--accent);border-radius:4px;padding:0 4px;')}>{tr('abilityShort')}</span> : null}
                          </div>
                        </td>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);color:var(--text-2);')}>{tval(c.supertype)}</td>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);color:var(--text-2);')}>{tval(c.stage)}</td>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);text-align:center;')}><span style={s('display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--border-2);font-size:10px;')}>{glyphFor(c.type)}</span></td>
                        <td style={s("padding:5px 10px;border-bottom:1px solid var(--border);text-align:right;font-family:'JetBrains Mono',monospace;color:var(--text);")}>{c.hp == null ? '—' : c.hp}</td>
                        <td style={s("padding:5px 10px;border-bottom:1px solid var(--border);text-align:right;font-family:'JetBrains Mono',monospace;color:var(--text-2);")}>{c.retreat == null ? '—' : `⟲${c.retreat}`}</td>
                        <td style={s("padding:5px 10px;border-bottom:1px solid var(--border);font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-3);")}>{c.expansion}</td>
                        <td style={s('padding:5px 10px;border-bottom:1px solid var(--border);')}>
                          <div style={s('display:flex;gap:5px;justify-content:flex-end;')}>
                            <button onClick={(e) => { e.stopPropagation(); toggleFav(c.id); }} title={tr('favorites')} style={s(shapeBtn(favSet.has(c.id), true))}>{favSet.has(c.id) ? '★' : '☆'}</button>
                            <button onClick={(e) => { e.stopPropagation(); toggleCompare(c.id); }} title={tr('compare')} style={s(shapeBtn(cmpSet.has(c.id), true))}>{cmpSet.has(c.id) ? '✓' : '＋'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {renderLimit < resultCount ? (
              <div style={s('display:flex;justify-content:center;padding:18px;')}>
                <button className="pcv-more" onClick={() => setRenderLimit(renderLimit + 120)} style={s("height:36px;padding:0 20px;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text);cursor:pointer;font-size:12.5px;font-family:'Noto Sans JP',sans-serif;")}>{tr('showMore')} <span style={s("font-family:'JetBrains Mono',monospace;color:var(--text-3);")}>{en ? `(${(resultCount - renderLimit).toLocaleString()} left)` : `（残り ${(resultCount - renderLimit).toLocaleString()} 件）`}</span></button>
              </div>
            ) : null}
          </main>

          {showBottomCompare ? (
            <div style={s('flex:none;height:206px;border-top:1px solid var(--border);background:var(--panel);display:flex;flex-direction:column;')}>
              <CompareTray orientation="horizontal" />
            </div>
          ) : null}
        </div>

        {showRightCompare ? (
          <aside style={s(`flex:none;position:relative;width:${sidebarWidth}px;border-left:1px solid var(--border);background:var(--panel);display:flex;flex-direction:column;min-height:0;`)}>
            <div onMouseDown={startResize} style={s('position:absolute;left:-3px;top:0;bottom:0;width:7px;cursor:col-resize;z-index:5;')} />
            <CompareTray orientation="vertical" />
          </aside>
        ) : null}

        {showReopenHandle ? (
          <button onClick={() => setSidebarOpen(true)} title={tr('openCompare')} style={s('flex:none;width:40px;border-left:1px solid var(--border);background:var(--panel);color:var(--text-2);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;writing-mode:vertical-rl;font-size:12px;')}>
            <span style={s('font-size:15px;writing-mode:horizontal-tb;')}>📌</span>
            {tr('compareTray')}
            {compareItems.length ? <span style={s("writing-mode:horizontal-tb;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--accent);color:#fff;border-radius:10px;padding:1px 6px;")}>{compareItems.length}</span> : null}
          </button>
        ) : null}
      </div>

      {/* DETAIL */}
      {sc ? (
        <div onClick={() => setSelectedId(null)} style={s('position:fixed;inset:0;z-index:50;background:rgba(8,8,10,.5);backdrop-filter:blur(3px);display:flex;align-items:stretch;justify-content:center;')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:760px;height:100%;background:var(--bg);box-shadow:var(--shadow-lg);display:flex;flex-direction:column;animation:ptcgpop .2s cubic-bezier(.2,.7,.3,1);border-left:1px solid var(--border);border-right:1px solid var(--border);')}>
            <div style={s('flex:none;display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--border);background:var(--panel);')}>
              <button onClick={() => setSelectedId(null)} style={s('width:32px;height:32px;border:1px solid var(--border);border-radius:9px;background:var(--panel-2);color:var(--text);cursor:pointer;font-size:14px;')}>←</button>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-3);")}>#{String(sc.gid).padStart(4, '0')}</span>
              <div style={s('flex:1;')} />
              <button onClick={() => toggleFav(sc.id)} style={s(`display:flex;align-items:center;gap:5px;height:32px;padding:0 11px;border-radius:9px;cursor:pointer;font-size:12px;font-family:'Noto Sans JP',sans-serif;border:1px solid ${favSet.has(sc.id) ? 'var(--accent)' : 'var(--border)'};background:${favSet.has(sc.id) ? 'var(--accent)' : 'var(--panel-2)'};color:${favSet.has(sc.id) ? '#fff' : 'var(--text)'};`)}>{favSet.has(sc.id) ? '★' : '☆'} {tr('favorites')}</button>
              <button onClick={() => toggleCompare(sc.id)} style={s(`display:flex;align-items:center;gap:5px;height:32px;padding:0 11px;border-radius:9px;cursor:pointer;font-size:12px;font-family:'Noto Sans JP',sans-serif;border:1px solid ${cmpSet.has(sc.id) ? 'var(--accent)' : 'var(--border)'};background:${cmpSet.has(sc.id) ? 'var(--accent)' : 'var(--panel-2)'};color:${cmpSet.has(sc.id) ? '#fff' : 'var(--text)'};`)}>{cmpSet.has(sc.id) ? '✓' : '＋'} {tr('compare')}</button>
              <div style={s('width:1px;height:22px;background:var(--border);')} />
              <button onClick={() => stepCard(-1)} title={tr('prevCard')} style={s("width:32px;height:32px;border:1px solid var(--border);border-radius:9px;background:var(--panel-2);color:var(--text);cursor:pointer;font-family:'JetBrains Mono',monospace;")}>‹</button>
              <button onClick={() => stepCard(1)} title={tr('nextCard')} style={s("width:32px;height:32px;border:1px solid var(--border);border-radius:9px;background:var(--panel-2);color:var(--text);cursor:pointer;font-family:'JetBrains Mono',monospace;")}>›</button>
            </div>

            <div style={s('flex:1;overflow:auto;padding:24px;')}>
              <div style={s('display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;')}>
                <div style={s('flex:none;width:228px;aspect-ratio:.716;border-radius:12px;overflow:hidden;border:1px solid var(--border);position:relative;background:var(--panel-2);box-shadow:var(--shadow);')}>
                  <CardArt card={sc} fontSize={96} />
                </div>
                <div style={s('flex:1;min-width:240px;display:flex;flex-direction:column;gap:14px;')}>
                  <div>
                    <div style={s('display:flex;align-items:center;gap:8px;flex-wrap:wrap;')}>
                      <h2 style={s('margin:0;font-size:26px;font-weight:700;letter-spacing:-.01em;')}>{sc.name}</h2>
                      {sc.flag ? <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--bg);background:var(--text);border-radius:6px;padding:3px 8px;")}>{tval(sc.flag)}</span> : null}
                    </div>
                    <div style={s('margin-top:4px;font-size:12.5px;color:var(--text-2);')}>{[tval(sc.supertype), tval(sc.stage), sc.type ? `${tr('type')} ${tval(sc.type)}` : null].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div style={s('display:flex;gap:8px;flex-wrap:wrap;')}>
                    {([
                      sc.hp != null ? ['HP', String(sc.hp)] : null,
                      sc.type ? [tr('type'), glyphFor(sc.type)] : null,
                      sc.retreat != null ? [tr('retreat'), `⟲${sc.retreat}`] : null,
                      sc.dpe ? [tr('maxDpe'), sc.dpe.toFixed(1)] : null,
                    ].filter(Boolean) as [string, string][]).map(([label, value]) => (
                      <div key={label} style={s('display:flex;flex-direction:column;gap:2px;min-width:62px;padding:8px 11px;border:1px solid var(--border);border-radius:9px;background:var(--panel);')}>
                        <span style={s("font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);font-family:'JetBrains Mono',monospace;")}>{label}</span>
                        <span style={s("font-size:15px;font-weight:600;font-family:'JetBrains Mono',monospace;")}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {sc.hasAbility && sc.ability ? (
                <div style={s('margin-top:24px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--panel);')}>
                  <div style={s('display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--accent-soft);border-bottom:1px solid var(--border);')}>
                    <span style={s("font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--accent);font-family:'JetBrains Mono',monospace;")}>{tr('ability')}</span>
                    <span style={s('font-weight:700;font-size:14px;')}>{sc.ability.name}</span>
                  </div>
                  <div style={s('padding:12px 14px;font-size:12.5px;color:var(--text-2);line-height:1.8;')}>{sc.ability.text}</div>
                </div>
              ) : null}

              {sc.attacks.length ? (
                <div style={s('margin-top:16px;display:flex;flex-direction:column;gap:10px;')}>
                  <span style={s("font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--text-3);font-family:'JetBrains Mono',monospace;")}>{tr('attacks')}</span>
                  {sc.attacks.map((a, i) => (
                    <div key={i} style={s('border:1px solid var(--border);border-radius:12px;padding:13px 14px;background:var(--panel);')}>
                      <div style={s('display:flex;align-items:center;gap:10px;')}>
                        <div style={s('display:flex;gap:3px;flex:none;')}>
                          {a.cost.map((t, j) => (
                            <span key={j} style={s("display:inline-flex;align-items:center;justify-content:center;width:21px;height:21px;border-radius:50%;border:1px solid var(--border-2);background:var(--panel-2);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;")}>{t}</span>
                          ))}
                        </div>
                        <span style={s('font-weight:700;font-size:14.5px;flex:1;')}>{a.name}</span>
                        <span style={s("font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;")}>{a.damage}</span>
                      </div>
                      {a.text ? <div style={s('margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;color:var(--text-2);line-height:1.75;')}>{a.text}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div style={s('margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden;')}>
                {([
                  [tr('expansion'), sc.expansion],
                  [tr('category'), sc.category],
                  [tr('weakness'), sc.weakness ? `${glyphFor(sc.weakness)}×2` : '—'],
                  [tr('resistance'), sc.resist ? `${glyphFor(sc.resist)}-30` : '—'],
                ] as [string, ReactNode][]).map(([label, value]) => (
                  <div key={label} style={s('background:var(--panel);padding:10px 13px;display:flex;flex-direction:column;gap:3px;')}>
                    <span style={s("font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);font-family:'JetBrains Mono',monospace;")}>{label}</span>
                    <span style={s('font-size:12.5px;font-weight:500;')}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
