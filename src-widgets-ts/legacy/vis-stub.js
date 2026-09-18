/*
 * Minimal-Nachbildung des VIS-Laufzeitobjekts fuer die Sandbox.
 *
 * Bildet genau die Teile von `vis` nach, die der Widget-Code benutzt:
 *   vis.binds        — Namensraum, in dem der Widget-Code lebt
 *   vis.states       — Zustandsspeicher mit attr / bind / unbind
 *   vis.setValue     — Schreiben; simuliert die Bestaetigung der Quelle
 *
 * Damit laufen die Widgets ohne ioBroker im Browser. Das ersetzt keinen Test
 * im dev-server — Bindings, das Widget-Auswahlmenue und die Uebersetzungen
 * lassen sich nur dort pruefen.
 */
(function () {
    "use strict";

    var data = {};
    var subs = {};

    function notify(key) {
        (subs[key] || []).forEach(function (cb) {
            try {
                cb(null, { val: data[key] });
            } catch (e) {
                console.error("Sandbox: Fehler im Abonnenten von " + key, e);
            }
        });
    }

    window.vis = {
        binds: {},
        theme: "light",

        states: {
            attr: function (key) {
                return data[key];
            },
            bind: function (key, cb) {
                (subs[key] = subs[key] || []).push(cb);
            },
            unbind: function (key, cb) {
                if (!subs[key]) {
                    return;
                }
                var i = subs[key].indexOf(cb);
                if (i > -1) {
                    subs[key].splice(i, 1);
                }
            },
        },

        /**
         * Schreiben. In VIS-2 geht der Wert mit ack:false an den Quelladapter;
         * die Anzeige folgt erst mit dessen Bestaetigung. Die Sandbox simuliert
         * das mit einer kurzen Verzoegerung, damit der Zustand "wird uebernommen"
         * sichtbar wird.
         */
        setValue: function (oid, value) {
            console.log("setValue (ack:false) →", oid, value);
            setTimeout(function () {
                window.sandbox.set(oid, value);
                console.log("Bestaetigung (ack:true) ←", oid, value);
            }, window.sandbox.ackDelay);
        },
    };

    /** Steuerung der Sandbox selbst, nicht Teil von VIS. */
    window.sandbox = {
        ackDelay: 1200,

        set: function (oid, value) {
            data[oid + ".val"] = value;
            notify(oid + ".val");
        },

        get: function (oid) {
            return data[oid + ".val"];
        },

        /** Mehrere Werte auf einmal setzen. */
        seed: function (obj) {
            Object.keys(obj).forEach(function (oid) {
                window.sandbox.set(oid, obj[oid]);
            });
        },
    };
})();
