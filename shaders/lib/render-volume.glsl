
//
// This is all based on iapafoto's Interactive thinks
// https://www.shadertoy.com/view/Xt3SR4
//


void pR(inout vec2 p, float a) {
    p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

float pModMirror1(inout float p, float size) {
    float halfsize = size*0.5;
    float c = floor((p + halfsize)/size);
    p = mod(p + halfsize,size) - halfsize;
    p *= mod(c, 2.0) * 2. - 1.;
    return c;
}

vec3 pMod3(inout vec3 p, vec3 size) {
    vec3 c = floor((p + size*0.5)/size);
    p = mod(p + size*0.5, size) - size*0.5;
    return c;
}



#define SPIRAL_NOISE_ITER 5

#define PI 3.14159265359

//-------------------------------------------------------------------------------------
// otaviogood's noise from https://www.shadertoy.com/view/ld2SzK
//--------------------------------------------------------------
// This spiral noise works by successively adding and rotating sin waves while increasing frequency.
// It should work the same on all computers since it's not based on a hash function like some other noises.
// It can be much faster than other noise functions if you're ok with some repetition.
const float nudge = 20.;    // size of perpendicular vector
float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);   // pythagorean theorem on that perpendicular to maintain scale
float SpiralNoiseC(vec3 p, vec4 id) {

    vec3 pp = p;
    pMod3(p, vec3(.8 * dotScale));
    float dots = length(p);
    p = pp;

    if (loop) {
        p.z -= mod(time / loopDuration, 1.) * 2. * loopSize;
        pModMirror1(p.z, loopSize);
    } else {
        p.z -= (time / loopDuration) * 2. * loopSize;
    }

    float warp = mod(time / 4., 1.) * PI * 2.;
    warp = 0.;

    float iter = 2., n = 2.-id.x; // noise amount


    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {
        // add sin and cos scaled inverse with the frequency
        n += -abs(sin(p.y*iter+warp) + cos(p.x*iter+warp)) / iter;    // abs for a ridged look
        // n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;    // abs for a ridged look
        // rotate by adding perpendicular and scaling down
        p.xy += vec2(p.y, -p.x) * nudge;
        p.xy *= normalizer;
        // rotate on other axis
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;

        // increase the frequency
        iter *= id.y + .733733;
    }
    // return n;

    return mix(dots, n, 1.);
}

float mapVolume(vec3 p, vec4 id, vec3 offset) {
    //p += iGlobalTime;
    p *= scale;
    p += offset;

    float k = 2.*id.w +.1; //  p/=k;
    float d = k*(.5 + SpiralNoiseC(p.zxy*.4132, id)*3.);
    return d / scale;
}



const float GAMMA = 2.2;

vec3 gamma(vec3 color, float g) {
    return pow(color, vec3(g));
}

vec3 linearToScreen(vec3 linearRGB) {
    return gamma(linearRGB, 1.0 / GAMMA);
}

vec3 screenToLinear(vec3 screenRGB) {
    return gamma(screenRGB, GAMMA);
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 nebulaPal(float t) {
    return screenToLinear(pal(t, vec3(.75,.7,1.),vec3(.2,.2,.0),vec3(1.0,1.0,0.0),vec3(.0,.3,.0)));
    return screenToLinear(pal(t, vec3(1.,.9,1.),vec3(0.4,0.3,0.),vec3(1.5,1.5,0.),vec3(.2,0.05,0.0)));    
}




//-------------------------------------------------------------------------------------
// Based on [iq: https://www.shadertoy.com/view/MsS3Wc]
//-------------------------------------------------------------------------------------
vec3 hsv2rgb(float x, float y, float z) {   
    return z+z*y*(clamp(abs(mod(x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.)-1.);
}


float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.;
    x /= w;
    return 1. - x*x*(3.-2.*x);
}



//-------------------------------------------------------------------------------------
// Based on "Type 2 Supernova" by Duke (https://www.shadertoy.com/view/lsyXDK) 
//-------------------------------------------------------------------------------------
vec4 renderSuperstructure(
    vec3 ro,
    vec3 rd,
    float maxDist,
    const vec4 id,
    vec3 offset
) {

    float td = 0.;
    float dist;
    float currentDist = 0.;
    float attenuate;
    float thickness = .05 + .25 * id.z;
   
    vec3 base = vec3(.1,0,.2) * .8;
    vec3 pos;
    vec3 lightColor = vec3(.2,.5,1.);
    vec3 fogColor = vec3(.8,0,.3);
    vec4 sum = vec4(base, 0);
    float lightDist = 0.;
    
    currentDist = 0.;

    sum.rgb = mix(base, fogColor, pow(maxDist * .5, 2.));

    for (int i = 0; i < 200; i++) {

        if (currentDist > maxDist) break;

        vec3 pos = ro + currentDist * rd;

        dist = abs(mapVolume(pos, id, offset)) + .07;

        // Fade out light towards back
        attenuate = smoothstep(maxDist, 0., currentDist);


        float st = smoothstep(0., 1., pos.y);
        // attenuate = mix(0., attenuate, 1.-st) * 2.;

        lightColor = mix(
            vec3(0,1,1) * .5,
            vec3(1,0,1) * .25,
            st
        );


        // sum.rgb += mix(lightColor, fogColor, 1. - attenuate) * .5;
        sum.rgb += lightColor * attenuate * brightness;

        // sum.a += .5;
        // sum.a = min(sum.a, 1.);
        // sum.rgb += fogColor * .25;

        if (dist < thickness) {
            td += (1. - td) * (thickness - dist) + .005;  // accumulate density
            sum.rgb += sum.rgb * vec3(0,.01,0);  // emission
            sum += (1. - sum.a) * .02 * td * attenuate;  // uniform scale density + alpha blend in contribution
        } 
        
        td += .015;
        currentDist += dist * .05 * max(dist, 2.);  // trying to optimize step size
    }

    sum.a = 1.;

    // sum.rgb = pow(sum.rgb * 10., vec3(1.2));

    return sum;
}


vec4 renderVolume(
    vec3 rayOrigin,
    vec3 rayDirection,
    float maxDistance,
    vec4 id,
    vec3 offset
) {
    // return vec4(rayOrigin, 1);
    //vec4 id = vec4(0.5,0.7,0.2,0.9);
    return renderSuperstructure(
        rayOrigin,
        rayDirection,
        maxDistance,
        id,
        offset
    );
}

#pragma glslify: export(renderVolume)
