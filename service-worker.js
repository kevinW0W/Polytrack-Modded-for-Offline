/* Root-scoped offline cache for the GitHub Pages app. */
const CACHE_NAME = "polytrack-modded-v11";
const APP_SHELL = [
  "./index.html",
  "./PolyTracksMain.html",
  "./service-worker.js",
  "./main/manifest.json",
  "./java/main.bundle.js",
  "./java/controller-support.js",
  "./java/custom-scrollbar.js",
  "./java/simulation_worker.bundle.js",
  "./data/a82f15d48dbc61b6edeb.ttf",
  "./data/a82f15d48dbc61b6edeb.woff2",
  "./data/apple-touch-icon.png",
  "./data/audio/checkpoint.flac",
  "./data/audio/click.flac",
  "./data/audio/collision.flac",
  "./data/audio/editor_edit.flac",
  "./data/audio/engine.flac",
  "./data/audio/music.mp3",
  "./data/audio/skidding.flac",
  "./data/audio/suspension.flac",
  "./data/audio/tires.flac",
  "./data/cursor/Account.cur",
  "./data/cursor/Alias.cur",
  "./data/cursor/All Scroll.cur",
  "./data/cursor/App Starting.cur",
  "./data/cursor/Arrow.cur",
  "./data/cursor/Cell.cur",
  "./data/cursor/Closed Hand.cur",
  "./data/cursor/Column Resize.cur",
  "./data/cursor/Copy.cur",
  "./data/cursor/Crosshair.cur",
  "./data/cursor/Cursor Scheme.crs",
  "./data/cursor/Drag Alias.cur",
  "./data/cursor/Drag Copy.cur",
  "./data/cursor/Handwriting.cur",
  "./data/cursor/Help.cur",
  "./data/cursor/Horizontal Scroll.cur",
  "./data/cursor/Horizontal Text Select.cur",
  "./data/cursor/Location Select.cur",
  "./data/cursor/No Drop.cur",
  "./data/cursor/Not Allowed.cur",
  "./data/cursor/Open Hand.cur",
  "./data/cursor/Pointer.cur",
  "./data/cursor/Resize Diagonal Backward.cur",
  "./data/cursor/Resize Diagonal Forward.cur",
  "./data/cursor/Row Resize.cur",
  "./data/cursor/Straight Select.cur",
  "./data/cursor/Text Select.cur",
  "./data/cursor/Vertical Scroll.cur",
  "./data/cursor/Wait.cur",
  "./data/cursor/Zoom In.cur",
  "./data/cursor/Zoom Out.cur",
  "./data/favicon.ico",
  "./data/forced_square.json",
  "./data/images/apply.svg",
  "./data/images/arrow_down.svg",
  "./data/images/arrow_left.svg",
  "./data/images/arrow_right.svg",
  "./data/images/arrow_up.svg",
  "./data/images/back.svg",
  "./data/images/cancel.svg",
  "./data/images/car_stripe.svg",
  "./data/images/checkpoint.svg",
  "./data/images/clouds.jpg",
  "./data/images/copy.svg",
  "./data/images/customize.svg",
  "./data/images/delete.svg",
  "./data/images/discord.svg",
  "./data/images/editor.svg",
  "./data/images/erase.svg",
  "./data/images/export.svg",
  "./data/images/helmet.svg",
  "./data/images/help.svg",
  "./data/images/icon.svg",
  "./data/images/import.svg",
  "./data/images/load.svg",
  "./data/images/logo.svg",
  "./data/images/pause.svg",
  "./data/images/pin.svg",
  "./data/images/play.svg",
  "./data/images/preview.svg",
  "./data/images/quit.svg",
  "./data/images/random.svg",
  "./data/images/reset.svg",
  "./data/images/reset_settings.svg",
  "./data/images/rotate.svg",
  "./data/images/save.svg",
  "./data/images/settings.svg",
  "./data/images/smoke.png",
  "./data/images/state_invalid.svg",
  "./data/images/state_pending.svg",
  "./data/images/state_verified.svg",
  "./data/images/test.svg",
  "./data/images/verified.svg",
  "./data/IMG_1300.png",
  "./data/lib/ammo.wasm.js",
  "./data/lib/ammo.wasm.wasm",
  "./data/models/block.glb",
  "./data/models/car.glb",
  "./data/models/pillar.glb",
  "./data/models/plane.glb",
  "./data/models/road.glb",
  "./data/models/road_wide.glb",
  "./data/models/signs.glb",
  "./data/models/wall_track.glb",
  "./data/pwa-192.png",
  "./data/pwa-512.png",
  "./data/pwa-maskable-512.png",
  "./data/tracks/7loops.track",
  "./data/tracks/acrobatics.track",
  "./data/tracks/amethystSkyscraper.track",
  "./data/tracks/arrgh.track",
  "./data/tracks/bismuthMines.track",
  "./data/tracks/CurvePractice.track",
  "./data/tracks/easyHard.track",
  "./data/tracks/Formula1_3.track",
  "./data/tracks/Formula1_4.track",
  "./data/tracks/Formula1_5.track",
  "./data/tracks/Formula1_6.track",
  "./data/tracks/Formula1_7.track",
  "./data/tracks/fullestSpeed.track",
  "./data/tracks/Fun.track",
  "./data/tracks/fun2.track",
  "./data/tracks/FunLoops.track",
  "./data/tracks/grr.track",
  "./data/tracks/Hi.track",
  "./data/tracks/hillyHighway.track",
  "./data/tracks/impossibleSlidePro.track",
  "./data/tracks/impossibleTrack.track",
  "./data/tracks/jadeMountain.track",
  "./data/tracks/jailbreak.track",
  "./data/tracks/lakesideLoop.track",
  "./data/tracks/longLine.track",
  "./data/tracks/LongRun.track",
  "./data/tracks/loop.track",
  "./data/tracks/loopingSpeed.track",
  "./data/tracks/mingleTrack1.track",
  "./data/tracks/onNewHights.track",
  "./data/tracks/opalPalace.track",
  "./data/tracks/quartzCity.track",
  "./data/tracks/sakurasubterrain.track",
  "./data/tracks/satisfactory.track",
  "./data/tracks/slopedCurve.track",
  "./data/tracks/sludgeWorks.track",
  "./data/tracks/smallLoop.track",
  "./data/tracks/speedDifficult.track",
  "./data/tracks/speedster.track",
  "./data/tracks/spiral_out.track",
  "./data/tracks/swerve.track",
  "./data/tracks/TestSpeedsd.track",
  "./data/tracks/theRollercoaster.track",
  "./data/tracks/TheTrackQLD2Lap.track",
  "./data/tracks/track1.track",
  "./data/tracks/track10.track",
  "./data/tracks/track10Modded.track",
  "./data/tracks/track11.track",
  "./data/tracks/track11Modded.track",
  "./data/tracks/track12.track",
  "./data/tracks/track13.track",
  "./data/tracks/track2.track",
  "./data/tracks/track3.track",
  "./data/tracks/track4.track",
  "./data/tracks/track4modded.track",
  "./data/tracks/track5.track",
  "./data/tracks/track6.track",
  "./data/tracks/track7.track",
  "./data/tracks/track8.track",
  "./data/tracks/track9.track",
  "./data/tracks/trackList.json",
  "./data/tracks/Upsidedown.track",
  "./data/tracks/wallClimb.track",
  "./data/tracks/wallClimb2.track"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("polytrack-modded-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        return (await cache.match("./index.html")) || Response.error();
      }
      return Response.error();
    }
  })());
});
