export function mountLiquidNavigation(host,onSelect){
host.innerHTML='<svg id="ln-nav" viewBox="0 40 800 140" aria-label="Primary navigation">\n\n<defs>\n\n    <!-- Frosted glass chamber -->\n\n    <linearGradient id="ln-glass" x2="0%" y2="100%">\n        <stop stop-color="#ffffff" stop-opacity=".92"/>\n        <stop offset=".45" stop-color="#f4f5f7" stop-opacity=".85"/>\n        <stop offset="1" stop-color="#dce0e6" stop-opacity=".75"/>\n    </linearGradient>\n\n    <linearGradient id="ln-rim" x2="0%" y2="100%">\n        <stop stop-color="#ffffff"/>\n        <stop offset=".5" stop-color="#cbd0d8"/>\n        <stop offset="1" stop-color="#bfc5ce"/>\n    </linearGradient>\n\n    <!-- Liquid material -->\n\n    <radialGradient id="ln-water" cx="38%" cy="17%" r="88%">\n        <stop id="ln-c1" stop-color="#fface1"/>\n        <stop id="ln-c2" offset=".28" stop-color="#ff42b2"/>\n        <stop id="ln-c3" offset=".65" stop-color="#c51b83"/>\n        <stop id="ln-c4" offset=".88" stop-color="#f52da8"/>\n        <stop id="ln-c5" offset="1" stop-color="#ffb8e5"/>\n    </radialGradient>\n\n    <!-- Liquid surface -->\n\n    <linearGradient id="ln-surface" x2="0%" y2="100%">\n        <stop stop-color="#ffffff"/>\n        <stop id="ln-c6" offset=".3" stop-color="#ff8bd0"/>\n        <stop id="ln-c7" offset=".7" stop-color="#e52b9d"/>\n        <stop offset="1" stop-color="#ffffff" stop-opacity=".8"/>\n    </linearGradient>\n\n    <!-- Transparent chamber -->\n\n    <radialGradient id="ln-air" cx="25%" cy="10%" r="95%">\n        <stop stop-color="#ffffff" stop-opacity=".95"/>\n        <stop offset=".5" stop-color="#ffffff" stop-opacity=".15"/>\n        <stop offset="1" stop-color="#b6c0cf" stop-opacity=".25"/>\n    </radialGradient>\n\n    <linearGradient id="ln-reflection" x2="100%" y2="100%">\n        <stop stop-color="white"/>\n        <stop offset=".6" stop-color="white" stop-opacity=".6"/>\n        <stop offset="1" stop-color="white" stop-opacity="0"/>\n    </linearGradient>\n\n    <!-- Glass lighting -->\n\n    <filter id="ln-halo" x="-100%" y="-100%"\n            width="300%" height="300%">\n        <feGaussianBlur stdDeviation="7"/>\n    </filter>\n\n    <filter id="ln-shadow" x="-20%" y="-50%"\n            width="140%" height="200%">\n        <feDropShadow\n            dx="0"\n            dy="5"\n            stdDeviation="5"\n            flood-color="#929cae"\n            flood-opacity=".2"/>\n    </filter>\n\n    <!-- Keep liquid inside chamber -->\n\n    <clipPath id="ln-chamber">\n        <path id="ln-chamberClip"/>\n    </clipPath>\n\n    <clipPath id="ln-orbClip">\n        <circle r="46"/>\n    </clipPath>\n\n</defs>\n\n<!-- Expanding menu chambers -->\n\n<g filter="url(#ln-shadow)">\n\n    <path id="ln-left"\n          fill="url(#ln-glass)"\n          stroke="url(#ln-rim)"\n          stroke-width="1.6"/>\n\n    <path id="ln-right"\n          fill="url(#ln-glass)"\n          stroke="url(#ln-rim)"\n          stroke-width="1.6"/>\n\n</g>\n\n<!-- Liquid glow -->\n\n<g id="ln-glowing">\n\n    <circle id="ln-glowFill"\n            r="47"\n            fill="#ff4eb6"\n            opacity=".2"\n            filter="url(#ln-halo)"/>\n\n</g>\n\n<!-- Sticky liquid connection -->\n\n<g clip-path="url(#ln-chamber)">\n\n    <path id="ln-neck" fill="url(#ln-water)"/>\n\n    <path id="ln-neckShine"\n          fill="none"\n          stroke="white"\n          stroke-width="1.2"\n          opacity=".6"/>\n\n</g>\n\n<!-- Active liquid chamber -->\n\n<g id="ln-orb">\n\n    <circle r="48" fill="url(#ln-air)"/>\n\n    <g clip-path="url(#ln-orbClip)">\n\n        <path id="ln-liquidBody" fill="url(#ln-water)"/>\n\n        <path id="ln-meniscus"\n              fill="url(#ln-surface)"\n              stroke="white"\n              stroke-width=".7"/>\n\n        <path id="ln-surfaceLine"\n              fill="none"\n              stroke="white"\n              stroke-width="1"\n              opacity=".9"/>\n\n        <!-- Internal liquid reflections -->\n\n        <path d="M-39 4 Q-47 28 -19 41 Q8 50 33 28"\n              fill="none"\n              stroke="white"\n              stroke-width="6"\n              opacity=".12"/>\n\n        <path d="M5 43 Q27 40 36 25"\n              fill="none"\n              stroke="white"\n              stroke-width="3"\n              stroke-linecap="round"\n              opacity=".85"/>\n\n        <path d="M-17 37 Q-24 33 -13 23"\n              fill="none"\n              stroke="white"\n              stroke-width="1.5"\n              opacity=".4"/>\n\n    </g>\n\n    <!-- Glass reflections -->\n\n    <path d="M-40 -23 Q-25 -47 6 -44"\n          fill="none"\n          stroke="url(#ln-reflection)"\n          stroke-width="4"\n          stroke-linecap="round"/>\n\n    <path d="M-43 -18 Q-32 -43 -8 -46"\n          fill="none"\n          stroke="white"\n          stroke-width="1.5"/>\n\n    <circle r="47"\n            fill="none"\n            stroke="white"\n            stroke-width="1.4"\n            opacity=".9"/>\n\n    <path d="M0 -49 A49 49 0 1 0 0 49"\n          fill="none"\n          stroke="#bfc5cd"\n          stroke-width="1.5"/>\n\n    <path id="ln-glowRim"\n          d="M0 -49 A49 49 0 1 0 0 49"\n          fill="none"\n          stroke="#ff4eb6"\n          stroke-width="3"\n          opacity=".4"\n          filter="url(#ln-halo)"/>\n\n</g>\n\n<!-- Menu labels and icons -->\n\n<g id="ln-items"></g>\n\n</svg>';


const $ = id => host.querySelector('#ln-'+id);
const media=matchMedia('(prefers-reduced-motion: reduce)');
let width=800,compact=false,baseScale=.8;
const events=new AbortController();


// MENU ITEMS

const names = [
    "Home",
    "Chapters",
    "Events",
    "Societies",
    "Contact"
];

let xs = [140, 287, 434, 581, 718];


// LIQUID PHYSICS SETTINGS

const viscosity = 0.80;
const gravity = 0.75;
const adhesion = 0.85;

const liquidLevel = -19;


// LIQUID COLOUR PALETTES

const palettes = [

    // Home - Pink
    [
        "#fface1", "#ff42b2", "#c51b83",
        "#f52da8", "#ffb8e5", "#ff8bd0",
        "#e52b9d"
    ],

    // Chapters - Blue
    [
        "#b6edff", "#36b2ff", "#1268cd",
        "#1599ef", "#afe4ff", "#87d5ff",
        "#1689e6"
    ],

    // Events - Violet
    [
        "#e3caff", "#a36aff", "#6332c3",
        "#9455ef", "#d9baff", "#c5a0ff",
        "#8645e5"
    ],

    // Societies - Green
    [
        "#c6ffe2", "#47dfad", "#148e69",
        "#2ac891", "#a5f6d4", "#89efc2",
        "#1fbb89"
    ],

    // Contact - Orange
    [
        "#ffdfac", "#ffad43", "#ce6819",
        "#f98e29", "#ffcf92", "#ffc57e",
        "#ef8b27"
    ]

];


// MENU ICONS

const icons = [

    '<image href="/hero/vjec-logo.png" x="-3" y="-3" width="30" height="30"/>',

    '<path d="m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5"/>',

    '<rect x="3" y="5" width="18" height="16" rx="3"/> <path d="M7 3v4 M17 3v4 M3 10h18 M7 15h3 M14 15h3"/>',

    '<circle cx="12" cy="7" r="4"/> <path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',

    '<rect x="3" y="5" width="18" height="14" rx="3"/> <path d="m3 7 9 7 9-7"/>'

];


// ANIMATION VARIABLES

let x = 140;
let selected = 0;

let raf = 0;

let tilt = 0;
let sv = 0;

let previousV = 0;

let tail = 140;
let tailV = 0;

let palette = palettes[0].slice();


// SMOOTH COLOUR MIXING

function mix(a, b, t) {

    let n = parseInt(a.slice(1), 16);
    let m = parseInt(b.slice(1), 16);

    return "#" + [16, 8, 0].map(s => {

        let start = (n >> s) & 255;
        let end = (m >> s) & 255;

        return Math.round(
            start * (1 - t) + end * t
        ).toString(16).padStart(2, "0");

    }).join("");

}


function colors(p) {

    palette = p;

    p.forEach((color, i) => {
        $("c" + (i + 1)).setAttribute(
            "stop-color", color
        );
    });

    $("glowFill").setAttribute("fill", p[1]);
    $("glowRim").setAttribute("stroke", p[1]);

}


function path(id, d) {

    $(id).setAttribute("d", d);

}


// INTEGRATED EXPANDING CHAMBER

function draw(cx, scale = 1) {

    scale *= baseScale;
    x = cx;

    let r = 49 * scale;

    let a = Math.max(9, cx - r - 10);

    let l = Math.min(28, (a - 8) / 2);

    let n = Math.min(width - 36, cx + r + 15);


    let L = `
        M${8 + l} 72
        H${a - l}

        Q${a} 72 ${a} 100
        Q${a} 128 ${a - l} 128

        H${8 + l}

        Q8 128 8 100
        Q8 72 ${8 + l} 72

        Z
    `;


    let R = `
        M${cx} ${100 - r}

        C${cx + r * .6} ${100 - r}
         ${n - 18} 72
         ${n} 72

        H${width-36}

        Q${width-8} 72 ${width-8} 100
        Q${width-8} 128 ${width-36} 128

        H${n}

        C${n - 18} 128
         ${cx + r * .6} ${100 + r}
         ${cx} ${100 + r}

        A${r} ${r} 0 0 1
         ${cx} ${100 - r}

        Z
    `;


    path("left", L);
    $("left").style.opacity = a - 8 < 50 ? "0" : "1";
    path("right", R);

    path("chamberClip", L + " " + R);


    for (let id of ["orb", "glowing"]) {

        $(id).setAttribute(
            "transform",
            `translate(${cx} 100) scale(${scale})`
        );

    }

}


// VISCOUS LIQUID ANIMATION

function fluid(dt, velocity, acc, scale = 1) {

    // Liquid inertia and restoring force

    sv += (
        -tilt * .09
        -acc * .32 * gravity
    ) * dt;


    // Viscous damping

    sv *= Math.pow(
        .80 + viscosity * .075,
        dt
    );


    tilt = Math.max(
        -24,
        Math.min(24, tilt + sv * dt)
    );


    // Liquid surface deformation

    let level = liquidLevel;

    let wave = Math.min(
        7,
        Math.abs(sv) * .5
    );

    let a = level - tilt;
    let b = level + tilt;


    let top = `
        M-52 ${a}

        C-26 ${a - 3 - wave}
         23 ${b - 3 + wave}
         52 ${b}
    `;


    path(
        "liquidBody",
        top + "L52 55 H-52 Z"
    );


    path(
        "meniscus",

        top + `
        C26 ${b + 10 + wave}
         -26 ${a + 10 - wave}
         -52 ${a}
        Z
        `
    );


    path(
        "surfaceLine",

        `M-46 ${a + 2}
         Q0 ${level - 4 + wave * .2}
         46 ${b + 2}`
    );


    // Liquid adhesion and sticky trailing movement

    tailV += (
        (x - tail) *
        (.12 - adhesion * .065)
    ) * dt;


    tailV *= Math.pow(
        .73 + viscosity * .10,
        dt
    );

    tail += tailV * dt;


    let delta = x - tail;

    let dir = Math.sign(delta) || 1;

    let d = Math.min(
        165,
        Math.abs(delta)
    );


    let start = x - dir * 22 * scale;

    let end = x - dir * (30 + d);

    let w = 15 * Math.min(1, d / 30);

    let sag = Math.min(21, d * .15) * gravity;


    if (d < 2) {

        path("neck", "");
        path("neckShine", "");

    } else {

        // Stretching liquid bridge

        path("neck", `

            M${start} ${100 - w}

            C${start - dir * d * .35} ${100 - w}
             ${end + dir * d * .35} ${100 + sag - 5}
             ${end} ${100 + sag - 3}

            Q${end - dir * 10} ${100 + sag + 5}
             ${end} ${100 + sag + 9}

            C${end + dir * d * .35} ${100 + sag + 12}
             ${start - dir * d * .35} ${100 + w}
             ${start} ${100 + w}

            Z

        `);


        // Liquid surface reflection

        path("neckShine", `

            M${start} ${100 - w + 2}

            Q${(start + end) / 2} ${100 + sag + 2}
             ${end} ${100 + sag - 2}

        `);

    }

}


// GENERATE MENU ITEMS

function labels() {
 const focused=host.contains(document.activeElement);
 $('items').innerHTML=names.map((name,i)=>{
  const icon=`<g class="active-icon" transform="translate(${xs[i]-12} 88)">${icons[i]}</g>`;
  const label=`<text x="${xs[i]}" y="${compact?155:106}" text-anchor="middle">${name}</text>`;
  return `<g role="button" tabindex="0" data-index="${i}" aria-label="${name}" aria-pressed="${i===selected}">
   <rect x="${xs[i]-(compact?width/10:65)}" y="${compact?62:54}" width="${compact?width/5:130}" height="${compact?104:92}" rx="12" fill="transparent"/>
   ${compact?icon+label:i===selected?icon:label}</g>`;
 }).join('');
 if(focused)$('items').querySelector(`[data-index="${selected}"]`)?.focus({preventScroll:true});
}

// MENU SWITCHING ANIMATION

function pick(i) {

    if (i === selected)
        return;


    cancelAnimationFrame(raf);


    let from = x;
    let to = xs[i];


    // Special Contact-to-Home transition

    let wrap = selected === 4 && i === 0;


    let start = performance.now();
    let prev = start;
    let old = x;


    let initial = palette.slice();
    let target = palettes[i];


    selected = i;

    onSelect?.(names[i]);

    labels();
    if(media.matches){
      x=to;tail=x;tailV=0;tilt=0;sv=0;previousV=0;
      colors(palettes[i].slice());draw(to);fluid(1,0,0);return;
    }

    let duration = wrap

        ? 1050

        : 690 + Math.min(
            160,
            Math.abs(to - from) * .25
        );


    function tick(now) {

        let p = Math.min(
            1,
            (now - start) / duration
        );


        let dt = Math.max(
            .15,
            Math.min(2, (now - prev) / 16.667)
        );


        prev = now;


        let cx;
        let scale = 1;


        if (wrap) {

            // Compress at the right edge

            if (p < .42) {

                let q = p / .42;

                cx = from + (width-30 - from) * q;

                scale = 1 - .6 * q;

            } else {

                // Reappear from the left with elastic motion

                let q = (p - .42) / .58;

                let e = 1 -
                    Math.exp(-6 * q) *
                    Math.cos(9 * q);


                cx = xs[0]*.6 + (to-xs[0]*.6) * e;

                scale = .4 + .6 * Math.min(1, e);


                if (old > 500) {

                    old = cx;
                    tail = cx;
                    tailV = 0;
                    previousV = 0;

                }

            }

        } else {

            // Normal smooth horizontal movement

            let e = 1 - Math.pow(1 - p, 3);

            cx = from + (to - from) * e;

            scale = 1 - .09 * Math.sin(
                p * Math.PI
            );

        }


        if (p === 1) {

            cx = to;
            scale = 1;

        }


        // Calculate velocity and acceleration

        let vel = (cx - old) / dt;

        let acc = vel - previousV;


        previousV = vel;
        old = cx;


        // Gradually blend liquid colours

        let colorProgress = p * p * (3 - 2 * p);


        colors(

            initial.map((color, j) =>

                mix(
                    color,
                    target[j],
                    colorProgress
                )

            )

        );


        draw(cx, scale);

        fluid(dt, vel, acc, scale);


        if (p < 1) {

            raf = requestAnimationFrame(tick);

        } else {

            // Liquid continues to settle after movement

            let end = now;


            function settle(t) {

                let dt = Math.max(
                    .1,
                    Math.min(2, (t - prev) / 16.667)
                );

                prev = t;

                fluid(dt, 0, 0);


                if (t - end < 1100) {

                    raf = requestAnimationFrame(settle);

                } else {

                    tilt = 0;
                    sv = 0;
                    tailV = 0;
                    previousV = 0;

                    tail = x;

                    fluid(1, 0, 0);

                }

            }

            raf = requestAnimationFrame(settle);

        }

    }

    raf = requestAnimationFrame(tick);

}


function resize(){
 cancelAnimationFrame(raf);
 width=Math.max(250,host.clientWidth);compact=width<620;baseScale=compact?.55:.8;
 xs=names.map((_,i)=>compact?width/5*(i+.5):100+i*(width-185)/4);
 $('nav').setAttribute('viewBox',`0 ${compact?50:40} ${width} ${compact?126:140}`);
 host.classList.toggle('liquid-nav--compact',compact);
 x=xs[selected];tail=x;tailV=0;tilt=0;sv=0;previousV=0;
 colors(palettes[selected].slice());draw(x);fluid(1,0,0);labels();
}
host.addEventListener('click',event=>{
 const item=event.target.closest('[data-index]');if(item)pick(Number(item.dataset.index));
},{signal:events.signal});
host.addEventListener('keydown',event=>{
 const item=event.target.closest('[data-index]');if(!item)return;
 const i=Number(item.dataset.index);
 if(['Enter',' '].includes(event.key)){event.preventDefault();pick(i);}
 else if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?4:(i+(event.key==='ArrowRight'?1:4))%5;
  pick(next);$('items').querySelector(`[data-index="${next}"]`)?.focus({preventScroll:true});
 }
},{signal:events.signal});
const observer=new ResizeObserver(resize);observer.observe(host);
media.addEventListener('change',resize);
resize();
return ()=>{cancelAnimationFrame(raf);events.abort();observer.disconnect();media.removeEventListener('change',resize);host.replaceChildren();};

}
