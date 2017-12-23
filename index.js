/*
  <p>This example shows how to implement a movable camera with regl.</p>
 */

var glslify = require('glslify');
const glm = require('gl-matrix');
const mat4 = glm.mat4;
const mat3 = glm.mat3;
const vec3 = glm.vec3;
const bunny = require('bunny')
const fit = require('canvas-fit')
const normals = require('angle-normals');
const icosphere = require('icosphere');
const box = require('geo-3d-box');

const canvas = document.body.appendChild(document.createElement('canvas'))
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  canvas: canvas
});
const camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

camera.distance = 2;

// const mesh = icosphere(0);
// const mesh = bunny;
// mesh.normals = normals(mesh.cells, mesh.positions);
const mesh = box({size: 1, segments: 1});

var texture = regl.texture();

var image = new Image();
image.src = '/images/noise.png';
image.onload = function() {
    texture({
        data: image,
        mag: 'linear',
        min: 'mipmap',
        wrapS: 'repeat',
        wrapT: 'repeat'
    });
};

const model = mat4.create();
const modelView = mat4.create();
const cameraPosition = vec3.create();
const normal = mat3.create();

const backfaceDistances = regl.framebuffer({
  width: window.outerWidth,
  height: window.outerHeight,
  colorType: 'float'
});

const setupScene = regl({
  cull: {
    enable: true,
    face: 'back'
  },
  vert: glslify('./shaders/volume.vert'),
  attributes: {
    position: mesh.positions,
    normal: mesh.normals
  },
  elements: mesh.cells,
  context: {
    proj: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 2,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    model: (context) => {
      return mat4.fromYRotation(model, context.tick * .01);
    },
    view: () => camera.view(),
  },
  uniforms: {
    proj: regl.context('proj'),
    model: regl.context('model'),
    view: regl.context('view'),
    normalMatrix: (context) => {
      mat4.multiply(modelView, context.model, context.view);
      mat3.fromMat4(normal, modelView);
      mat3.invert(normal, normal);
      mat3.transpose(normal, normal);
      return normal;
    },
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
  frag: glslify('./shaders/backfaces.frag'),
  framebuffer: backfaceDistances
});

const drawScene = regl({
  frag: glslify('./shaders/volume.frag'),
    uniforms: {
      backfaceDistances: backfaceDistances,
      resolution: function(context, props) {
        return [context.viewportWidth, context.viewportHeight];
      },
      iChannel0: texture
    }
});

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1],
    depth: 1,
    stencil: 0,
    framebuffer: backfaceDistances
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
