precision mediump float;

varying vec3 vPosition;
varying vec3 vNormal;


void main () {
    vec3 color = vNormal * .5 + .5;
    gl_FragColor = vec4(color.rgb, 1.);
}
