# Homepage photograph review — 29 September 2026

User requested the supplied Kerala billboard photograph adapted as the homepage background, with the ability to undo this photo treatment after review.

The original reference is saved as `reference.png`. A copy of the homepage immediately before the photo change is saved as `page-before.tsx.txt`; it includes the existing frontend improvements and is not the Git baseline.

Photo-only changes:

- `src/app/page.tsx`: adds `next/image` and `./home-hero.css` imports; adds `hero-photograph` to the hero section and a decorative optimized photograph; removes only the old CSS billboard illustration markup.
- `src/app/home-hero.css`: new, isolated, responsive photo treatment.
- `public/images/home/kerala-billboard-hero-v1.png`: generated landscape asset. The supplied reference is retained separately.

To undo on the user's request, remove the two added imports and the `hero-photo` element, restore the section class to `hero`, and restore the `hero-visual` markup from the saved snapshot. Remove the CSS import before retiring the new stylesheet/asset. Preserve other homepage improvements and all upload, booking, payment, dashboard and backend work. If the homepage has changed since this snapshot, do not overwrite the whole page.

Generation used the built-in image tool. Prompt: Adapt the supplied coastal Kerala LED billboard into a photorealistic 2.7:1 landscape homepage hero. Preserve the dark metal screen, single pole, palms, sand, ocean, and sunset backwaters/houseboat display. Place the billboard in the right half and naturally extend quiet pale sky/coast to the left for the existing dark headline and buttons. Remove the small display slogan. No added typography, logos, watermarks, UI, people or extra billboards. Warm coastal light and professional architectural composition.

Status: implemented for user review; approval of appearance remains with the user. This change does not modify product decisions, payment behavior, or the implementation phase sequence.

Verification: desktop and phone screenshots were visually inspected; the image loaded and the homepage had no horizontal overflow at 320, 375, 768 or 1440 CSS pixels. Next.js serves the photograph through responsive image optimization, with eager/high-priority loading and a reserved hero height. The final production build, lint, 85-test regression suite, documentation checks and client bundle scan against two configured server secrets passed. The homepage browser preview is retained for review.

## User-supplied replacement — 29 September 2026

The user subsequently requested replacing the photograph with the supplied waterfront-road image featuring a Pixlwave-branded billboard. The supplied PNG is copied unchanged to `public/images/home/kerala-billboard-hero-v2.png`; matching SHA-256 hashes confirm the copy. Only the image source in `src/app/page.tsx` changes for this replacement. Existing responsive framing and readability overlays are retained.

The previous `kerala-billboard-hero-v1.png` remains available. To undo only this replacement, change the homepage image source back to `/images/home/kerala-billboard-hero-v1.png`. To undo the entire photograph treatment, follow the original photo-only instructions above.

Replacement review: desktop and 375px mobile screenshots inspected; no horizontal overflow at 320, 375, 768 or 1440 CSS pixels. Screenshots are saved as `replacement-desktop.png` and `replacement-mobile.png`. This replacement uses the supplied image directly, without image generation or backend changes. Earlier full regression results above belong to the original photo implementation.

## Clarity revision — 30 September 2026

The supplied v2 image is only 1024 × 377 pixels and looked soft when stretched across the desktop hero. A new version was generated with the built-in image tool using v2 as the edit target, keeping the waterfront road, right-hand billboard, Pixlwave name and slogan. The tool produced a sharper 2048 × 768 image; it was exported at 3840 × 1440 pixels as `public/images/home/kerala-billboard-hero-v3-4k.webp` using Lanczos resampling at WebP quality 92. The final file is about 0.99 MB. The 3840-pixel width is an export size; native generated detail is 2048 pixels wide.

Generation prompt: Recreate and enhance the supplied waterfront-road billboard photograph as a crisp panoramic homepage hero. Preserve the sunset water on the left, Kerala palm-lined road, elevated billboard on the upper right, blue/green wave logo, and exact billboard text “pixlwave” and “Connect Your Brand to the World.” Improve natural scene detail and clean typography without adding objects, slogans, UI or watermarks; target a 3840-pixel-wide, approximately 2.7:1 composition.

`src/app/page.tsx` now uses v3 at Next image quality 90, and `next.config.ts` permits that quality. To restore the supplied image, point the homepage source back to `/images/home/kerala-billboard-hero-v2.png` and remove the quality override if it is no longer wanted. The existing v1 and v2 assets are retained for review and rollback.
