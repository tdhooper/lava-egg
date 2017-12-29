/*
  <p>This example shows how to implement a movable camera with regl.</p>
 */

var glslify = require('glslify');
const glm = require('gl-matrix');
const mat4 = glm.mat4;
const mat3 = glm.mat3;
const vec3 = glm.vec3;
const quat = glm.quat;
const fit = require('canvas-fit')
const normals = require('angle-normals');
const icosphere = require('icosphere');
const dat = require('dat.gui').default;
const polyhedra = require('polyhedra');
const Bezier = require('bezier-js');
const revolveMesh = require('./revolve-mesh');

const canvas = document.body.appendChild(document.createElement('canvas'))
const camera = require('./canvas-turntable-camera')(canvas);

const regl = require('regl')({
  extensions: ['OES_texture_float'],
  canvas: canvas,
  attributes: {
    antialias: false
  }
});

window.addEventListener('resize', fit(canvas), false)

var poly = polyhedra.platonic.Dodecahedron;
// var poly = polyhedra.platonic.Cube;
// var poly = polyhedra.platonic.Icosahedron;
// var poly = polyhedra.platonic.Tetrahedron;

var width = .3;
var bump = .25;
var round = .15;
var curveA = new Bezier(
  0, 0,
  round, 0,
  width, bump - round,
  width, bump
);
var curveB = new Bezier(
  width, bump,
  width, bump + round,
  round, 1,
  0, 1
);
var lut = curveA.getLUT(10);
lut = lut.concat(curveB.getLUT(20).slice(1));
var mesh = revolveMesh(lut, 40);
mesh.normals = normals(mesh.cells, mesh.positions);

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
  "x": -0.9544870495247815,
  "y": 0.17467770576178984,
  "z": -0.8244362517392594,
  "w": 1.421650063154093,
  "brightness": 0.15,
  "scale": 10.901398584514862,
  "dotScale": 0,
  "offsetX": -10,
  "offsetY": 5.848379904860401,
  "offsetZ": -5.205937906908982
};

window.state = state;

var stateConfig = [
  [state, 'x', -2, 2],
  [state, 'y', 0, 1],
  [state, 'z', -2, 2],
  [state, 'w', 0, 3],
  [state, 'brightness', 0, 1],
  [state, 'scale', 0, 50],
  [state, 'offsetX', -10, 10],
  [state, 'offsetY', -10, 10],
  [state, 'offsetZ', -10, 10]
];

var gui = new dat.GUI();
stateConfig.forEach(conf => {
  var key = conf[1];
  var value = sessionStorage.getItem(key);
  state[key] = value !== null ? parseFloat(value) : state[key];
  var controller = gui.add.apply(gui, conf);
  controller.onChange((value) => {
    sessionStorage.setItem(key, value);
  });
});


const backfaceDistances = regl.framebuffer({
  width: Math.floor(window.outerWidth * window.devicePixelRatio),
  height: Math.floor(window.outerHeight * window.devicePixelRatio),
  // width: window.outerWidth,
  // height: window.outerHeight,
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
    model: (context, props) => {
      var angle = context.tick * 2;
      var offset = Math.sin(context.tick * .05) * .1;
      // angle = offset = 0;
      // angle = 0;
      offset = 0;
      quat.fromEuler(rotation, 0, angle, 0);
      vec3.set(translation, 0,-.5,0);
      mat4.fromRotationTranslation(model, rotation, translation);
      // mat4.fromTranslation(model, camera.position);
      return model;
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
      mat3.fromMat4(normal, context.model);
      mat3.invert(normal, normal);
      mat3.transpose(normal, normal);
      return normal;
    },
    cameraPosition: (context) => {
      return camera.position;
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
  // blend: {
  //   enable: true,
  //   func: {
  //     srcRGB: 'src alpha',
  //     srcAlpha: 1,
  //     dstRGB: 'one minus src alpha',
  //     dstAlpha: 1
  //   },
  //   equation: {
  //     rgb: 'add',
  //     alpha: 'add'
  //   },
  //   // color: [0, 0, 0, 0]
  // },
  frag: glslify('./shaders/volume.frag'),
    uniforms: {
      backfaceDistances: backfaceDistances,
      resolution: function(context) {
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
      },
      dotScale: () => {
        return state.dotScale;
      },
      brightness: () => {
        return state.brightness;
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
    color: [33/255,9/255,40/255,1],
    depth: 1,
    stencil: 0
  });
  camera.tick();
  setupScene(() => {
    drawBackfaces();
    drawScene();
  });
})
