import React from 'react';
import {Composition} from 'remotion';
import {Afterglow} from './Afterglow';

export const RemotionRoot: React.FC = () => (
  <Composition id="Afterglow" component={Afterglow} durationInFrames={1440} fps={30} width={1920} height={1080} />
);
