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
const Node = require('scene-tree');

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

// var poly = polyhedra.platonic.Dodecahedron;
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
gui.closed = true;
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

const modelInverse = mat4.create();

const setupScene = regl({
  cull: {
    enable: true,
    face: 'back'
  },
  vert: glslify('./shaders/volume.vert'),
  attributes: {
    position: (context, props) => {
      return props.data.mesh.positions;
    },
    normal: (context, props) => {
      return props.data.mesh.normals;
    }
  },
  elements: (context, props) => {
    return props.data.mesh.cells;
  },
  context: {
    proj: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 2,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    model: regl.prop('modelMatrix'),
    view: () => camera.view(),
  },
  uniforms: {
    proj: regl.context('proj'),
    model: regl.context('model'),
    view: regl.context('view'),
    modelInverse: (context) => {
      return mat4.invert(modelInverse, context.model);
    },
    normalMatrix: regl.prop('normalMatrix'),
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

const drawLamp = regl({
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

const drawBase = regl({
  frag: glslify('./shaders/base.frag'),
});

var scene = Node();

var lamp = Node({
  position: [0, -.5, 0],
  mesh: mesh,
  draw: () => {
    drawBackfaces();
    drawLamp();
  }
});
scene.add(lamp);

var sphere = icosphere(3);
sphere.normals = normals(sphere.cells, sphere.positions);

var numBase = 5;
var baseRadius = .18;
var baseSize = .12;

scene.add(
  Array.apply(null, Array(numBase)).map((a, i) => {
    var rot = quat.create();
    quat.fromEuler(rot, -20, (i / numBase) * 360, 0);
    return Node({
      position: [
        Math.sin(Math.PI * 2 * (i / numBase)) * baseRadius,
        -.3,
        Math.cos(Math.PI * 2 * (i / numBase)) * baseRadius
      ],
      rotation: rot,
      scale: [.1, .2, .15],
      mesh: sphere,
      draw: drawBase
    });
  })
);

regl.frame((context) => {
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
  scene.setEuler(0, context.time, 0);
  camera.tick();
  scene.tick();
  var nodes = scene.flat();
  setupScene(nodes, (context, props) => {
    props.data.draw();
  })
})
