# Agency logos

The official mark of each agency is shown in a small white tile wherever the site credits a source
(the home page manifesto, the sources ring, and every source card). The tile is a plain frame —
square, rounded corners, no ring — so it presents the agency's own artwork rather than imitating a
seal.

| File | Agency | Taken from |
| --- | --- | --- |
| `psa.png` | Philippine Statistics Authority | Agency emblem, from Wikimedia Commons `File:Philippine Statistics Authority.svg` (the PSA site publishes only a horizontal lockup) |
| `dilg.png` | Department of the Interior and Local Government | Agency seal, from Wikimedia Commons `File:Department of the Interior and Local Government (DILG) Seal - Logo.svg` |
| `blgf.png` | Bureau of Local Government Finance | `blgf.gov.ph/wp-content/uploads/2026/08/cropped-favicon-8.png` (the seal used in the bureau's own masthead) |
| `dof.png` | Department of Finance | `dof.gov.ph/wp-content/uploads/2024/02/DOF-1024x1024.png` |
| `nhcp.png` | National Historical Commission of the Philippines | Agency seal, from Wikimedia Commons `File:National Historical Commission of the Philippines (NHCP).svg` (the NHCP site was behind a bot check) |
| `ia.png` | Internet Archive | Wikimedia Commons `File:Internet Archive Logo.svg` (public domain) |

All six were retrieved on 5 November 2026 and resized to 256 px; nothing was redrawn or recoloured.
Drop `svg`, `png` or `webp` versions here to replace a tile — `src/components/AgencyBadge.astro`
picks the file up at build and falls back to the agency's initials when a file is absent.

The logos credit where data comes from; they do not imply endorsement, and the site keeps its
independence notice on every page.
