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
const polyhedra = require('polyhedra');
const Bezier = require('bezier-js');

const canvas = document.body.appendChild(document.createElement('canvas'))
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  canvas: canvas,
  attributes: {
    antialias: false
  }
});
const camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

camera.distance = 2.5;

// const mesh = bunny;
// const mesh = box({size: 1, segments: 1});

var poly = polyhedra.platonic.Dodecahedron;
// var poly = polyhedra.platonic.Cube;
// var poly = polyhedra.platonic.Icosahedron;
// var poly = polyhedra.platonic.Tetrahedron;

console.log(poly);
var mesh = {
  positions: [],
  cells: [],
  normals: []
};

// const sides = poly.face[0].length;
// const diameter = .4;
// const top = 1;
// const middle = .5;
// const bottom = 0;

// var adj = .25 + (.5 / sides);

// for (var pointIdx = 0; pointIdx < sides; pointIdx++) {
//   var pointIdxA = pointIdx;
//   var pointIdxB = (pointIdx + 1) % sides;
//   var angleA = (pointIdxA / sides) + adj;
//   var angleB = (pointIdxB / sides) + adj;
//   var pointA = [
//     Math.sin(angleA * Math.PI * 2) * diameter,
//     Math.cos(angleA * Math.PI * 2) * diameter
//   ];
//   var pointB = [
//     Math.sin(angleB * Math.PI * 2) * diameter,
//     Math.cos(angleB * Math.PI * 2) * diameter
//   ];
//   var start = mesh.positions.length;

//   mesh.positions.push([pointB[0], pointB[1], middle]);
//   mesh.positions.push([pointA[0], pointA[1], middle]);
//   mesh.positions.push([0, 0, top]);
//   mesh.cells.push([start, start + 1, start + 2]);

//   mesh.positions.push([pointA[0], pointA[1], middle]);
//   mesh.positions.push([pointB[0], pointB[1], middle]);
//   mesh.positions.push([0, 0, bottom]);
//   mesh.cells.push([start + 3, start + 4, start + 5]);
// }

var width = .3;
var bump = .75;
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
var lut = curveA.getLUT(20);
lut = lut.concat(curveB.getLUT(10).slice(1));

// lut = [{x: 0, y: 0}, {x: .5, y: .5}, {x: 0, y:1}];

var cols = 20;
var rows = lut.length;

for (var u = 0; u < cols; u++) {
  for (var v = 0; v < rows; v++) {
    if (v == 0) { continue; }
    if (v == rows - 1) { continue; }
    var angleA = (u / cols) * Math.PI * 2;
    var x = Math.sin(angleA);
    var y = Math.cos(angleA);
    var l = lut[v];
    mesh.positions.push([
      x * l.x,
      y * l.x,
      l.y
    ]);
  }
}

mesh.positions.push([0, 0, 0]);
mesh.positions.push([0, 0, 1]);

rows -= 2;

for (var u = 0; u < cols; u++) {
  for (var v = 0; v < rows - 1; v++) {
    var a = u * rows + v;
    var b = ((u + 1) % cols) * rows + v;
    var c = u * rows + v + 1;
    var d = ((u + 1) % cols) * rows + v + 1;
    mesh.cells.push([a, d, b]);
    mesh.cells.push([a, c, d]);
  }
}

var end = mesh.positions.length - 1;

for (var u = 0; u < cols; u++) {
  mesh.cells.push([
    end - 1,
    u * rows,
    ((u + 1) % cols) * rows
  ]);
  mesh.cells.push([
    end,
    ((u + 1) % cols) * rows + rows - 1,
    u * rows + rows - 1
  ]);
}


console.log(mesh);

// mesh = icosphere(3);

mesh.normals = normals(mesh.cells, mesh.positions);

const instance = mat4.create();
const instanceInverse = mat4.create();
const origin = vec3.create();
const midpoint = vec3.create();
const vert = vec3.create();

const instances = poly.face.map((face, idx) => {
  var verts = face.map(i => poly.vertex[i]);

  vec3.set(midpoint, 0, 0, 0);
  vec3.scale(
    midpoint,
    verts.reduce((acc, v) => {
      vec3.set(vert, v[0], v[1], v[2]);
      vec3.add(midpoint, acc, vert);
      return midpoint;
    }),
    1 / verts.length
  );

  vec3.normalize(midpoint, midpoint);
  vec3.cross(vert, vert, midpoint);
  vec3.normalize(vert, vert);
  vec3.scale(origin, midpoint, -.45);

  mat4.targetTo(instance, origin, midpoint, vert);
  return {
    'instance': mat4.clone(instance),
    'idx': idx
  };
});


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
      var angle = context.tick * .5;
      var offset = Math.sin(context.tick * .05 + props.idx * 1.75) * .1;
      angle = offset = 0;
      angle = 0;
      quat.fromEuler(rotation, 0, 0, angle);
      vec3.set(translation, 0,0,offset);
      mat4.fromRotationTranslation(model, rotation, translation);
      return mat4.multiply(model, props.instance, model);
      return model;
    },
    view: () => camera.view(),
  },
  uniforms: {
    proj: regl.context('proj'),
    model: regl.context('model'),
    view: regl.context('view'),
    instanceIndex: regl.prop('idx'),
    modelInverse: (context) => {
      return mat4.invert(modelInverse, context.model);
    },
    normalMatrix: (context) => {
      mat3.fromMat4(normal, context.model);
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
  setupScene(instances, () => {
    drawBackfaces();
    drawScene();
  });
})
