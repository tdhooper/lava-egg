/*
  <p>This example shows how to implement a movable camera with regl.</p>
 */

var glslify = require('glslify');
const glm = require('gl-matrix');
const mat4 = glm.mat4;
const mat3 = glm.mat3;
const vec3 = glm.vec3;
const quat = glm.quat;
const bunny = require('bunny')
const fit = require('canvas-fit')
const normals = require('angle-normals');
const icosphere = require('icosphere');
const box = require('geo-3d-box');
const dat = require('dat.gui').default;

const canvas = document.body.appendChild(document.createElement('canvas'))
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  canvas: canvas
});
const camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

camera.distance = 1.5;

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

const rotation = quat.create();
const translation = vec3.create();
const model = mat4.create();
const modelInverse = mat4.create();
const modelView = mat4.create();
const cameraPosition = vec3.create();
const normal = mat3.create();

var state = {
  "x": -0.9311450057002397,
  "y": 0.09381268486091052,
  "z": 0.15261164251244486,
  "w": 0.9381268486091052,
  "scale": 13.79757682755774,
  "offsetX": 4.0143281572002785,
  "offsetY": -4.655725028501198,
  "offsetZ": -1.4044550838631444
};

window.state = state;

var stateConfig = [
  [state, 'x', -2, 2],
  [state, 'y', 0, 1],
  [state, 'z', -2, 2],
  [state, 'w', 0, 10],
  [state, 'scale', 0, 20],
  [state, 'offsetX', -10, 10],
  [state, 'offsetY', -10, 10],
  [state, 'offsetZ', -10, 10]
];

var gui = new dat.GUI();
stateConfig.forEach(conf => {
  var key = conf[1];
  state[key] = parseFloat(sessionStorage.getItem(key)) || state[key];
  var controller = gui.add.apply(gui, conf);
  controller.onChange((value) => {
    sessionStorage.setItem(key, value);
  });
});


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
      var angle = context.tick * .5;
      var offset = Math.sin(context.tick * .025) * .1;
      // angle = offset = 0;
      quat.fromEuler(rotation, 0, angle, 0);
      vec3.set(translation, 0, offset, 0);
      return mat4.fromRotationTranslation(model, rotation, translation);
    },
    view: () => camera.view(),
  },
  uniforms: {
    proj: regl.context('proj'),
    model: regl.context('model'),
    view: regl.context('view'),
    modelInverse: (context) => {
      return mat4.invert(modelInverse, context.model);
    },
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
      time: regl.context('time'),
      iChannel0: texture,
      volumeId: () => {
        return [state.x, state.y, state.z, state.w];
      },
      volumeScale: () => {
        return state.scale;
      },
      volumeOffset: () => {
        return [state.offsetX, state.offsetY, state.offsetZ];
      }
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
