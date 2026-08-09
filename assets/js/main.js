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
