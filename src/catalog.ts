import React from 'react';
import {Afterglow} from './projects/art/afterglow/Afterglow';
import {Ch1Derivative, CH1_SECONDS} from './projects/learning/calculus/Ch1Derivative';
import {Ch2Integral, CH2_SECONDS} from './projects/learning/calculus/Ch2Integral';
import {Ch3Fundamental, CH3_SECONDS} from './projects/learning/calculus/Ch3Fundamental';

// One catalog drives both the Remotion Studio folders and the preview page.

export type Video = {
  /** Remotion composition id: letters, digits and '-' only. */
  id: string;
  title: string;
  summary: string;
  component: React.ComponentType<any>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  /** Props for final renders. */
  defaultProps?: Record<string, unknown>;
  /** Props for live playback in a browser, where heavy effects are lightened. */
  previewProps?: Record<string, unknown>;
  /** Frame used for the gallery thumbnail. */
  poster: number;
};

export type Project = {
  id: string;
  title: string;
  blurb: string;
  videos: Video[];
};

export type Category = {
  id: string;
  /** Remotion folder name: letters, digits and '-' only. */
  folder: string;
  name: string;
  blurb: string;
  projects: Project[];
};

const FPS = 30;

export const CATALOG: Category[] = [
  {
    id: 'learning',
    folder: 'Learning',
    name: 'Learning',
    blurb: 'Explainers that teach one idea properly, with every step drawn.',
    projects: [
      {
        id: 'calculus',
        title: 'Calculus, visually',
        blurb: 'Three short chapters: the derivative, the integral, and the theorem that joins them.',
        videos: [
          {
            id: 'Calculus-01-Derivative',
            title: 'The derivative',
            summary: 'Speed at a single instant: secant lines shrink into a tangent, and the algebra agrees.',
            component: Ch1Derivative,
            durationInFrames: CH1_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 37 * FPS,
          },
          {
            id: 'Calculus-02-Integral',
            title: 'The integral',
            summary: 'Distance from speed: thin rectangles add up, and their limit is the area under the curve.',
            component: Ch2Integral,
            durationInFrames: CH2_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 35 * FPS,
          },
          {
            id: 'Calculus-03-Fundamental-Theorem',
            title: 'The fundamental theorem',
            summary: 'Why derivatives and integrals undo each other, and how that turns 256 rectangles into one line.',
            component: Ch3Fundamental,
            durationInFrames: CH3_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 27 * FPS,
          },
        ],
      },
    ],
  },
  {
    id: 'art',
    folder: 'Art',
    name: 'Art',
    blurb: 'Generative films: landscapes and light, made entirely from code.',
    projects: [
      {
        id: 'afterglow',
        title: 'Afterglow',
        blurb: 'One generated valley through one day of light, with an original synthesized score.',
        videos: [
          {
            id: 'Afterglow',
            title: 'Afterglow',
            summary: 'Eighteen ridgelines, a mirrored lake and a 48-second day, from before dawn to blue hour.',
            component: Afterglow,
            durationInFrames: 1440,
            fps: FPS,
            width: 1920,
            height: 1080,
            defaultProps: {quality: 'final'},
            previewProps: {quality: 'preview'},
            poster: 960,
          },
        ],
      },
    ],
  },
];
