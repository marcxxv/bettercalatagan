# Agency logos

Drop an agency's official logo here to replace its initials badge across the site
(the home page manifesto, the sources ring, and every source card):

| File | Agency |
| --- | --- |
| `psa.svg` / `psa.png` / `psa.webp` | Philippine Statistics Authority |
| `dilg.*` | Department of the Interior and Local Government |
| `blgf.*` | Bureau of Local Government Finance |
| `dof.*` | Department of Finance |
| `nhcp.*` | National Historical Commission of the Philippines |
| `ia.*` | Internet Archive |

Use the file each agency publishes itself (square, transparent background, at least 128 px).
The logos credit where data comes from; they do not imply endorsement, and the site keeps its
independence notice on every page. `src/components/AgencyBadge.astro` picks the file up at build.
