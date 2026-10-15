import React from 'react';
import {Afterglow} from '../projects/afterglow/Afterglow';
import {Ch1Derivative, CH1_SECONDS} from '../projects/calculus-visually/Ch1Derivative';
import {Ch2Integral, CH2_SECONDS} from '../projects/calculus-visually/Ch2Integral';
import {Ch3Fundamental, CH3_SECONDS} from '../projects/calculus-visually/Ch3Fundamental';
import {Ch4Limit, CH4_SECONDS} from '../projects/calculus-visually/Ch4Limit';
import {Ch5SineCosine, CH5_SECONDS} from '../projects/calculus-visually/Ch5SineCosine';
import {Ch6ChainRule, CH6_SECONDS} from '../projects/calculus-visually/Ch6ChainRule';
import afterglowStudies from '../projects/afterglow-studies/pages.json';
import ma from '../projects/ma/pages.json';

// One catalog drives both the Remotion Studio folders and the Screening Room.
// Each project lives in projects/<project id>/; the category is a label, not a folder.
// Videos are Remotion compositions; pages are standalone HTML designs, each described
// by its project's pages.json.

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

export type Page = {
  /** '<project id>-<file stem>', also the Screening Room's link to it. */
  id: string;
  /** The page's file in the project folder. */
  file: string;
  title: string;
  /** Short label, e.g. 'No. 01 · Poster'. */
  kicker: string;
  /** One word: Poster, App, Sheet, Interactive, Series. */
  kind: string;
  summary: string;
  /** Artboard size in px. */
  width: number;
  height: number;
};

export type Project = {
  /** Also the project's folder name under projects/. */
  id: string;
  title: string;
  blurb: string;
  videos: Video[];
  pages: Page[];
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

type PagesJson = {title: string; blurb: string; pages: Omit<Page, 'id'>[]};

const pageProject = (id: string, json: PagesJson): Project => ({
  id,
  title: json.title,
  blurb: json.blurb,
  videos: [],
  pages: json.pages.map((p) => ({...p, id: `${id}-${p.file.replace(/\.html$/, '')}`})),
});

export const CATALOG: Category[] = [
  {
    id: 'learning',
    folder: 'Learning',
    name: 'Learning',
    blurb: 'Explainers that teach one idea properly, with every step drawn.',
    projects: [
      {
        id: 'calculus-visually',
        title: 'Calculus, visually',
        blurb: 'Six short chapters: the derivative, the integral, the theorem that joins them, the limit underneath, the derivatives that go in circles, and the chain rule.',
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
          {
            id: 'Calculus-04-Limit',
            title: 'The limit',
            summary: 'What “approaching” really means: a 0/0 hole, a thousandfold zoom, and the ε–δ challenge that makes it exact.',
            component: Ch4Limit,
            durationInFrames: CH4_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 49 * FPS,
          },
          {
            id: 'Calculus-05-Sine-Cosine',
            title: 'Sine and cosine',
            summary: 'Why the slope of sine is cosine: a point on the unit circle, its velocity a quarter turn ahead, and the four-step cycle behind every spring.',
            component: Ch5SineCosine,
            durationInFrames: CH5_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 45 * FPS,
          },
          {
            id: 'Calculus-06-Chain-Rule',
            title: 'The chain rule',
            summary: 'Why rates multiply: a nudge stretched by one function, then rescaled by the next, on three number lines that zoom in together.',
            component: Ch6ChainRule,
            durationInFrames: CH6_SECONDS * FPS,
            fps: FPS,
            width: 1920,
            height: 1080,
            poster: 45 * FPS,
          },
        ],
        pages: [],
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
        pages: [],
      },
    ],
  },
  {
    id: 'design',
    folder: 'Design',
    name: 'Design',
    blurb: 'Posters, an app and studies, made on the design canvas and rebuilt as live pages.',
    projects: [pageProject('ma', ma), pageProject('afterglow-studies', afterglowStudies)],
  },
];
