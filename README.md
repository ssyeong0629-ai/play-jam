# PLAY JAM

A graphic sound-poster prototype. Open **index.html** directly in a browser. No installation, server, build step, framework, CDN, module imports or remote samples.

## Edit

- Pick an icon or Random. Click a staff to place it; placement plays its sound.
- Click an existing icon to select. Drag to move; handles resize/rotate.
- Click blank space or Esc to deselect; the next click places an icon.
- Enter adds the next icon at a regular beat interval after the last one.
- Arrow keys move; + / − resize; [ / ] rotate. Shift makes larger adjustments.
- Delete / Backspace removes the last effect first, then the instrument.
- Effect icons have a tiny corner dot. Select one and tap an instrument, or drag it onto an instrument. Maximum two effects.
- Snap optionally locks horizontal positions to equal beat intervals. Soft snapping remains available when Snap is off.
- Space plays/pauses. BPM changes timing. Loop is off by default.
- Drag the pink playhead to seek. Audio is quiet while dragging and resumes only if it was playing.
- Continuous scrolling score: 7 staves on the first page, 8 on each subsequent page. Reaching the last beat of a page creates the next page automatically. Enter continues onto the next staff.
- Playback ends half a beat after the last symbol, ignoring empty staves. Drag the playhead across staves to seek.
- Width view is the default. Fit page shows one complete A4. The default canvas fills the available width; the bottom Library can minimize or close.

## Save

Autosave uses this browser's localStorage. Browser/file permissions can affect persistence; use **Export → Project** for a portable JSON backup. Open project restores it.

PNG and PDF contain the poster artwork, not editing handles. Check “all pages” for all pages. Wallpaper is 1080 × 1920 with the complete poster centered. Hosted share links contain the score data in the fragment. Local files use JSON sharing instead of a non-working file URL.

Video recording is a short (up to 12 seconds) browser-native capture with audio. MP4 is used if supported, otherwise WebM. GIF is not implemented. Video support must be verified on each browser.

## Files

- `index.html`: all app views and menus
- `css/base.css`: colors, typography and shared controls
- `css/editor.css`: poster, editor and responsive layout
- `js/icons.js`: editable icon catalog and offline SVG strings for export
- `assets/icons/`: supplied artwork copied for this prototype (originals stay untouched)
- `js/editor.js`: project data, editing, selection, keyboard shortcuts, snapping, pagination, playback
- `js/audio.js`: Web Audio synthesis, adapted from the original PLAY-JAM.html
- `js/export.js`: PNG/PDF/project/link/video export
- `netlify.toml`: zero-build static publication configuration

## Updating

Keep the same GitHub repository and Netlify project. Commit updates to the connected production branch; Netlify redeploys automatically. Build command: **empty**. Publish directory: **.**. Never upload private project backups or credentials.

Project data has a `version: 2` field. Future incompatible schema changes must add a migration before changing this version. The original v1 HTML's browser storage is not overwritten.

## Prototype limitations

- The new icon-to-sound mapping and effect meanings are provisional, not a finalized musical taxonomy.
- Touch haptics depend on browser/device support; visual snapping feedback is always present.
- Audio begins after a user gesture; hover previews work after audio has been enabled by a tap/click.
- Offline saving/export, mobile pinch, recording and audible timing require real-browser QA. Automated syntax/DOM checks do not replace these.
- No separate bouncing “Toy” mode: placement sound, snap and neon feedback happen in the normal editor.

## Welcome and guide
START opens a four-step guide over the editor. Skip enters the editor directly. Use 사용법 to replay the guide. Shared score links bypass the welcome screen. The intro animation respects reduced motion.
