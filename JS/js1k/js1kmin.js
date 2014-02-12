(function () {
    function C() {
        this.a = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.b = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.c = 1;
        this.y = this.x = 0
    }

    function x(e, d, k) {
        t = [];
        for (var h = e * e + d * d, b = 0; 9 > b; b++) {
            var f = y[b],
                f = f[0] * e + f[1] * d;
            t.push(E[b] * k * (1 + 3 * f + 4.5 * f * f - 1.5 * h))
        }
    }
    var l = [],
        e, d, t = [],
        F = 4 / 9,
        n = 1 / 9,
        p = 1 / 36,
        z = Math.sqrt,
        A = Math.pow,
        v = Math.abs,
        w = Math.floor,
        u = a.addEventListener,
        B = a.removeEventListener,
        q = w(a.width / 200),
        y = [
            [0, 0],
            [1, 0],
            [0, -1],
            [-1, 0],
            [0, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
            [1, 1]
        ],
        E = [F, n, n, n, n, p, p, p, p];
    a.style.background = "#000";
    for (e = 0; 200 > e; e++)
        for (l[e] = [], d = 0; 80 > d; d++) l[e][d] = new C, x(0, 0, 1), l[e][d].b = t.slice(0), l[e][d].a = t.slice(0);
    u("mousedown", function (e) {
        function d() {
            B("mousemove", k);
            B("mouseup", d)
        }

        function k(f) {
            var e = f.layerX;
            f = f.layerY;
            var d = (e - h) / q / 10,
                k = (f - b) / q / 10;
            0.1 < v(d) && (d = 0.1 * v(d) / d);
            0.1 < v(k) && (k = 0.1 * v(k) / k);
            for (var n = w(e / q), p = w(f / q), r = -5; 5 >= r; r++)
                for (var s = -5; 5 >= s; s++)
                    if (0 <= n + r && 200 > n + r && 0 <= p + s && 80 > p + s && 5 > z(r * r + s * s)) {
                        var u = l[n + r][p + s];
                        x(d, k, u.c);
                        u.a = t
                    }
            h = e;
            b = f
        }
        var h = e.layerX,
            b = e.layerY;
        u("mousemove", k);
        u("mouseup", d)
    });
    (function D() {
        for (var k =
            0; 10 > k; k++) {
            for (e = 0; 200 > e; e++)
                for (d = 0; 80 > d; d++)
                    for (var h = l[e][d], b = 0; 9 > b; b++) {
                        var f = y[b],
                            g = f[0] + e,
                            f = f[1] + d;
                        0 <= g && 200 > g && 0 <= f && 80 > f && (l[g][f].b[b] = h.a[b])
                    }
            for (e = 0; 200 > e; e++)
                for (d = 0; 80 > d; d++) {
                    h = l[e][d];
                    b = h.a;
                    for (g = 0; 9 > g; g++) b[g] = h.b[g];
                    var m = b[1] + b[5] + b[8],
                        f = b[4] + b[7] + b[8],
                        g = b[0] + b[2] + b[3] + b[6] + m + f - b[8],
                        m = (m - b[3] - b[6] - b[7]) / g,
                        f = (f - b[2] - b[5] - b[6]) / g;
                    h.c = g;
                    h.x = m;
                    h.y = f;
                    x(m, f, g);
                    for (g = 0; 9 > g; g++) f = b[g], h.a[g] = f + 1.7 * (t[g] - f)
                }
        }
        k = c.createImageData(a.width, a.height);
        h = k.data;
        for (e = 0; 200 > e; e++)
            for (d = 0; 80 > d; d++)
                for (b =
                    z(A(l[e][d].x, 2) + A(l[e][d].y, 2)), g = d * q; g < (d + 1) * q; g++)
                    for (f = e * q; f < (e + 1) * q; f++) m = 4 * (f + g * k.width), h[m + 0] = 0, h[m + 1] = 255, h[m + 2] = 0, h[m + 3] = w(4E3 * b);
        c.putImageData(k, 0, 0);
        requestAnimationFrame(D)
    })()
})();