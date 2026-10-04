# 0012 — A captioned seal illustration in the history section

**Status:** Accepted · 2026-10-04 · Amends the seal restriction in [0005](0005-design-system.md)

The maintainer supplied a Calatagan seal image and expressly requested a dimensional rendition
with left-to-right rotation and the same artwork on the back, integrated into the site.

Place it beside the overview history introduction as an illustration, with a visible caption
identifying it as a stylised rendition and the site as an independent civic project. Retain the
existing site mark, masthead, favicons and independence banner. This is not a verified official
artwork asset or evidence for civic facts.

Use CSS perspective and two backface-hidden image planes, separated by a small depth offset.
Rotate the back plane by 180 degrees so its text remains readable. Provide a native checkbox
to pause/resume the animation and disable animation under `prefers-reduced-motion`. No Three.js
or new runtime dependency is needed for this effect; this is a dimensional image presentation,
not an exported volumetric mesh.

The self-contained SVG embeds a 640-pixel transparent WebP version of the AI-assisted render.
It is a raster-backed SVG, not vector paths. The asset is local and lazy-loaded. A future true
vector edition would require redrawing the lettering and individual symbols.
