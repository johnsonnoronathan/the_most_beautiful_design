import './page.css';
import {Player, PlayerRef, Thumbnail} from '@remotion/player';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CATALOG, Category, Page, Project, Video} from '../../studio/catalog';

// Everything on the shelves: videos play in the Remotion Player, pages (designs) load live
// from pages/<project>/, where build.mjs copies them.
type Entry = {cat: Category; project: Project; index: number; id: string} & ({kind: 'video'; video: Video} | {kind: 'page'; page: Page});

const ENTRIES: Entry[] = CATALOG.flatMap((cat) =>
  cat.projects.flatMap((project): Entry[] => [
    ...project.videos.map((video, index) => ({cat, project, index, id: video.id, kind: 'video' as const, video})),
    ...project.pages.map((page, index) => ({cat, project, index, id: page.id, kind: 'page' as const, page})),
  ]),
);

const pageUrl = (project: Project, page: Page) => `pages/${project.id}/${page.file}`;
const thumbUrl = (project: Project, page: Page) => `pages/${project.id}/assets/thumbs/${page.file.replace(/\.html$/, '.jpg')}`;
const size = (w: number, h: number) => `${w} × ${h}`;

const slug = (id: string) => id.toLowerCase();

const timecode = (frames: number, fps: number) => {
  const s = Math.round(frames / fps);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const propsFor = (v: Video) => v.previewProps ?? v.defaultProps ?? {};

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const initialId = () => {
  try {
    const hash = window.location.hash.slice(1);
    const hit = ENTRIES.find((e) => slug(e.id) === hash);
    if (hit) return hit.id;
  } catch {
    // no hash access; fall through
  }
  return ENTRIES[0].id;
};

const ExportLine: React.FC<{id: string}> = ({id}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const command = `npx remotion render ${id}`;
  const copy = () => {
    const selectText = () => {
      const el = codeRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    };
    try {
      navigator.clipboard.writeText(command).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }, selectText);
    } catch {
      selectText();
    }
  };
  return (
    <div className="export">
      <span className="label">Export to MP4 from the repo</span>
      <div className="export-row">
        <code ref={codeRef}>{command}</code>
        <button type="button" className="copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const Reel: React.FC<{entry: Entry & {kind: 'video'}; active: boolean; onPick: () => void}> = ({entry, active, onPick}) => {
  const {video, project, index} = entry;
  const inputProps = useMemo(() => propsFor(video), [video]);
  return (
    <li>
      <button type="button" className="reel" aria-current={active ? 'true' : undefined} onClick={onPick}>
        <span className="thumb">
          <Thumbnail
            component={video.component}
            compositionWidth={video.width}
            compositionHeight={video.height}
            frameToDisplay={video.poster}
            durationInFrames={video.durationInFrames}
            fps={video.fps}
            inputProps={inputProps}
            style={{width: '100%'}}
          />
          <span className="badge">{timecode(video.durationInFrames, video.fps)}</span>
          {active ? <span className="now">Now playing</span> : null}
        </span>
        <span className="reel-kicker">{project.videos.length > 1 ? `Chapter ${index + 1}` : 'Film'}</span>
        <span className="reel-title">{video.title}</span>
      </button>
    </li>
  );
};

const DesignCard: React.FC<{entry: Entry & {kind: 'page'}; active: boolean; onPick: () => void}> = ({entry, active, onPick}) => {
  const {page, project} = entry;
  return (
    <li>
      <button type="button" className="reel" aria-current={active ? 'true' : undefined} onClick={onPick}>
        <span className="thumb is-design">
          <img src={thumbUrl(project, page)} alt="" width={1200} height={900} loading="lazy" />
          <span className="badge">{size(page.width, page.height)}</span>
          {active ? <span className="now">On stage</span> : null}
        </span>
        <span className="reel-kicker">{page.kicker}</span>
        <span className="reel-title">{page.title}</span>
      </button>
    </li>
  );
};

// A design on the stage: the page itself in a frame, sized to its artboard (plus its toolbar).
// The page says when it is up (frame.js posts 'design-ready'); until then its screenshot shows,
// and if it never comes (a host that refuses frames) the screenshot stays with a link to open it.
const DesignScreen: React.FC<{project: Project; page: Page}> = ({project, page}) => {
  const [state, setState] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source && e.source === frameRef.current?.contentWindow && e.data?.type === 'design-ready') setState('ready');
    };
    window.addEventListener('message', onMessage);
    const t = setTimeout(() => setState((s) => (s === 'ready' ? s : 'blocked')), 8000);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(t);
    };
  }, []);
  return (
    <div className="design" data-state={state} style={{aspectRatio: `${page.width} / ${page.height + 60}`}}>
      <img className="design-poster" src={thumbUrl(project, page)} alt="" />
      <iframe ref={frameRef} className="design-frame" src={`${pageUrl(project, page)}#stage`} title={`${page.title} (live page)`} />
      {state === 'blocked' ? (
        <div className="design-blocked">
          <p>The live page could not load inside this frame.</p>
          <a className="open" href={pageUrl(project, page)}>
            Open the page
          </a>
        </div>
      ) : null}
    </div>
  );
};

const App: React.FC = () => {
  const [currentId, setCurrentId] = useState(initialId);
  const [filter, setFilter] = useState<string>('all');
  const [inOrder, setInOrder] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const stageRef = useRef<HTMLElement>(null);

  const cur = ENTRIES.find((e) => e.id === currentId) ?? ENTRIES[0];
  const {cat, project, index} = cur;
  const video = cur.kind === 'video' ? cur.video : null;
  const page = cur.kind === 'page' ? cur.page : null;
  const siblings = project.videos;
  const next = video ? siblings[index + 1] : undefined;
  const inputProps = useMemo(() => (video ? propsFor(video) : {}), [video]);
  const count = project.videos.length + project.pages.length;

  const select = (id: string, play: boolean, scroll: boolean) => {
    setAutoPlay(play);
    setCurrentId(id);
    try {
      window.history.replaceState(null, '', `#${slug(id)}`);
    } catch {
      // the frame may refuse history changes; selection still works
    }
    if (scroll) stageRef.current?.scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start'});
  };

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const onEnded = () => {
      if (inOrder && next) select(next.id, true, false);
    };
    p.addEventListener('ended', onEnded);
    return () => p.removeEventListener('ended', onEnded);
  });

  const shelves = CATALOG.filter((c) => filter === 'all' || c.id === filter);
  const countIn = (c: Category) => c.projects.reduce((n, p) => n + p.videos.length + p.pages.length, 0);

  return (
    <div className="room">
      <header className="masthead">
        <div className="brand">
          <p className="wordmark">Screening Room</p>
          <p className="tagline">Every project, live: films play in your browser and designs work right on the stage. Nothing needs rendering or downloading.</p>
        </div>
        <nav className="filters" aria-label="Categories">
          {[{id: 'all', name: 'All', n: ENTRIES.length}, ...CATALOG.map((c) => ({id: c.id, name: c.name, n: countIn(c)}))].map((f) => (
            <button key={f.id} type="button" className="filter" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.name}
              <span className="count">{f.n}</span>
            </button>
          ))}
        </nav>
      </header>

      <section className="stage" ref={stageRef} aria-label={video ? 'Now playing' : 'On stage'}>
        <div className={video ? 'screen' : 'screen is-design'}>
          {page ? <DesignScreen key={page.id} project={project} page={page} /> : null}
          {video ? (
            <Player
              key={video.id}
              ref={playerRef}
              component={video.component}
              durationInFrames={video.durationInFrames}
              compositionWidth={video.width}
              compositionHeight={video.height}
              fps={video.fps}
              inputProps={inputProps}
              controls
              autoPlay={autoPlay}
              clickToPlay
              doubleClickToFullscreen
              allowFullscreen
              spaceKeyToPlayOrPause
              acknowledgeRemotionLicense
              style={{width: '100%'}}
            />
          ) : null}
        </div>

        <aside className="details">
          <p className="eyebrow">
            {cat.name} · {project.title}
            {count > 1 ? ` · ${index + 1} of ${count}` : ''}
          </p>
          <h1 className="title">{(video ?? page)!.title}</h1>
          <p className="summary">{(video ?? page)!.summary}</p>
          {page ? (
            <>
              <dl className="specs">
                <div>
                  <dt>Kind</dt>
                  <dd>{page.kind}</dd>
                </div>
                <div>
                  <dt>Artboard</dt>
                  <dd>{size(page.width, page.height)}</dd>
                </div>
                <div>
                  <dt>File</dt>
                  <dd>{page.file}</dd>
                </div>
              </dl>
              <div className="chapters">
                <ol>
                  {project.pages.map((p, i) => (
                    <li key={p.id}>
                      <button type="button" className="chapter" aria-current={p.id === page.id ? 'true' : undefined} onClick={() => select(p.id, false, false)}>
                        <span className="chapter-n">{i + 1}</span>
                        <span className="chapter-title">{p.title}</span>
                        <span className="chapter-time">{p.kind}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="export">
                <span className="label">Full window, or straight from disk</span>
                <div className="export-row">
                  <code>
                    projects/{project.id}/{page.file}
                  </code>
                  <a className="copy" href={pageUrl(project, page)}>
                    Open
                  </a>
                </div>
              </div>
            </>
          ) : null}
          {video ? (
            <>
              <dl className="specs">
                <div>
                  <dt>Runtime</dt>
                  <dd>{timecode(video.durationInFrames, video.fps)}</dd>
                </div>
                <div>
                  <dt>Frames</dt>
                  <dd>{video.durationInFrames.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt>Rate</dt>
                  <dd>{video.fps} fps</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>
                    {video.width} × {video.height}
                  </dd>
                </div>
              </dl>

              {siblings.length > 1 ? (
                <div className="chapters">
                  <ol>
                    {siblings.map((v, i) => (
                      <li key={v.id}>
                        <button type="button" className="chapter" aria-current={v.id === video.id ? 'true' : undefined} onClick={() => select(v.id, true, false)}>
                          <span className="chapter-n">{i + 1}</span>
                          <span className="chapter-title">{v.title}</span>
                          <span className="chapter-time">{timecode(v.durationInFrames, v.fps)}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <label className="toggle" htmlFor="in-order">
                    <input id="in-order" type="checkbox" checked={inOrder} onChange={(e) => setInOrder(e.target.checked)} />
                    Play the next chapter when one ends
                  </label>
                </div>
              ) : null}

              <ExportLine id={video.id} />
            </>
          ) : null}
        </aside>
      </section>

      <main className="library">
        {shelves.map((c) => (
          <section key={c.id} className="shelf" aria-labelledby={`shelf-${c.id}`}>
            <div className="shelf-head">
              <h2 id={`shelf-${c.id}`}>{c.name}</h2>
              <p>{c.blurb}</p>
            </div>
            {c.projects.map((p) => {
              const total = p.videos.reduce((n, v) => n + v.durationInFrames / v.fps, 0);
              const meta = p.videos.length
                ? `${p.videos.length} ${p.videos.length > 1 ? 'chapters' : 'film'} · ${timecode(total, 1)}`
                : `${p.pages.length} ${p.pages.length > 1 ? 'designs' : 'design'} · live pages`;
              return (
                <div key={p.id} className="project">
                  <div className="project-head">
                    <h3>{p.title}</h3>
                    <p>{p.blurb}</p>
                    <span className="project-meta">
                      {meta} · projects/{p.id}
                    </span>
                  </div>
                  <ul className="reels">
                    {ENTRIES.filter((e) => e.project.id === p.id).map((e) =>
                      e.kind === 'video' ? (
                        <Reel key={e.id} entry={e} active={e.id === cur.id} onPick={() => select(e.id, false, true)} />
                      ) : (
                        <DesignCard key={e.id} entry={e} active={e.id === cur.id} onPick={() => select(e.id, false, true)} />
                      ),
                    )}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </main>

      <footer className="colophon">
        Everything here is code. The films are rendered live in your browser by Remotion; heavy effects in Afterglow are lightened for real-time playback, and exports use full
        quality. The designs are the project pages themselves, loaded live: the sun swatches, valley seeds, the day-of-light scrubber and the timer all work.
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
