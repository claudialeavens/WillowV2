import React from 'react';

// Decorative artwork only: labels and action controls remain live HTML.
export const PetalBranchArtwork = () => <svg className="petal-branch-art" viewBox="0 0 400 360" fill="none" aria-hidden="true">
  <g className="petal-branch-stems" strokeLinecap="round">
    <path d="M195 315C180 250 94 212 32 165M205 315C220 250 306 212 368 165" />
    <path d="M99 219C76 183 77 151 81 126M301 219C324 183 323 151 319 126" />
  </g>
  <g fill="#8fa46b" stroke="#6e8754" strokeWidth="1">
    <path d="M93 212Q40 212 35 178Q70 176 93 212Z" />
    <path d="M77 171Q43 156 52 130Q80 139 77 171Z" />
    <path d="M309 212Q362 212 367 178Q332 176 309 212Z" />
    <path d="M323 171Q357 156 348 130Q320 139 323 171Z" />
    <path d="M143 258Q93 266 80 239Q116 225 143 258Z" />
    <path d="M257 258Q307 266 320 239Q284 225 257 258Z" />
  </g>
  <g className="petal-branch-buds" stroke="#d6a59b" strokeWidth="1">
    <path d="M81 131Q57 111 78 95Q103 111 81 131Z" />
    <path d="M319 131Q295 111 316 95Q341 111 319 131Z" />
    <path d="M35 169Q13 151 30 137Q53 149 35 169Z" />
    <path d="M365 169Q343 151 360 137Q383 149 365 169Z" />
  </g>
  <g transform="translate(200 175)">
    {[0, 60, 120, 180, 240, 300].map(angle => <path key={angle} className="petal-branch-blossom" transform={`rotate(${angle})`} d="M0 0C-71-20-77-91 0-143C77-91 71-20 0 0Z" />)}
    <circle r="66" fill="#fff8df" stroke="#ede0ad" strokeWidth="1.5" />
  </g>
</svg>;
