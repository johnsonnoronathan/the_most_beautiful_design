import './page.css';
import {Player, PlayerRef, Thumbnail} from '@remotion/player';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CATALOG, Category, Project, Video} from '../../studio/catalog';

type Entry = {cat: Category; project: Project; video: Video; index: number};

const ENTRIES: Entry[] = CATALOG.flatMap((cat) =>
  cat.projects.flatMap((project) => project.videos.map((video, index) => ({cat, project, video, index}))),
);

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
    const hit = ENTRIES.find((e) => slug(e.video.id) === hash);
    if (hit) return hit.video.id;
  } catch {
    // no hash access; fall through
  }
  return ENTRIES[0].video.id;
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
      navigator.clipboard.writeText(command).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        },
        selectText,
      );
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

const Reel: React.FC<{entry: Entry; active: boolean; onPick: () => void}> = ({entry, active, onPick}) => {
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

const App: React.FC = () => {
  const [currentId, setCurrentId] = useState(initialId);
  const [filter, setFilter] = useState<string>('all');
  const [inOrder, setInOrder] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const stageRef = useRef<HTMLElement>(null);

  const cur = ENTRIES.find((e) => e.video.id === currentId) ?? ENTRIES[0];
  const {cat, project, video, index} = cur;
  const siblings = project.videos;
  const next = siblings[index + 1];
  const inputProps = useMemo(() => propsFor(video), [video]);

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
  const countIn = (c: Category) => c.projects.reduce((n, p) => n + p.videos.length, 0);

  return (
    <div className="room">
      <header className="masthead">
        <div className="brand">
          <p className="wordmark">Screening Room</p>
          <p className="tagline">Live previews of every video project. Press play to watch; nothing needs rendering or downloading.</p>
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

      <section className="stage" ref={stageRef} aria-label="Now playing">
        <div className="screen">
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
        </div>

        <aside className="details">
          <p className="eyebrow">
            {cat.name} · {project.title}
            {siblings.length > 1 ? ` · ${index + 1} of ${siblings.length}` : ''}
          </p>
          <h1 className="title">{video.title}</h1>
          <p className="summary">{video.summary}</p>
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
              return (
                <div key={p.id} className="project">
                  <div className="project-head">
                    <h3>{p.title}</h3>
                    <p>{p.blurb}</p>
                    <span className="project-meta">
                      {p.videos.length} {p.videos.length > 1 ? 'chapters' : 'film'} · {timecode(total, 1)} · projects/{p.id}
                    </span>
                  </div>
                  <ul className="reels">
                    {ENTRIES.filter((e) => e.project.id === p.id).map((e) => (
                      <Reel key={e.video.id} entry={e} active={e.video.id === video.id} onPick={() => select(e.video.id, false, true)} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </main>

      <footer className="colophon">
        Every film here is code, rendered live in your browser by Remotion. Heavy effects in Afterglow are lightened for real-time playback; exports use full quality.
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
