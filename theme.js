(function () {
    "use strict";

    var THEME_KEY = "kiru-theme";
    var ACCENT_KEY = "kiru-accent";
    var POSITION_KEY = "kiru-popover-pos";

    var BG_THEMES = [
        { id: "paper", label: "paper", bg: "#fbfaf7", fg: "#2b2622" },
        { id: "sage", label: "sage", bg: "#f6f7f1", fg: "#262e26" },
        { id: "blush", label: "blush", bg: "#fbf1ef", fg: "#2e2320" },
        { id: "dark", label: "dark", bg: "#1b1917", fg: "#ece6dd" }
    ];

    var ACCENTS = [
        { id: "default", a: "#e7c9c2", b: "#d8c7e0" },
        { id: "clay", a: "#d9a98c", b: "#c98f7a" },
        { id: "sage", a: "#a9c0a0", b: "#8aab93" },
        { id: "sky", a: "#a9c2d9", b: "#8fa9c9" },
        { id: "gold", a: "#e3c678", b: "#d1a85a" }
    ];

    function applyTheme(themeId) {
        if (themeId && themeId !== "paper") {
            document.documentElement.setAttribute("data-theme", themeId);
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }

    function applyAccent(accent) {
        if (!accent) return;
        document.documentElement.style.setProperty("--c-accent-a", accent.a);
        document.documentElement.style.setProperty("--c-accent-b", accent.b);
    }

    function getSavedTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || "paper";
        } catch (e) {
            return "paper";
        }
    }

    function getSavedAccent() {
        try {
            var raw = localStorage.getItem(ACCENT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveTheme(themeId) {
        try {
            localStorage.setItem(THEME_KEY, themeId);
        } catch (e) {}
    }

    function saveAccent(accent) {
        try {
            localStorage.setItem(ACCENT_KEY, JSON.stringify(accent));
        } catch (e) {}
    }

    function getSavedPosition() {
        try {
            var raw = localStorage.getItem(POSITION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function savePosition(pos) {
        try {
            if (pos) {
                localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
            } else {
                localStorage.removeItem(POSITION_KEY);
            }
        } catch (e) {}
    }

    // Apply saved state immediately (this script is loaded synchronously
    // in <head>, before the body renders, so there is no flash).
    var currentTheme = getSavedTheme();
    var currentAccent = getSavedAccent();
    applyTheme(currentTheme);
    applyAccent(currentAccent);

    function buildPopover(swatchEl) {
        var popover = document.createElement("div");
        popover.className = "theme-popover";
        popover.setAttribute("role", "dialog");
        popover.setAttribute("aria-label", "Theme settings");

        var handle = document.createElement("div");
        handle.className = "theme-popover-handle";
        handle.title = "drag to move";
        handle.innerHTML = "<span></span><span></span><span></span>";
        popover.appendChild(handle);

        var bgLabel = document.createElement("span");
        bgLabel.className = "theme-popover-label";
        bgLabel.textContent = "background";
        popover.appendChild(bgLabel);

        var bgRow = document.createElement("div");
        bgRow.className = "theme-swatch-row";
        BG_THEMES.forEach(function (t) {
            var btn = document.createElement("button");
            btn.className = "theme-swatch";
            btn.type = "button";
            btn.title = t.label;
            btn.style.background = t.bg;
            if (t.id === currentTheme) btn.classList.add("is-active");
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                currentTheme = t.id;
                applyTheme(t.id);
                saveTheme(t.id);
                bgRow.querySelectorAll(".theme-swatch").forEach(function (s) {
                    s.classList.remove("is-active");
                });
                btn.classList.add("is-active");
            });
            bgRow.appendChild(btn);
        });
        popover.appendChild(bgRow);

        var accentLabel = document.createElement("span");
        accentLabel.className = "theme-popover-label";
        accentLabel.textContent = "accent";
        popover.appendChild(accentLabel);

        var accentRow = document.createElement("div");
        accentRow.className = "theme-swatch-row";

        function markActiveAccent(id) {
            accentRow.querySelectorAll(".theme-swatch").forEach(function (s) {
                s.classList.remove("is-active");
            });
            var match = accentRow.querySelector('[data-accent-id="' + id + '"]');
            if (match) match.classList.add("is-active");
        }

        ACCENTS.forEach(function (acc) {
            var btn = document.createElement("button");
            btn.className = "theme-swatch theme-swatch-accent";
            btn.type = "button";
            btn.title = acc.id;
            btn.dataset.accentId = acc.id;
            btn.style.background = "linear-gradient(135deg, " + acc.a + " 0%, " + acc.b + " 100%)";
            if (currentAccent && currentAccent.id === acc.id) btn.classList.add("is-active");
            if (!currentAccent && acc.id === "default") btn.classList.add("is-active");
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                currentAccent = acc;
                applyAccent(acc);
                saveAccent(acc);
                markActiveAccent(acc.id);
            });
            accentRow.appendChild(btn);
        });

        popover.appendChild(accentRow);

        var dragging = false;
        var dragOffsetX = 0;
        var dragOffsetY = 0;

        handle.addEventListener("pointerdown", function (e) {
            dragging = true;
            var rect = popover.getBoundingClientRect();
            // switch to viewport-fixed positioning at the current spot,
            // so dragging doesn't jump the panel.
            popover.style.position = "fixed";
            popover.style.left = rect.left + "px";
            popover.style.top = rect.top + "px";
            popover.style.right = "auto";
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            handle.setPointerCapture(e.pointerId);
            e.preventDefault();
            e.stopPropagation();
        });

        handle.addEventListener("pointermove", function (e) {
            if (!dragging) return;
            var maxLeft = window.innerWidth - popover.offsetWidth - 8;
            var maxTop = window.innerHeight - popover.offsetHeight - 8;
            var left = Math.min(Math.max(8, e.clientX - dragOffsetX), Math.max(8, maxLeft));
            var top = Math.min(Math.max(8, e.clientY - dragOffsetY), Math.max(8, maxTop));
            popover.style.left = left + "px";
            popover.style.top = top + "px";
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            savePosition({ left: parseFloat(popover.style.left), top: parseFloat(popover.style.top) });
        }
        handle.addEventListener("pointerup", endDrag);
        handle.addEventListener("pointercancel", endDrag);

        // A pointerdown/pointerup pair on the handle also fires a trailing
        // "click" that bubbles to the swatch's own toggle listener and
        // would instantly close the popover right after a drag. Swallow it.
        handle.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

        handle.addEventListener("dblclick", function (e) {
            e.preventDefault();
            e.stopPropagation();
            popover.style.position = "";
            popover.style.left = "";
            popover.style.top = "";
            popover.style.right = "";
            savePosition(null);
        });

        popover.applySavedPosition = function () {
            var pos = getSavedPosition();
            if (!pos) return;
            var maxLeft = window.innerWidth - 220;
            var maxTop = window.innerHeight - 100;
            popover.style.position = "fixed";
            popover.style.left = Math.min(Math.max(8, pos.left), Math.max(8, maxLeft)) + "px";
            popover.style.top = Math.min(Math.max(8, pos.top), Math.max(8, maxTop)) + "px";
            popover.style.right = "auto";
        };

        return popover;
    }

    function init() {
        var swatches = document.querySelectorAll(".logo-swatch");
        swatches.forEach(function (swatch) {
            swatch.classList.add("theme-trigger");
            swatch.setAttribute("role", "button");
            swatch.setAttribute("tabindex", "0");
            swatch.setAttribute("aria-label", "Theme settings");

            var popover = buildPopover(swatch);
            swatch.appendChild(popover);

            function toggle(e) {
                e.preventDefault();
                e.stopPropagation();
                var opening = !popover.classList.contains("open");
                if (opening) popover.applySavedPosition();
                popover.classList.toggle("open");
            }

            swatch.addEventListener("click", toggle);
            swatch.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") toggle(e);
            });

            document.addEventListener("click", function (e) {
                if (!swatch.contains(e.target)) popover.classList.remove("open");
            });
            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape") popover.classList.remove("open");
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
