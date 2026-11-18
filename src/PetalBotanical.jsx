import React, { useId } from 'react';
import { botanicalDesign } from './petalBotanicalDesign';

export const PetalBotanical = ({ petal, seed }) => {
  const id = useId().replace(/:/g, '');
  const design = botanicalDesign(petal, seed);
  return <svg className="petal-card-botanical" viewBox="0 0 180 160" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false" data-botanical-seed={seed}>
    <defs><linearGradient id={`botanical-fade-${id}`}><stop offset="0" stopColor="white" stopOpacity="0" /><stop offset=".45" stopColor="white" /></linearGradient><mask id={`botanical-mask-${id}`}><rect width="180" height="160" fill={`url(#botanical-fade-${id})`} /></mask></defs>
    <g mask={`url(#botanical-mask-${id})`} opacity=".8">
      {design.branches.map((branch, index) => <g key={index}><path d={branch.path} fill="none" stroke={`hsl(${design.leafHue} 27% 46%)`} strokeWidth="1.1" />{branch.leaves.map((leaf, leafIndex) => <g key={leafIndex} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}><path d={`M0 0 Q${leaf.width} ${leaf.length * .4} 0 ${leaf.length} Q${-leaf.width} ${leaf.length * .4} 0 0`} fill={`hsl(${leaf.hue} 33% ${leaf.light}%)`} /><path d={`M0 2 L0 ${leaf.length - 2}`} stroke="#fff9" strokeWidth=".5" /></g>)}</g>)}
      {design.flowers.map((flower, index) => <g key={index} transform={`translate(${flower.x} ${flower.y}) rotate(${flower.rotation})`}>{Array.from({ length: flower.petals }, (_, petalIndex) => <ellipse key={petalIndex} cx="0" cy={-flower.radius * .7} rx={flower.radius * .45} ry={flower.radius * .8} fill={`hsl(${design.flowerHue} 66% ${86 + index % 3 * 4}%)`} transform={`rotate(${petalIndex * 360 / flower.petals})`} />)}<circle r={flower.radius * .3} fill={`hsl(${design.flowerHue} 58% 57%)`} /></g>)}
    </g>
  </svg>;
};
