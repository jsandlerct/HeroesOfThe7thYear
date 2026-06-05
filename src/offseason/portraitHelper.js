// Shared portrait rendering helper.
// Wraps a portrait image in stacked thin rectangular borders — one per year of service.
// yearOfService=0 → 1 ring (Year 1); yearOfService=6 → 7 rings (Year 7 hero).

const RING_W   = 1;  // border width (px)
const RING_GAP = 2;  // gap between consecutive rings (px)
const RING_STEP = RING_W + RING_GAP;  // px allocated per ring

// Returns a wrapper <div> containing the portrait <img> and year-of-service rings.
// The rings extend outward from the image; the wrapper reserves padding for them.
// portrait — portrait object { file } or null
// unit     — roster unit with .yearOfService, .name
// size     — portrait image size in px (default 72)
export function makePortraitElement(portrait, unit, size = 72) {
  const years    = (unit.yearOfService ?? 0) + 1;
  const totalPad = years * RING_STEP;

  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    `position:relative;display:inline-block;flex-shrink:0;padding:${totalPad}px;`;

  const img = document.createElement('img');
  img.width  = size;
  img.height = size;
  img.style.cssText = 'object-fit:cover;display:block;';
  img.alt = unit.name ?? '';
  img.src = portrait ? portrait.file : '';
  if (!portrait) img.style.background = '#251a08';
  wrapper.appendChild(img);

  // Rainbow color per year: ring 1 (year 1) = red → violet at ring 7
  const RING_COLORS = [
    '220,30,30',   // red      (year 1)
    '230,100,20',  // orange   (year 2)
    '200,180,0',   // yellow   (year 3)
    '30,160,30',   // green    (year 4)
    '20,80,200',   // blue     (year 5)
    '60,0,180',    // indigo   (year 6)
    '130,0,160',   // violet   (year 7)
  ];

  // i=1 = innermost ring (year 1), i=years = outermost (most recent year)
  for (let i = 1; i <= years; i++) {
    const ring  = document.createElement('div');
    const inset = (years - i) * RING_STEP;
    const alpha = (0.35 + (i / years) * 0.40).toFixed(2);
    const color = RING_COLORS[(i - 1) % RING_COLORS.length];
    ring.style.cssText =
      `position:absolute;inset:${inset}px;` +
      `border:${RING_W}px solid rgba(${color},${alpha});` +
      `pointer-events:none;`;
    wrapper.appendChild(ring);
  }

  return wrapper;
}
