'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from 'ogl';
import './RippleDistortion.css';

const MAX_WAVES = 100;
const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 1 };
const START_SCALE = 1.5;
const LIFE_CONSTANT = Math.log(500);

const waveVertex = `
precision highp float;

attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;

varying vec2 vUv;
varying float vOpacity;

void main() {
  vUv = uv;
  vOpacity = iOpacity;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}
`;

const waveFragment = `
precision highp float;

varying vec2 vUv;
varying float vOpacity;

uniform float uRings;

const float PI = 3.141592653589793;
const float EDGE = 0.006737947;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;

  float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);

  brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);

  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}
`;

const RippleDistortion = ({
  src = 'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop',
  brushSize = 150,
  strength = 0.2,
  swirl = 1,
  rings = 4,
  spread = 5,
  fade = 3,
  spacing = 15,
  dispersion = 0,
  glint = 0,
  tint = '#a855f7',
  tintAmount = 0.1,
  grayscale = true,
  highlightColor = '#ffffff',
  trigger = 'hover',
  clickStrength = 2,
  quality = 'low',
  enabled = true,
  className = '',
  style
}) => {
  const mountRef = useRef(null);
  const configRef = useRef({});
  const uniformsRef = useRef(null);

  configRef.current = { brushSize, spread, fade, spacing, clickStrength, trigger, enabled };

  return <div ref={mountRef} className={`ripple-distortion ${className}`.trim()} style={style} />;
};

export default RippleDistortion;
