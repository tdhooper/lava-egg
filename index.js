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
  canvas: canvas
});
const camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

camera.distance = 1.5;

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

const sides = 10;

var width = .3;
var bump = .3;
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
lut = lut.concat(curveB.getLUT(10).slice(1));

// lut = [{x: 0, y: 0}, {x: .5, y: .5}, {x: 0, y:1}];

console.log(lut);

// const vec1 = vec3.create();
// const vec2 = vec3.create();
// const vec3 = vec3.create();
// const vec4 = vec3.create();

for (var u = 0; u < sides; u++) {
  for (var v = 0; v < lut.length; v++) {
    var angleA = (u / sides) * Math.PI * 2;
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

for (var u = 0; u < sides; u++) {
  for (var v = 0; v < lut.length - 1; v++) {
    var cols = sides;
    var rows = lut.length;
    // var uA = u;
    // var uB = (u + 1) % sides;
    // var angleA = (uA / sides) * Math.PI * 2;
    // var angleB = (uB / sides) * Math.PI * 2;
    // var uAX = Math.sin(angleA);
    // var uAY = Math.cos(angleA);
    // var uBX = Math.sin(angleB);
    // var uBY = Math.cos(angleB);
    // var lutA = lut[v];
    // var lutB = lut[v + 1];
    // var topA = [uAX * lutA.x, uAY * lutA.x, lutA.y];
    // var topB = [uBX * lutA.x, uBY * lutA.x, lutA.y];
    // var botA = [uAX * lutB.x, uAY * lutB.x, lutB.y];
    // var botB = [uBX * lutB.x, uBY * lutB.x, lutB.y];
    // var start = mesh.positions.length;
    // mesh.positions.push(topA);
    // mesh.positions.push(topB);
    // mesh.positions.push(botA);
    // mesh.positions.push(botB);
    // mesh.cells.push([start + 0, start + 3, start + 1]);
    // mesh.cells.push([start + 3, start + 0, start + 2]);

    mesh.cells.push([
      u * rows + v,
      ((u + 1) % cols) * rows + v + 1,
      ((u + 1) % cols) * rows + v
    ]);
    mesh.cells.push([
      u * rows + v,
      u * rows + v + 1,
      ((u + 1) % cols) * rows + v + 1
    ]);
    // mesh.cells.push([start + 3, start + 0, start + 2]);

  }
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
  vec3.scale(origin, midpoint, -.5);

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
  "scale": 10.901398584514862,
  "dotScale": 2,
  "offsetX": -10,
  "offsetY": 5.848379904860401,
  "offsetZ": -5.205937906908982
};

window.state = state;

var stateConfig = [
  [state, 'x', -2, 2],
  [state, 'y', 0, 1],
  [state, 'z', -2, 2],
  [state, 'w', 0, 10],
  [state, 'scale', 0, 50],
  [state, 'dotScale', 0, 2],
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
