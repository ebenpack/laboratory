K = "width";
W = a[K];
H = a.height;
X = a.addEventListener;
V = a.removeEventListener;
w = 200;
h = 80;
l = [];
q = [];
o = 1.7;
v = !0;
B = [];
J = 0;
a.style.background = "#000";
f = 10;
A = Math.floor;
F = Math.abs;
MS = Math.sqrt;
Mp = Math.pow;
P = Math.PI;
Q = "mousemove";
O = "mouseup";
R = "red";
G = "#0F0";
Y = "#FF0";
p = A(W / w);
T = 255;
zf = 0.04;
bp = c.beginPath.bind(c);
st = c.stroke.bind(c);
cp = c.closePath.bind(c);
cf = c.fill.bind(c);
ca = c.arc.bind(c);
L = "length";
z = "layerX";
r = "layerY";

function I() {
    for (x = B[L] = 0; 20 > x; x++)
        for (y = 0; 8 > y; y++) l[x * f][y * f].b || B.push({
            x: x * f,
            y: y * f
        })
}

function DS(e, d, g, k) {
    for (var m = k.data, n = d * p; n < (d + 1) * p; n++)
        for (var C = e * p; C < (e + 1) * p; C++) {
            var s = 4 * (C + n * k[K]);
            m[s + 0] = g.r;
            m[s + 1] = g.g;
            m[s + 2] = g.b;
            m[s + 3] = g.a
        }
}

function DF(e, d, g, k) {
    c.strokeStyle = R;
    c.fillStyle = R;
    e *= p;
    d *= p;
    bp();
    c.moveTo(e, d);
    c.lineTo(Math.round(e + g * p * w), d + k * p * w);
    st();
    bp();
    ca(e, d, 1, 0, 2 * P, !1);
    st();
    cp()
}

function DP(e, d) {
    c.fillStyle = G;
    bp();
    ca(e * p, d * p, 1, 0, 2 * P, !1);
    cf();
    cp()
}

function DB() {
    c.fillStyle = Y;
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++) l[x][y].b && (bp(), c.rect(x * p, y * p, p, p), cf(), cp())
}

function GC(e, d, g) {
    var k = (d + g) / 2,
        m = F(g - k),
        n = {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        };
    e > g && (e = g);
    e < d && (e = d);
    e >= k ? n.r = T : n.g = T;
    n.a = A(F(e) * (1 / m) * T);
    return n
}

function D() {
    a[K] = W;
    var e = c.createImageData(W, H);
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++)
            if (!l[x][y].b) {
                var d = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 0
                }, g = l[x][y].x,
                    k = l[x][y].y;
                if (0 == J) d = MS(Mp(g, 2) + Mp(k, 2)), d = {
                    r: 0,
                    a: A(4E3 * d),
                    b: 0,
                    g: T
                }, d.g > T && (d.g = T), 0 > d.g && (d.g = 0);
                else if (1 == J) d = GC(g, -zf, zf);
                else if (2 == J) d = GC(k, -zf, zf);
                else if (3 == J) d = {
                    r: 0,
                    a: A(20 * (T - T / F(l[x][y].n))),
                    b: 0,
                    g: T
                }, d.g > T && (d.g = T), 0 > d.g && (d.g = 0);
                else if (4 == J) d = GC(l[x][y].c, -0.1, 0.1);
                else if (5 == J) continue;
                DS(x, y, d, e)
            }
    c.putImageData(e, 0, 0);
    x = 0;
    for (ln = B[L]; x < ln; x++) DP(B[x].x,
        B[x].y);
    if (v)
        for (x = 0; x < w; x += f)
            for (y = 0; y < h; y += f) g = l[x][y].x, k = l[x][y].y, DF(x, y, g, k);
    DB()
}

function M(e) {
    if (1 === e.which) {
        var d = e[z],
            g = e[r],
            k = function (e) {
                var k = e[z];
                e = e[r];
                var m = (k - d) / p / f,
                    N = (e - g) / p / f;
                0.1 < F(m) && (m = 0.1 * F(m) / m);
                0.1 < F(N) && (N = 0.1 * F(N) / N);
                var S = A(k / p),
                    Z = A(e / p);
                for (x = -5; 5 >= x; x++)
                    for (y = -5; 5 >= y; y++) 0 <= S + x && S + x < w && 0 <= Z + y && Z + y < h && !l[S + x][Z + y].b && 5 > MS(x * x + y * y) && q.push([S + x, Z + y, m, N]);
                d = k;
                g = e
            }, m = function (d) {
                V(Q, k, !1);
                V(O, m, !1)
            };
        X(Q, k, !1);
        X(O, m, !1)
    }
}

function PB(e) {
    e.preventDefault();
    var d = e[z],
        g = e[r],
        k = A(d / p),
        m = A(g / p),
        n = !0;
    l[k][m].b && (n = !1);
    l[k][m].b = n;
    var C = function (e) {
        d = e[z];
        g = e[r];
        k = A(d / p);
        m = A(g / p);
        l[k][m].b = n
    }, s = function (d) {
            V(Q, C, !1);
            V(O, s, !1)
        };
    X(Q, C, !1);
    X(O, s, !1)
}

function Kz(e) {
    e = e.keyCode;
    72 == e && (J = (J + 1) % 6);
    74 == e && (v = !v);
    75 == e && (0 < B[L] ? B[L] = 0 : I());
    76 == e && t()
}
X("mousedown", M, !1);
X("contextmenu", PB, !1);
b.addEventListener("keydown", Kz, !1);
ND = {
    0: {
        x: 0,
        y: 0
    },
    1: {
        x: 1,
        y: 0
    },
    2: {
        x: 0,
        y: -1
    },
    3: {
        x: -1,
        y: 0
    },
    4: {
        x: 0,
        y: 1
    },
    5: {
        x: 1,
        y: -1
    },
    6: {
        x: -1,
        y: -1
    },
    7: {
        x: -1,
        y: 1
    },
    8: {
        x: 1,
        y: 1
    }
};
Rf = {
    0: 0,
    1: 3,
    2: 4,
    3: 1,
    4: 2,
    5: 7,
    6: 8,
    7: 5,
    8: 6
};

function LN() {
    this.d = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.s = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.y = this.x = this.n = 0;
    this.b = !1;
    this.c = 0
}

function ml(e, d) {
    for (var g = 0; g < e; g++) {
        l[g] = [];
        for (var k = 0; k < d; k++) l[g][k] = new LN
    }
}

function IF(e, d, g) {
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++) {
            var k = l[x][y];
            if (!k.b) {
                k.n = g;
                k.x = e;
                k.y = d;
                var m = E(e, d, g);
                k.d = m.slice(0);
                k.s = m.slice(0)
            }
        }
}

function MP() {
    x = 0;
    for (ln = B[L]; x < ln; x++) {
        var e = B[x],
            d = A(e.x),
            g = A(e.y);
        0 <= d && d < w && 0 <= g && g < h && (d = l[d][g], g = d.y, e.x += d.x, e.y += g)
    }
}

function IB(e) {
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++) l[x][y].b = !1
}

function E(e, d, g) {
    var k = [],
        m = 3 * d,
        n = e * e,
        C = d * d,
        s = 2 * e * d,
        N = n + C;
    d = 1.5 * N;
    var S = 1 / 9 * g,
        Z = 1 / 36 * g,
        n = 4.5 * n - d,
        C = 4.5 * C - d,
        $ = 1 + 3 * e;
    e = 1 - 3 * e;
    var aa = 4.5 * (N + s) - d,
        s = 4.5 * (N - s) - d;
    k[0] = 4 / 9 * g * (1 - d);
    k[1] = S * ($ + n);
    k[2] = S * (1 - m + C);
    k[3] = S * (e + n);
    k[4] = S * (1 + m + C);
    k[5] = Z * ($ - m + s);
    k[6] = Z * (e - m + aa);
    k[7] = Z * (e + m + s);
    k[8] = Z * ($ + m + aa);
    return k
}

function Sz() {
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++) {
            var e = l[x][y];
            if (!e.b) {
                0 < x && x < w - 1 && 0 < y && y < h - 1 && (e.c = l[x + 1][y].y - l[x - 1][y].y - l[x][y + 1].x + l[x][y - 1].x);
                for (var d = 0; 9 > d; d++) {
                    var g = ND[d],
                        k = g.x + x,
                        g = g.y + y;
                    0 <= k && k < w && 0 <= g && g < h && (l[k][g].b ? l[x][y].s[Rf[d]] = e.d[d] : l[k][g].s[d] = e.d[d])
                }
            }
        }
}

function Zz() {
    for (x = 0; x < w; x++)
        for (y = 0; y < h; y++) {
            var e = l[x][y];
            if (!e.b) {
                for (var d = e.d, g = 0; 9 > g; g++) d[g] = e.s[g];
                var k = d[1] + d[5] + d[8],
                    m = d[4] + d[7] + d[8],
                    g = d[0] + d[2] + d[3] + d[6] + k + m - d[8],
                    k = (k - d[3] - d[6] - d[7]) / g,
                    m = (m - d[2] - d[5] - d[6]) / g;
                e.n = g;
                e.x = k;
                e.y = m;
                g = E(k, m, g);
                for (m = 0; 9 > m; m++) k = d[m], e.d[m] = k + o * (g[m] - k)
            }
        }
}

function U() {
    for (var e = 0; e < f; e++)
        for (Sz(), Zz(), 0 < B[L] && MP(); 0 < q[L];) {
            u = q.shift();
            var d = l[u[0]][u[1]];
            d.d = E(u[2], u[3], d.n)
        }
    D();
    requestAnimationFrame(U)
}

function t() {
    ml(w, h);
    IB();
    IF(0, 0, 1);
    q[L] = 0;
    I();
    D();
    U()
}
t();