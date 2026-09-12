// src/components/library-list/listMetrics.ts
// Shared layout metrics for the card / list switch surfaces. The rows, the playlist column header
// and both adapters measure against these values, so the list can be centred without the header
// drifting away from the columns underneath it, and so it keeps clear of the chrome that is pinned
// to the edges of the viewport.

/**
 * Caps the row content on wide displays.
 *
 * A 1920px wide row pushes the album column and the duration so far apart that the row stops
 * reading as a single record, so the content is centred in a fixed column and the scrollbar stays
 * at the edge of the surface.
 */
export const LIBRARY_LIST_CONTENT_CLASS = 'mx-auto w-full max-w-[72rem]';

/**
 * Reserves the band occupied by the surface control pills (view switch, tabs, actions) that the
 * home grid pins to its top with `absolute top-2`. The pills are roughly 30px tall and sit 8px
 * down, so 64px leaves the first row under them with a little breathing room.
 */
export const LIBRARY_LIST_TOP_INSET_CLASS = 'mt-16';

/**
 * Reserves the band occupied by the floating player, which is pinned to the bottom of the viewport
 * with `absolute bottom-8` and would otherwise sit on top of the last rows. A margin is used rather
 * than padding so the scroll viewport itself ends above the player instead of letting rows slide
 * behind it.
 */
export const LIBRARY_LIST_BOTTOM_INSET_CLASS = 'mb-24 md:mb-28';

/**
 * Reserves the playlist detail header band.
 *
 * The home surface only pins a thin row of control pills to its top, but the playlist detail pins
 * three separate pieces to `top-5`: the 40px back button, the layout toggle cluster, and a centred
 * title block. That block is the awkward one — it has no width cap, so a long playlist name wraps,
 * and its subtitle always renders for playlists and can take two more 19px lines. Measured from the
 * top of the viewport the tallest combination ends around 133px, so the band is 136px and the sort
 * toolbar and the column header start below the chrome instead of on top of the back button.
 * Padding rather than margin, because the whole surface is inset and not just the rows.
 */
export const LIBRARY_LIST_PLAYLIST_TOP_INSET_CLASS = 'pt-[8.5rem]';

/**
 * Left inset applied while the playlist info panel is open, so the rows stay readable beside the
 * panel instead of scrolling underneath it. The panel is pinned to `left-6` and is 320px wide, so
 * 368px clears it with a little breathing room. Only from `md` up: on a phone the panel is nearly
 * full width and the list has nowhere to move to.
 */
export const LIBRARY_LIST_SIDE_PANEL_INSET_CLASS = 'md:pl-[23rem]';

/**
 * Extra rows kept mounted beyond the viewport. Local covers are served by the OPFS service worker
 * under a small concurrency budget, so keeping a few rows ahead means the thumbnail is usually
 * already decoded by the time it scrolls into view.
 */
export const LIBRARY_LIST_OVERSCAN_COUNT = 8;
