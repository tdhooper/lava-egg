var createScroll = require('scroll-speed')
var mp = require('mouse-position')
var mb = require('mouse-pressed')
var key = require('key-pressed')
const glm = require('gl-matrix');
const mat4 = glm.mat4;
const mat3 = glm.mat3;
const vec3 = glm.vec3;
const quat = glm.quat;

var panSpeed = 1

module.exports = attachCamera

function attachCamera(canvas, opts) {
  opts = opts || {}
  opts.pan = opts.pan !== false
  opts.scale = opts.scale !== false
  opts.rotate = opts.rotate !== false

  var scroll = createScroll(canvas, opts.scale)
  var mbut = mb(canvas, opts.rotate)
  var mpos = mp(canvas)

  var Camera = function() {
    this.position = vec3.create();
    this.viewMat = mat4.create();
    this.origin = vec3.create();
    this.rotation = quat.create();
    this.up = vec3.fromValues(0, 1, 0);
    this.theta = 0;
    this.phi = Math.PI / 2;
    this.distance = 1;
  };

  Camera.prototype.view = function() {
    var sinPhiRadius = Math.sin(this.phi) * this.distance;

    vec3.set(this.position,
      sinPhiRadius * Math.sin(this.theta),
      Math.cos(this.phi) * this.distance,
      sinPhiRadius * Math.cos(this.theta)
    );

    // vec3.set(this.position,
    //   this.distance * Math.sin(this.phi) * Math.sin(this.theta),
    //   this.distance * Math.sin(this.theta) * Math.sin(this.phi),
    //   this.distance * Math.cos(this.theta)
    // );
    // vec3.set(this.position, -this.phi, -this.theta);
    // mat4.fromTranslation(this.viewMat, this.position);
    // return this.viewMat;
    // vec3.set(this.origin, 0, 0, -5);
    // mat4.identity(this.viewMat);
    // mat4.fromTranslation(this.viewMat, this.origin);
    mat4.lookAt(this.viewMat, this.position, this.origin, this.up);
    // quat.fromEuler(this.rotation, this.theta, this.phi, 0);
    // mat4.fromRotationTranslation(this.viewMat, this.rotation, this.position);
    return this.viewMat;
  };

  var camera = new Camera();

  camera.tick = tick;

  return camera;

  function tick() {
    var ctrl = key('<control>') || key('<alt>')
    var alt = key('<shift>')
    var height = canvas.height
    var width = canvas.width

    if (opts.rotate && mbut.left && !ctrl && !alt) {
      camera.theta += Math.PI * 2 * ((mpos.x - mpos.prevX) / width);
      camera.phi += Math.PI * ((mpos.y - mpos.prevY) / height);
      // camera.phi %= Math.PI;
      camera.phi = Math.min(Math.max(0.0001, camera.phi), Math.PI);
    }

    if (opts.scale && scroll[1]) {
      camera.distance *= Math.exp(scroll[1] / height)
    }

    if (opts.scale && (mbut.middle || (mbut.left && !ctrl && alt))) {
      var d = mpos.y - mpos.prevY
      if (!d) return;

      camera.distance *= Math.exp(d / height)
    }

    scroll.flush()
    mpos.flush()
  }
}