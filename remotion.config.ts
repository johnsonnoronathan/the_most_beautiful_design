import {Config} from '@remotion/cli/config';

Config.setEntryPoint('studio/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);

// In environments that ship their own Chromium (e.g. cloud sandboxes), point
// Remotion at it instead of downloading one.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
