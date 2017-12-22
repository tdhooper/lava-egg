/*
  <p>This example shows how to implement a movable camera with regl.</p>
 */

const glm = require('gl-matrix');
const mat4 = glm.mat4;
const vec3 = glm.vec3;
const bunny = require('bunny')
const fit = require('canvas-fit')
const normals = require('angle-normals');
const icosphere = require('icosphere');

const canvas = document.body.appendChild(document.createElement('canvas'))
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  canvas: canvas
});
const camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

camera.distance = 2;

const mesh = icosphere(0);
// const mesh = bunny;

const cameraPosition = vec3.create();

const backfaces = regl.framebuffer({
  width: window.outerWidth,
  height: window.outerHeight,
  colorType: 'float'
});

const setupScene = regl({
  cull: {
    enable: true,
    face: 'back'
  },
  vert: `
    precision mediump float;
    uniform mat4 proj;
    uniform mat4 model;
    uniform mat4 view;
    attribute vec3 position;
    attribute vec3 normal;
    varying vec3 vnormal;
    varying vec3 vposition;
    void main () {
      vnormal = normal;
      vposition = position;
      gl_Position = proj * view * model * vec4(position, 1.0);
    }`,
  attributes: {
    position: mesh.positions,
    normal: normals(mesh.cells, mesh.positions)
  },
  elements: mesh.cells,
  uniforms: {
    proj: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 2,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    model: mat4.identity([]),
    view: () => camera.view(),
    cameraPosition: () => {
      vec3.set(cameraPosition, 0, 0, camera.distance);
      vec3.transformQuat(cameraPosition, cameraPosition, camera.rotation);
      return cameraPosition;
    },
    tick: regl.context('tick')
  },
});

const drawBackfaces = regl({
  frontFace: 'cw',
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    varying vec3 vposition;
    uniform vec3 cameraPosition;
    uniform float tick;
    void main () {
      float dist = length(vposition - cameraPosition);
      gl_FragColor = vec4(dist, 0, 0, 1);
      // gl_FragColor = vec4(abs(vnormal), 1.0);
    }`,
    framebuffer: backfaces
});

const drawScene = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    varying vec3 vposition;
    uniform sampler2D backfaces;
    uniform vec2 resolution;
    uniform vec3 cameraPosition;
    uniform float tick;
    void main () {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec3 col = texture2D(backfaces, uv).rgb;
      float dist = length(vposition - cameraPosition);
      float thickness = col.r - dist;
      gl_FragColor = vec4(abs(vnormal), 1.0);
      gl_FragColor = vec4(vec3(uv, 1), 1);
      // gl_FragColor = vec4(vec3(col.r / 20.), 1);
      gl_FragColor = vec4(vec3(thickness / 2.), 1);
      // gl_FragColor = vec4(vec3(dist / 20.), 1);
      // gl_FragColor = vec4(normalize(cameraPosition) * .5 + .5, 1);
      // gl_FragColor = vec4(normalize(vposition) * .5 + .5, 1);
    }`,
    uniforms: {
      backfaces: backfaces,
      resolution: function(context, props) {
        return [context.viewportWidth, context.viewportHeight];
      }
    }
});

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1],
    depth: 1,
    stencil: 0,
    framebuffer: backfaces
  });
  regl.clear({
    color: [0, 0, 0, 1],
    depth: 1,
    stencil: 0
  });
  camera.tick();
  setupScene(() => {
    drawBackfaces();
    drawScene();
  });
})
