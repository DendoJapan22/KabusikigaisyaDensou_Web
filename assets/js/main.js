/* 株式会社電総 コーポレートサイト 共通スクリプト */
(function () {
  "use strict";

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
