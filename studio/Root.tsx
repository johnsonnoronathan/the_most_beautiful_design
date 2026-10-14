import React from 'react';
import {Composition, Folder} from 'remotion';
import {CATALOG} from './catalog';

// Studio sidebar mirrors the catalog: Category / Project / Video.
export const RemotionRoot: React.FC = () => (
  <>
    {CATALOG.map((cat) => (
      <Folder key={cat.id} name={cat.folder}>
        {cat.projects.map((project) => (
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
