FormaLab 

OPENING SECTION
The v40 FormaLab wordmark, colors, size, fade-in and line animation stay on the first screen; the exit fade is removed. No extra opening text or buttons. Scroll down for the original Overview. Navigation is hidden at the top of Overview, then appears as a floating bar after scrolling. Other pages keep navigation visible. The opening adjusts to phones, tablets and desktops and respects reduced motion.

PRICING
Printing time has been removed. Model-based weight estimates and manual slicer weight remain. pricing.js contains separate per-gram rates for P1S and A1 mini; both retain existing prices until you choose different rates.

WEBSITE
Three pages: Overview with a three-step guide and Reviews; Services & print with upload, pricing and Request form; About & Contact. Upload limit: 250 MB per STL or 3MF file; parsing large models depends on device memory. Services keeps materials, upload and calculator together. The 3D bundle loads only on Services. Quote and form state persist between pages in this browser session.

DEPLOY
Open this formalab folder in your terminal and run: vercel --prod
No Python service or Bambu Studio installation is needed for the website.
No Supabase/database changes are required. Reviews still need approval.

PREVIEW
The separate preview HTML includes all pages and a bundled 3D viewer. Open it in a browser.

Floating navigation is consistent on all pages. Overview sections reveal on scroll, respecting reduced motion. Added build dimensions, color-finishing and quotation details.
