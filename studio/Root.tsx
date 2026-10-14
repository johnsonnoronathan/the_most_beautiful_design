import React from 'react';
import {Composition, Folder} from 'remotion';
import {CATALOG} from './catalog';

// Studio sidebar mirrors the catalog: Category / Project / Video.
// Page projects (designs) have no compositions and are left out.
const hasVideos = (p: {videos: unknown[]}) => p.videos.length > 0;

export const RemotionRoot: React.FC = () => (
  <>
    {CATALOG.filter((cat) => cat.projects.some(hasVideos)).map((cat) => (
      <Folder key={cat.id} name={cat.folder}>
        {cat.projects.filter(hasVideos).map((project) => (
          <Folder key={project.id} name={project.id}>
            {project.videos.map((v) => (
              <Composition
                key={v.id}
                id={v.id}
                component={v.component}
                durationInFrames={v.durationInFrames}
                fps={v.fps}
                width={v.width}
                height={v.height}
                defaultProps={v.defaultProps ?? {}}
              />
            ))}
          </Folder>
        ))}
      </Folder>
    ))}
  </>
);
