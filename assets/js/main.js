/* 株式会社電総 コーポレートサイト 共通スクリプト */
(function () {
  "use strict";

  /* JS が動く環境であることを示す。
     アニメーションの初期状態（非表示）は .js 配下でのみ適用し、
     JS が無効でもコンテンツが消えないようにする */
  document.documentElement.classList.add("js");

  /* ---------- 見出しのエコー（残像）markup を自動生成 ---------- */
  document.querySelectorAll("[data-echo]").forEach(function (el) {
    var text = el.textContent.trim();
    if (!text) return;
    el.textContent = "";
    el.classList.add("is-echo-host");

    var solid = document.createElement("span");
    solid.className = "echo-solid";
    solid.textContent = text;

    var echo = document.createElement("span");
    echo.className = "echo-echo";
    echo.setAttribute("aria-hidden", "true");
    echo.textContent = text;

    el.appendChild(solid);
    el.appendChild(echo);
  });

  /* ---------- 順送りフェードイン：子要素に連番を振る ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add("reveal");
      child.style.setProperty("--i", i);
    });
  });

  /* ---------- ハンバーガーメニュー ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
  }

  /* ---------- スクロール入場アニメーション ---------- */
  var animated = document.querySelectorAll("[data-animate]");
  if (animated.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
      animated.forEach(function (el) { io.observe(el); });
    } else {
      animated.forEach(function (el) { el.classList.add("is-inview"); });
    }
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ヒーロー動画 ----------
     動きを抑える設定・データ節約モードでは、2MBの動画を落とさずに
     静止画（.hero__fallback）だけを見せる */
  var heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(conn && conn.saveData);
    if (reduced || saveData) {
      heroVideo.remove();
    } else {
      /* 自動再生が拒否されても静止画が残るので、握りつぶしてよい */
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* ---------- パワーライン：スクロールに追従する蛇行配線 ----------
     電線の経路は実際のレイアウトを測って生成する（どの幅でもズレない）。
     スクロールした分だけ電線が引かれ、先端を電子が走り、
     通過した項目の写真が浮かび上がる（一度出たものは戻さない） */
  var pline = document.querySelector(".powerline");
  if (pline) {
    var plSvg = pline.querySelector(".powerline__wire");
    var plItems = Array.prototype.slice.call(pline.querySelectorAll(".powerline__item"));
    var SVG_NS = "http://www.w3.org/2000/svg";
    var wirePath = null, tipDot = null, wireLen = 0, marks = [];

    var mk = function (tag, attrs) {
      var el = document.createElementNS(SVG_NS, tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    /* 直角の角を45°に面取りして、回路図の配線らしくする */
    var chamfer = function (pts) {
      var C = 16, out = [pts[0]];
      for (var i = 1; i < pts.length - 1; i++) {
        var p = pts[i], a = out[out.length - 1], b = pts[i + 1];
        var d1x = Math.sign(p[0] - a[0]), d1y = Math.sign(p[1] - a[1]);
        var d2x = Math.sign(b[0] - p[0]), d2y = Math.sign(b[1] - p[1]);
        if (d1x === d2x && d1y === d2y) continue;  /* 直進はそのまま */
        out.push([p[0] - d1x * C, p[1] - d1y * C]);
        out.push([p[0] + d2x * C, p[1] + d2y * C]);
      }
      out.push(pts[pts.length - 1]);
      return out;
    };

    var buildWire = function () {
      var box = pline.getBoundingClientRect();
      var W = box.width, H = box.height;
      plSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      while (plSvg.firstChild) plSvg.removeChild(plSvg.firstChild);
      marks = [];

      /* 経路：上辺中央から入り、項目の真上を通って端まで抜け、
         端で折れて下り、逆方向へ走る……を繰り返す */
      var pts = [[W / 2, 0]];
      var nodePts = [];
      plItems.forEach(function (it) {
        var r = it.getBoundingClientRect();
        var cx = r.left - box.left + r.width / 2;
        var ny = r.top - box.top - 30;
        var prev = pts[pts.length - 1];
        pts.push([prev[0], ny]);
        pts.push([cx, ny]);
        nodePts.push([cx, ny]);
        pts.push([cx < prev[0] ? 10 : W - 10, ny]);
      });

      var d = chamfer(pts).map(function (p, i) {
        return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      }).join(" ");
      wirePath = mk("path", { d: d, "class": "wire" });
      plSvg.appendChild(wirePath);

      wireLen = wirePath.getTotalLength();
      wirePath.style.strokeDasharray = wireLen;
      wirePath.style.strokeDashoffset = wireLen;

      /* 各ノードが経路上のどの位置（割合）にあるかを求める */
      var nodes = nodePts.map(function (np) {
        var best = 0, bestD = Infinity;
        for (var i = 0; i <= 400; i++) {
          var pt = wirePath.getPointAtLength(wireLen * i / 400);
          var dx = pt.x - np[0], dy = pt.y - np[1];
          var dist = dx * dx + dy * dy;
          if (dist < bestD) { bestD = dist; best = i / 400; }
        }
        /* ノード＝接続点：破線リング＋波紋＋芯＋写真への引込線 */
        var g = mk("g", { "class": "pl-node", transform: "translate(" + np[0].toFixed(1) + " " + np[1].toFixed(1) + ")" });
        g.appendChild(mk("circle", { r: 9, "class": "ring" }));
        g.appendChild(mk("circle", { r: 6.5, "class": "ripple" }));
        g.appendChild(mk("circle", { r: 3.2, "class": "core" }));
        g.appendChild(mk("line", { x1: 0, y1: 7, x2: 0, y2: 27, "class": "stub", pathLength: 1 }));
        plSvg.appendChild(g);
        return { frac: best, el: g };
      });
      marks = nodes;

      tipDot = mk("circle", { r: 5.5, "class": "tip", cx: W / 2, cy: 0, opacity: 0 });
      plSvg.appendChild(tipDot);
    };

    var plProgress = -1;
    var drawWire = function () {
      if (!wirePath) return;
      var box = pline.getBoundingClientRect();
      /* 画面の下から3割の位置を「先端」が追いかける */
      var p = (window.innerHeight * 0.78 - box.top) / (box.height + window.innerHeight * 0.08);
      p = Math.max(0, Math.min(1, p));
      if (p === plProgress) return;
      plProgress = p;
      wirePath.style.strokeDashoffset = wireLen * (1 - p);
      var pt = wirePath.getPointAtLength(wireLen * p);
      tipDot.setAttribute("cx", pt.x);
      tipDot.setAttribute("cy", pt.y);
      tipDot.setAttribute("opacity", p > 0.004 ? 1 : 0);
      marks.forEach(function (m, k) {
        if (p >= m.frac) {
          plItems[k].classList.add("is-on");
          m.el.classList.add("is-lit");
        }
      });
    };

    if (reducedPl()) {
      buildWire();
      wirePath.style.strokeDashoffset = 0;
      tipDot.setAttribute("opacity", 0);
      plItems.forEach(function (it) { it.classList.add("is-on"); });
      marks.forEach(function (m) { m.el.classList.add("is-lit"); });
    } else {
      buildWire();
      drawWire();
      var plTick = false;
      var onPlScroll = function () {
        if (plTick) return;
        plTick = true;
        requestAnimationFrame(function () { plTick = false; drawWire(); });
      };
      window.addEventListener("scroll", onPlScroll, { passive: true });
      var plResize = null;
      window.addEventListener("resize", function () {
        clearTimeout(plResize);
        plResize = setTimeout(function () { buildWire(); plProgress = -1; drawWire(); }, 150);
      });
      /* 画像の読み込みでレイアウト高が変わったら引き直す */
      window.addEventListener("load", function () { buildWire(); plProgress = -1; drawWire(); });
    }
  }
  function reducedPl() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- 証拠バー：数字のカウントアップ ---------- */
  var nums = document.querySelectorAll(".trust__value strong");
  if (nums.length && !reduced && "IntersectionObserver" in window) {
    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        ioNum.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.textContent, 10);
        if (!target || target < 2) return;   /* 「1」は回しても見えない */
        var t0 = null, dur = 1100;
        el.textContent = "0";
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);     /* 減速して着地する */
          el.textContent = String(Math.round(target * e));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { ioNum.observe(el); });
  }

  /* ---------- /works/ 絞り込み ---------- */
  var filter = document.querySelector("[data-filter]");
  if (filter) {
    var cards = document.querySelectorAll("[data-work]");
    var state = {};

    filter.querySelectorAll(".filter__group").forEach(function (group) {
      var key = group.getAttribute("data-filter-key");
      state[key] = "all";
      group.querySelectorAll(".pill-toggle").forEach(function (pill) {
        pill.addEventListener("click", function () {
          group.querySelectorAll(".pill-toggle").forEach(function (p) {
            p.setAttribute("aria-pressed", "false");
          });
          pill.setAttribute("aria-pressed", "true");
          state[key] = pill.getAttribute("data-value");
          apply();
        });
      });
    });

    function apply() {
      cards.forEach(function (card) {
        var show = Object.keys(state).every(function (key) {
          if (state[key] === "all") return true;
          var values = (card.getAttribute("data-" + key) || "").split(/\s+/);
          return values.indexOf(state[key]) !== -1;
        });
        card.classList.toggle("is-hidden", !show);
      });
    }
  }

  /* ---------- /contact/ 種別分岐 ---------- */
  var typeCards = document.querySelectorAll(".type-card");
  if (typeCards.length) {
    var typeInput = document.getElementById("contact-type");
    typeCards.forEach(function (card) {
      card.addEventListener("click", function () {
        typeCards.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        card.setAttribute("aria-pressed", "true");
        var type = card.getAttribute("data-type");
        if (typeInput) typeInput.value = type;

        document.querySelectorAll("[data-show-for]").forEach(function (row) {
          var showFor = row.getAttribute("data-show-for").split(/\s+/);
          row.classList.toggle("is-hidden", showFor.indexOf(type) === -1);
        });
        var form = document.querySelector(".form");
        if (form) form.hidden = false;
      });
    });
  }

  /* ---------- 写真添付：ドラッグ&ドロップ ---------- */
  var dropzone = document.querySelector(".dropzone");
  if (dropzone) {
    var input = dropzone.querySelector('input[type="file"]');
    var list = dropzone.querySelector(".dropzone__list");

    ["dragenter", "dragover"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        dropzone.classList.add("is-drag");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        dropzone.classList.remove("is-drag");
      });
    });
    dropzone.addEventListener("drop", function (e) {
      if (input && e.dataTransfer && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        render(input.files);
      }
    });
    if (input) {
      input.addEventListener("change", function () { render(input.files); });
    }
    function render(files) {
      if (!list) return;
      list.innerHTML = "";
      Array.prototype.forEach.call(files, function (f) {
        var li = document.createElement("li");
        li.textContent = f.name;
        list.appendChild(li);
      });
    }
  }
})();
