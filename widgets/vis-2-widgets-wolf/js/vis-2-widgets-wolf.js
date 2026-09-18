/*
 * ioBroker.vis-2-widgets-wolf
 *
 * WICHTIG: Saemtlicher Code liegt innerhalb von vis.binds["vis-2-widgets-wolf"].
 * Code ausserhalb dieses Objekts schlaegt in VIS-2 stillschweigend fehl — das war
 * die Ursache des Widget-8-Fehlers in vis-2-widgets-sigenergy v1.4.x.
 *
 * Stand: Design-Grundlage. Gemeinsame Bausteine und das Gaszaehler-Widget sind
 * ausimplementiert (Meilenstein M1). Die uebrigen Widget-Klassen sind als
 * Einstiegspunkte angelegt und in M2/M3 zu fuellen.
 */

/* global vis */
"use strict";

vis.binds["vis-2-widgets-wolf"] = {
    version: "0.0.1",

    showVersion: function () {
        if (vis.binds["vis-2-widgets-wolf"].showVersion.done) {
            return;
        }
        vis.binds["vis-2-widgets-wolf"].showVersion.done = true;
        console.log("Version vis-2-widgets-wolf: " + vis.binds["vis-2-widgets-wolf"].version);
    },

    /* =================================================================
     * Hilfsfunktionen
     * ================================================================= */

    /** Zahl deutsch formatieren. */
    fmt: function (value, decimals) {
        var v = parseFloat(value);
        if (isNaN(v)) {
            return "--";
        }
        return v.toFixed(decimals === undefined ? 1 : decimals).replace(".", ",");
    },

    /** Zustand eines Objekts lesen, unabhaengig von der Quelle. */
    getVal: function (oid, fallback) {
        if (!oid || !vis.states) {
            return fallback;
        }
        var s = vis.states.attr ? vis.states.attr(oid + ".val") : vis.states[oid + ".val"];
        return s === undefined || s === null ? fallback : s;
    },

    /**
     * Auf Aenderungen eines Objekts reagieren.
     * Gibt eine Abmeldefunktion zurueck, die beim Zerstoeren des Widgets aufzurufen ist.
     */
    bind: function (oid, cb) {
        if (!oid || !vis.states || !vis.states.bind) {
            return function () {};
        }
        vis.states.bind(oid + ".val", cb);
        return function () {
            if (vis.states.unbind) {
                vis.states.unbind(oid + ".val", cb);
            }
        };
    },

    /**
     * Wert schreiben. Immer mit ack:false — die Anzeige folgt erst, wenn die
     * Quelle mit ack:true bestaetigt. Bis dahin traegt das Element die Klasse
     * wolf-pending.
     */
    setVal: function (oid, value, el) {
        if (!oid) {
            return;
        }
        if (el) {
            el.classList.add("wolf-pending");
            clearTimeout(el._wolfPendingTimer);
            el._wolfPendingTimer = setTimeout(function () {
                el.classList.remove("wolf-pending");
                el.setAttribute("title", "Keine Bestaetigung der Quelle innerhalb von 10 s");
            }, 10000);
        }
        vis.setValue(oid, value);
    },

    /** Entprellung fuer schreibende Bedienelemente. */
    debounce: function (fn, wait) {
        var t = null;
        return function () {
            var args = arguments,
                self = this;
            clearTimeout(t);
            t = setTimeout(function () {
                fn.apply(self, args);
            }, wait || 800);
        };
    },

    /**
     * Theme aus VIS-2 ableiten und am Widget-Container setzen.
     * VIS-2 haengt die Theme-Klasse an body bzw. an #vis_container.
     */
    applyTheme: function (el) {
        var dark = false;
        try {
            var body = document.body.className || "";
            dark = /dark/i.test(body) || (vis.conn && vis.conn.namespace && /dark/i.test(String(vis.theme || "")));
            if (!/dark|light/i.test(body) && window.matchMedia) {
                dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            }
        } catch (e) {
            dark = false;
        }
        el.setAttribute("data-wolf-theme", dark ? "dark" : "light");
    },

    /** Zaehlerstand in Ziffernfolge zerlegen. */
    splitDigits: function (value, intDigits, decDigits) {
        var v = parseFloat(value) || 0;
        var whole = Math.floor(v);
        var dec = Math.floor((v - whole) * Math.pow(10, decDigits));
        var w = String(whole).padStart(intDigits, "0").slice(-intDigits);
        var d = String(dec).padStart(decDigits, "0").slice(-decDigits);
        return { whole: w, dec: d, all: w + d };
    },

    /* =================================================================
     * Baustein: Status-LED
     * ================================================================= */

    renderLed: function (el, on, labelOn, labelOff) {
        if (!el._wolfInit) {
            el.className = "wolf-led-box";
            el.innerHTML =
                '<div class="wolf-bezel"><div class="wolf-led wolf-off"></div></div>' +
                '<div class="wolf-led-txt wolf-off"></div>';
            el._wolfInit = true;
        }
        var led = el.querySelector(".wolf-led");
        var txt = el.querySelector(".wolf-led-txt");
        led.className = "wolf-led " + (on ? "wolf-on" : "wolf-off");
        txt.className = "wolf-led-txt " + (on ? "wolf-on" : "wolf-off");
        txt.textContent = on ? labelOn || "Ein" : labelOff || "Aus";
        if (!labelOn && !labelOff) {
            txt.style.display = "none";
        }
    },

    /* =================================================================
     * Baustein: Zaehlwerk, Varianten A B C E F G H
     * Variante D (LCD) wurde verworfen.
     * ================================================================= */

    renderCounter: function (el, value, variant, intDigits, decDigits) {
        var B = vis.binds["vis-2-widgets-wolf"];
        var d = B.splitDigits(value, intDigits || 5, decDigits || 3);
        var v = (variant || "A").toUpperCase();
        var fn = B.counters[v] || B.counters.A;
        if (el._wolfVariant !== v) {
            el.innerHTML = "";
            el._wolfVariant = v;
            el._wolfBuilt = false;
        }
        // Basisklasse bleibt erhalten, damit der Container weiterhin ueber
        // .wolf-counter auffindbar ist; die Variante kommt als zweite Klasse dazu.
        el.className = "wolf-counter wolf-cnt-" + v.toLowerCase();
        fn(el, d, value);
    },

    counters: {
        /* A — mechanisches Rollenzaehlwerk */
        A: function (el, d) {
            var html = "";
            for (var i = 0; i < d.whole.length; i++) {
                html += "<span>" + d.whole[i] + "</span>";
            }
            for (var j = 0; j < d.dec.length; j++) {
                html += '<span class="wolf-dec">' + d.dec[j] + "</span>";
            }
            el.innerHTML = html;
        },

        /* B — Walzen, animiert */
        B: function (el, d) {
            if (!el._wolfBuilt) {
                var html = "";
                for (var i = 0; i < d.all.length; i++) {
                    var strip = "";
                    for (var n = 0; n < 10; n++) {
                        strip += "<span>" + n + "</span>";
                    }
                    html +=
                        '<div class="wolf-col' +
                        (i >= d.whole.length ? " wolf-dec" : "") +
                        '"><div class="wolf-strip">' +
                        strip +
                        "</div></div>";
                }
                el.innerHTML = html;
                el._wolfBuilt = true;
            }
            var strips = el.querySelectorAll(".wolf-strip");
            for (var k = 0; k < strips.length && k < d.all.length; k++) {
                strips[k].style.transform = "translateY(-" + parseInt(d.all[k], 10) * 38 + "px)";
            }
        },

        /* C — Zaehlerplakette */
        C: function (el, d) {
            var w = "";
            for (var i = 0; i < d.whole.length; i++) {
                w += "<span>" + d.whole[i] + "</span>";
            }
            for (var j = 0; j < d.dec.length; j++) {
                w += '<span class="wolf-dec">' + d.dec[j] + "</span>";
            }
            el.innerHTML = '<div class="wolf-win">' + w + "</div>";
        },

        /* E — VFD-Leuchtanzeige mit Sieben-Segment */
        E: function (el, d) {
            var B = vis.binds["vis-2-widgets-wolf"];
            el.innerHTML = B.sevenSegRow(d.all, d.whole.length, "#FFA23F", "rgba(255,162,63,.055)", "#FF7A3F", true);
        },

        /* F — typografisch, flach */
        F: function (el, d) {
            var intFmt = Number(d.whole).toLocaleString("de-DE");
            el.innerHTML =
                '<span class="wolf-int">' +
                intFmt +
                '</span><span class="wolf-sep">,</span><span class="wolf-frac">' +
                d.dec +
                "</span>";
        },

        /* G — Kachelziffern in den Theme-Farben */
        G: function (el, d) {
            var html = "";
            for (var i = 0; i < d.whole.length; i++) {
                html += "<span>" + d.whole[i] + "</span>";
            }
            for (var j = 0; j < d.dec.length; j++) {
                html += '<span class="wolf-dec">' + d.dec[j] + "</span>";
            }
            el.innerHTML = html;
        },

        /* H — Walzen fuer ganze m3, Zeigerwerk fuer die Nachkommastellen */
        H: function (el, d, raw) {
            var B = vis.binds["vis-2-widgets-wolf"];
            var rolls = "";
            for (var i = 0; i < d.whole.length; i++) {
                rolls += "<span>" + d.whole[i] + "</span>";
            }
            var v = parseFloat(raw) || 0;
            var frac4 = String(Math.floor((v - Math.floor(v)) * 10000)).padStart(4, "0");
            var dials = "";
            var labels = ["0,1", "0,01", "0,001", "0,0001"];
            for (var k = 0; k < 4; k++) {
                dials += B.renderDial(parseInt(frac4[k], 10), labels[k]);
            }
            el.innerHTML =
                '<div class="wolf-cnt-a">' + rolls + '</div><div class="wolf-dials">' + dials + "</div>";
        },
    },

    /** Eine Zeigerskala 0..9 als SVG. */
    renderDial: function (value, label) {
        var ang = (value / 10) * 360 - 90;
        var r = 17,
            cx = 20,
            cy = 20;
        var ticks = "";
        for (var i = 0; i < 10; i++) {
            var a = (i / 10) * 2 * Math.PI - Math.PI / 2;
            var x1 = cx + Math.cos(a) * (r - 3),
                y1 = cy + Math.sin(a) * (r - 3);
            var x2 = cx + Math.cos(a) * (r - 6.5),
                y2 = cy + Math.sin(a) * (r - 6.5);
            ticks +=
                '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
                '" y2="' + y2.toFixed(1) + '" stroke="var(--wolf-muted)" stroke-width="1.2"/>';
            if (i % 2 === 0) {
                var tx = cx + Math.cos(a) * (r - 10.5),
                    ty = cy + Math.sin(a) * (r - 10.5) + 3;
                ticks +=
                    '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) +
                    '" font-size="6" text-anchor="middle" fill="var(--wolf-muted)">' + i + "</text>";
            }
        }
        var hx = cx + Math.cos((ang * Math.PI) / 180) * (r - 7);
        var hy = cy + Math.sin((ang * Math.PI) / 180) * (r - 7);
        return (
            '<svg width="46" height="58" viewBox="0 0 40 52" role="img" aria-label="Zeiger ' + label + '">' +
            '<circle cx="20" cy="20" r="17.5" fill="var(--wolf-surface)" stroke="#B01F1A" stroke-width="1.6"/>' +
            ticks +
            '<line x1="20" y1="20" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) +
            '" stroke="#B01F1A" stroke-width="1.8" stroke-linecap="round"/>' +
            '<circle cx="20" cy="20" r="2" fill="#B01F1A"/>' +
            '<text x="20" y="47" font-size="8" text-anchor="middle" fill="var(--wolf-muted)">' + label + "</text>" +
            "</svg>"
        );
    },

    /* ---------------------------------------------- Sieben-Segment fuer VFD */

    segMap: {
        0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc",
        5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abfgcd",
    },

    sevenSegRow: function (digits, decFrom, onColor, offColor, decColor, glow) {
        var B = vis.binds["vis-2-widgets-wolf"];
        var W = 22,
            GAP = 4,
            x = 2,
            out = "";
        if (glow) {
            out +=
                '<defs><filter id="wolfGlow" x="-60%" y="-60%" width="220%" height="220%">' +
                '<feGaussianBlur stdDeviation="1.6" result="b"/>' +
                '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
                "</filter></defs>";
        }
        for (var i = 0; i < digits.length; i++) {
            if (i === decFrom) {
                out += '<circle cx="' + (x + 1.5) + '" cy="38" r="2" fill="' + (decColor || onColor) + '"/>';
                x += 7;
            }
            out += B.sevenSegDigit(digits[i], x, i >= decFrom ? decColor || onColor : onColor, offColor, glow);
            x += W + GAP;
        }
        return '<svg height="46" viewBox="0 0 ' + x + ' 46" role="img" aria-label="Zaehlerstand">' + out + "</svg>";
    },

    sevenSegDigit: function (ch, ox, on, off, glow) {
        var B = vis.binds["vis-2-widgets-wolf"];
        var W = 22,
            H = 42,
            x0 = 3.5,
            x1 = W - 3.5,
            yT = 4,
            yM = H / 2,
            yB = H - 4,
            t = 3.2;

        function hseg(y, a, b) {
            return [[a + 2, y], [a + 4.6, y - t], [b - 4.6, y - t], [b - 2, y], [b - 4.6, y + t], [a + 4.6, y + t]];
        }
        function vseg(x, ya, yb) {
            return [[x, ya + 2], [x + t, ya + 4.6], [x + t, yb - 4.6], [x, yb - 2], [x - t, yb - 4.6], [x - t, ya + 4.6]];
        }

        var segs = {
            a: hseg(yT, x0, x1), g: hseg(yM, x0, x1), d: hseg(yB, x0, x1),
            f: vseg(x0, yT, yM), b: vseg(x1, yT, yM),
            e: vseg(x0, yM, yB), c: vseg(x1, yM, yB),
        };
        var lit = B.segMap[ch] || "";
        var out = "";
        Object.keys(segs).forEach(function (k) {
            var pts = segs[k]
                .map(function (p) {
                    return (p[0] + ox).toFixed(1) + "," + p[1].toFixed(1);
                })
                .join(" ");
            var isOn = lit.indexOf(k) > -1;
            out +=
                '<polygon points="' + pts + '" fill="' + (isOn ? on : off) + '"' +
                (isOn && glow ? ' filter="url(#wolfGlow)"' : "") + "/>";
        });
        return out;
    },

    /* =================================================================
     * Baustein: Bogenanzeige
     * ================================================================= */

    renderArc: function (el, value, min, max, color) {
        if (!el._wolfInit) {
            el.innerHTML =
                '<svg viewBox="0 0 120 78" aria-hidden="true">' +
                '<path d="M14 68 A46 46 0 0 1 106 68" fill="none" stroke="var(--wolf-line)" stroke-width="10" stroke-linecap="round"/>' +
                '<path class="wolf-arc-v" d="M14 68 A46 46 0 0 1 106 68" fill="none" stroke="' +
                (color || "var(--wolf-accent)") +
                '" stroke-width="10" stroke-linecap="round"/></svg>';
            el._wolfInit = true;
        }
        var p = el.querySelector(".wolf-arc-v");
        var len = p.getTotalLength();
        var frac = (parseFloat(value) - min) / (max - min);
        frac = Math.max(0, Math.min(1, isNaN(frac) ? 0 : frac));
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len * (1 - frac);
    },

    /* =================================================================
     * Widget: Gaszaehler — tplWolfGasMeter
     * ================================================================= */

    gasMeter: function (widgetID, view, data, style) {
        var B = vis.binds["vis-2-widgets-wolf"];
        var el = document.getElementById(widgetID);
        if (!el) {
            return setTimeout(function () {
                B.gasMeter(widgetID, view, data, style);
            }, 100);
        }

        // Aufraeumen, falls das Widget neu gezeichnet wird
        if (el._wolfUnbind) {
            el._wolfUnbind.forEach(function (fn) {
                fn();
            });
        }
        el._wolfUnbind = [];

        el.className = "wolf-w wolf-gasmeter";
        B.applyTheme(el);

        el.innerHTML =
            '<div class="wolf-head">' +
            "<div><h3>" + (data.title || "Gaszähler") + "</h3>" +
            '<div class="wolf-hint">' + (data.subtitle || "") + "</div></div>" +
            '<div class="wolf-led-holder"></div>' +
            "</div>" +
            '<div class="wolf-counter-row" style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
            '<div class="wolf-counter"></div><span class="wolf-label">m³</span></div>' +
            "<div>" +
            '<span class="wolf-label">Momentandurchfluss</span>' +
            '<div class="wolf-big" style="text-align:left;font-size:32px"><span class="wolf-flowv">--</span><small>m³/h</small></div>' +
            '<div class="wolf-bar"><span style="width:0"></span></div>' +
            "</div>" +
            '<div class="wolf-foot">' +
            '<div><div class="wolf-label">Heute</div><div class="wolf-v wolf-num wolf-today">--<small>m³</small></div></div>' +
            '<div><div class="wolf-label">Monat</div><div class="wolf-v wolf-num wolf-month">--<small>m³</small></div></div>' +
            '<div><div class="wolf-label">Kosten Monat</div><div class="wolf-v wolf-num wolf-cost">--<small>€</small></div></div>' +
            "</div>";

        var ledEl = el.querySelector(".wolf-led-holder");
        var cntEl = el.querySelector(".wolf-counter");
        var flowEl = el.querySelector(".wolf-flowv");
        var barEl = el.querySelector(".wolf-bar span");
        var todayEl = el.querySelector(".wolf-today");
        var monthEl = el.querySelector(".wolf-month");
        var costEl = el.querySelector(".wolf-cost");

        var schwelle = parseFloat(data.schwelle) || 0.02;
        var maxFlow = parseFloat(data.max_flow) || 4;
        var variant = data.variant || "A";
        var intD = parseInt(data.digits_int, 10) || 5;
        var decD = parseInt(data.digits_dec, 10) || 3;

        function update() {
            var reading = B.getVal(data.oid_zaehlerstand, 0);
            var flow = parseFloat(B.getVal(data.oid_durchfluss, 0)) || 0;
            var today = B.getVal(data.oid_heute, null);
            var month = B.getVal(data.oid_monat, null);

            B.renderCounter(cntEl, reading, variant, intD, decD);
            B.renderLed(ledEl, flow > schwelle, "Verbrauch", "Kein Verbrauch");
            flowEl.textContent = B.fmt(flow, 2);
            barEl.style.width = Math.min(100, (flow / maxFlow) * 100) + "%";

            todayEl.innerHTML = (today === null ? "--" : B.fmt(today, 2)) + "<small>m³</small>";
            monthEl.innerHTML = (month === null ? "--" : B.fmt(month, 1)) + "<small>m³</small>";

            if (month !== null && data.arbeitspreis) {
                var kwh = parseFloat(month) * (parseFloat(data.brennwert) || 11.482) *
                    (parseFloat(data.zustandszahl) || 0.9612);
                var cost = kwh * parseFloat(data.arbeitspreis) + (parseFloat(data.grundpreis) || 0);
                costEl.innerHTML = B.fmt(cost, 2) + "<small>€</small>";
            } else {
                costEl.innerHTML = "--<small>€</small>";
            }
        }

        ["oid_zaehlerstand", "oid_durchfluss", "oid_heute", "oid_monat"].forEach(function (key) {
            if (data[key]) {
                el._wolfUnbind.push(B.bind(data[key], update));
            }
        });

        update();
    },

    /* =================================================================
     * Weitere Widget-Klassen — Einstiegspunkte
     *
     * M2: circuit, dhw, heatCurve
     * M3: schema, trends, messages
     * Aufbau jeweils wie gasMeter: Container holen, alte Bindungen loesen,
     * DOM einmal aufbauen, dann nur noch Werte aktualisieren.
     * ================================================================= */

    boiler: function (widgetID, view, data, style) {
        var B = vis.binds["vis-2-widgets-wolf"];
        var el = document.getElementById(widgetID);
        if (!el) {
            return setTimeout(function () {
                B.boiler(widgetID, view, data, style);
            }, 100);
        }
        el.className = "wolf-w wolf-boiler";
        B.applyTheme(el);
        el.innerHTML = '<div class="wolf-head"><h3>' + (data.title || "Kesselstatus") + "</h3></div>";
        // TODO M1/M2: Bogenanzeigen, Phasenzuordnung, Betriebsstunden
    },

    circuit: function () {
        /* TODO M2 — Heizkreis-Bedienung, schreibend */
    },

    heatCurve: function () {
        /* TODO M2 — Heizkurve, schreibend */
    },

    dhw: function () {
        /* TODO M2 — Warmwasser, schreibend */
    },

    schema: function () {
        /* TODO M3 — Anlagenschema mit Flussanimation */
    },

    trends: function () {
        /* TODO M3 — Verlaeufe aus history/sql/influxdb */
    },

    messages: function () {
        /* TODO M3 — Meldungen und Sammelstoerung */
    },
};

vis.binds["vis-2-widgets-wolf"].showVersion();
