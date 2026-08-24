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
    var wirePath = null, tipDot = null, tailFar = null, tailNear = null, wireLen = 0, marks = [];

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
        /* ノードは項目全体ではなく写真の真上に置く（項目は全幅の行になったため） */
        var ph = it.querySelector(".powerline__photo") || it;
        var r = ph.getBoundingClientRect();
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

      /* 彗星の尾：電子の後ろに残る2層の光（描画区間はスクロール時に更新） */
      tailFar = mk("path", { d: d, "class": "tail-far", opacity: 0 });
      tailNear = mk("path", { d: d, "class": "tail-near", opacity: 0 });
      plSvg.appendChild(tailFar);
      plSvg.appendChild(tailNear);

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
      var pos = wireLen * p;
      var pt = wirePath.getPointAtLength(pos);
      tipDot.setAttribute("cx", pt.x);
      tipDot.setAttribute("cy", pt.y);
      var vis = p > 0.004 ? 1 : 0;
      tipDot.setAttribute("opacity", vis);
      /* 尾：先端から後ろへ、長い淡い光(110px)と短い強い光(38px) */
      var setTail = function (el, len) {
        var eff = Math.min(len, pos);
        el.style.strokeDasharray = eff + " " + (wireLen + 200);
        el.style.strokeDashoffset = eff - pos;
        el.setAttribute("opacity", vis);
      };
      setTail(tailFar, 110);
      setTail(tailNear, 38);
      marks.forEach(function (m, k) {
        if (p >= m.frac && !plItems[k].classList.contains("is-on")) {
          plItems[k].classList.add("is-on");
          m.el.classList.add("is-lit");
          typeLabel(plItems[k]);
        }
      });
    };

    /* タイプライター：ELECTRICAL などの英字を1文字ずつ打つ。
       幅は最初に測って固定し、隣の工事名がガタつかないようにする */
    var typeLabel = function (item) {
      if (reducedPl()) return;
      var el = item.querySelector(".powerline__label");
      if (!el || el.dataset.typed) return;
      el.dataset.typed = "1";
      var text = el.textContent;
      el.style.minWidth = el.offsetWidth + "px";
      setTimeout(function () {
        el.textContent = "";
        var i = 0;
        var timer = setInterval(function () {
          i++;
          el.textContent = text.slice(0, i);
          if (i >= text.length) clearInterval(timer);
        }, 45);
      }, 420);
    };

    if (reducedPl()) {
      buildWire();
      wirePath.style.strokeDashoffset = 0;
      tipDot.setAttribute("opacity", 0);
      tailFar.setAttribute("opacity", 0);
      tailNear.setAttribute("opacity", 0);
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

  /* ---------- 電球のエッジをなぞる光（選ばれる理由） ----------
     denkyuu1 の実写を左に置き、その輪郭そのものをスクロールに合わせて
     吊りコード→口金→ガラスの左右→底のチップ、の順に光がなぞる */
  var bulbFig = document.querySelector(".bulbfig");
  var bulbSec = document.querySelector(".insight");
  if (bulbFig && bulbSec) {
  var BULB_W = 1024, BULB_H = 1536;
  var BULB_LEFT = "M483 0L483 6L483 12L483 18L483 24L483 30L483 36L483 42L483 48L479 53L473 56L467 59L463 64L462 70L463 76L462 82L462 88L462 94L462 100L462 106L462 112L460 118L455 122L449 124L443 127L437 131L432 137L426 140L420 142L414 144L408 146L402 149L396 153L390 156L384 161L378 167L374 173L371 179L369 185L367 191L366 197L366 203L366 209L366 215L366 221L366 227L366 233L365 239L365 245L365 251L363 257L362 263L362 269L362 275L362 281L361 287L361 293L361 299L361 305L362 311L364 317L365 323L365 329L365 335L365 341L365 347L364 353L364 359L364 365L364 371L364 377L364 383L364 389L364 395L364 401L364 407L364 413L364 419L364 425L364 431L364 437L363 443L364 449L363 455L366 461L371 466L375 472L374 478L370 484L366 490L362 496L359 502L356 508L354 514L352 520L351 526L350 532L349 538L349 544L348 550L348 556L347 562L346 568L346 574L345 580L344 586L343 592L342 598L341 604L339 610L337 616L336 622L333 628L331 634L328 640L325 646L322 652L319 658L315 664L311 670L307 676L302 682L297 688L292 694L287 700L281 706L275 712L270 718L264 723L258 729L253 735L247 740L241 746L236 752L230 758L225 764L219 770L214 776L209 782L204 788L199 794L195 800L190 806L186 812L182 818L178 824L174 830L171 836L167 842L164 848L160 854L158 860L155 866L152 872L149 878L146 884L144 890L142 896L140 902L138 908L136 914L134 920L132 926L131 932L129 938L128 944L127 950L126 956L124 962L124 968L123 974L122 980L121 986L121 992L120 998L120 1004L120 1010L119 1016L119 1022L119 1028L119 1034L119 1040L120 1046L120 1052L120 1058L121 1064L122 1070L122 1076L123 1082L124 1088L125 1094L126 1100L127 1106L129 1112L130 1118L132 1124L133 1130L135 1136L137 1142L139 1148L141 1154L143 1160L145 1166L148 1172L150 1178L153 1184L156 1190L159 1196L162 1202L165 1208L169 1214L172 1220L176 1226L180 1232L184 1238L189 1244L193 1250L198 1256L203 1262L208 1268L213 1274L219 1280L224 1286L230 1292L236 1297L242 1302L248 1307L254 1312L260 1317L266 1322L272 1326L278 1331L284 1335L290 1339L296 1343L302 1346L308 1350L314 1353L320 1357L326 1360L332 1363L338 1366L344 1368L350 1371L356 1374L362 1376L368 1378L374 1381L380 1383L386 1385L392 1387L398 1389L404 1391L410 1392L416 1394L422 1395L428 1397L434 1398L440 1399L446 1400L452 1402L458 1404L464 1407L470 1412L476 1418L481 1424L485 1430L491 1435L497 1440L503 1442L505 1443";
  var BULB_RIGHT = "M483 0L489 0L495 0L501 0L507 0L513 0L519 0L525 0L531 0L537 0L540 3L540 9L540 15L540 21L540 27L540 33L540 39L540 45L542 51L548 54L554 57L559 61L561 67L561 73L561 79L561 85L562 91L562 97L562 103L562 109L563 115L567 120L573 122L579 125L585 128L590 133L595 138L601 141L607 143L613 145L619 147L625 150L631 154L637 158L643 163L648 169L652 175L655 181L657 187L659 193L659 199L659 205L660 211L660 217L660 223L660 229L660 235L660 241L660 247L661 253L663 259L663 265L663 271L663 277L663 283L663 289L663 295L663 301L663 307L662 313L660 319L660 325L660 331L660 337L660 343L660 349L660 355L660 361L661 367L661 373L661 379L661 385L661 391L661 397L661 403L661 409L661 415L661 421L661 427L661 433L661 439L661 445L661 451L660 457L656 463L650 468L649 474L651 480L656 486L660 492L664 498L667 504L669 510L672 516L673 522L674 528L675 534L675 540L676 546L676 552L677 558L677 564L678 570L679 576L680 582L681 588L682 594L683 600L684 606L686 612L688 618L690 624L692 630L695 636L698 642L701 648L704 654L707 660L711 666L715 672L719 678L724 684L729 690L734 696L739 702L745 708L750 714L756 720L762 726L768 732L774 738L780 744L785 750L791 756L797 762L802 768L807 774L812 780L817 786L821 792L826 798L831 804L835 810L839 816L843 822L847 828L850 834L854 840L857 846L860 852L863 858L866 864L869 870L871 876L874 882L876 888L878 894L881 900L882 906L884 912L886 918L888 924L890 930L891 936L893 942L894 948L895 954L896 960L897 966L898 972L899 978L900 984L900 990L901 996L901 1002L902 1008L902 1014L902 1020L902 1026L902 1032L902 1038L902 1044L901 1050L901 1056L900 1062L899 1068L899 1074L898 1080L897 1086L896 1092L895 1098L893 1104L892 1110L890 1116L889 1122L887 1128L885 1134L883 1140L881 1146L879 1152L877 1158L874 1164L872 1170L869 1176L866 1182L863 1188L861 1194L857 1200L854 1206L850 1212L847 1218L843 1224L839 1230L835 1236L831 1242L826 1248L821 1254L817 1260L812 1266L807 1272L801 1278L796 1284L790 1289L784 1295L778 1301L772 1306L766 1311L760 1316L754 1321L748 1326L742 1330L736 1334L730 1338L724 1342L718 1346L712 1349L706 1353L700 1356L694 1359L688 1362L682 1365L676 1368L670 1371L664 1373L658 1376L652 1378L646 1380L640 1383L634 1385L628 1387L622 1389L616 1391L610 1392L604 1394L598 1395L592 1397L586 1398L580 1399L574 1401L568 1402L562 1404L556 1408L550 1413L545 1419L540 1425L535 1431L529 1437L523 1440L517 1442L511 1443L505 1443";
    var BNS = "http://www.w3.org/2000/svg";
    var bsvg = document.createElementNS(BNS, "svg");
    bsvg.setAttribute("class", "bulbfig__line");
    bsvg.setAttribute("viewBox", "0 0 " + BULB_W + " " + BULB_H);
    bsvg.setAttribute("aria-hidden", "true");
    /* vector-effect: non-scaling-stroke は使わない。
       Safari は破線をスクリーン座標で解釈し、Chrome とズレて
       「なぞられずに突然全部つく」壊れ方をするため。
       線の太さは表示倍率から逆算して SVG 座標系で指定する */
    var bmk = function (cls, d) {
      var pth = document.createElementNS(BNS, "path");
      pth.setAttribute("class", cls);
      pth.setAttribute("d", d);
      bsvg.appendChild(pth);
      return pth;
    };
    var bGlowL = bmk("bulbfig__glow", BULB_LEFT);
    var bGlowR = bmk("bulbfig__glow", BULB_RIGHT);
    var bLitL = bmk("bulbfig__lit", BULB_LEFT);
    var bLitR = bmk("bulbfig__lit", BULB_RIGHT);
    var bHeadL = bmk("bulbfig__head", BULB_LEFT);
    var bHeadR = bmk("bulbfig__head", BULB_RIGHT);
    bulbFig.appendChild(bsvg);

    var bLenL = bLitL.getTotalLength();
    var bLenR = bLitR.getTotalLength();
    bLitL.style.strokeDasharray = bLenL + " " + bLenL;
    bLitR.style.strokeDasharray = bLenR + " " + bLenR;
    bGlowL.style.strokeDasharray = bLenL + " " + bLenL;
    bGlowR.style.strokeDasharray = bLenR + " " + bLenR;

    var bulbStroke = function () {
      var wpx = bulbFig.getBoundingClientRect().width;
      if (!wpx) return;
      var k = BULB_W / wpx;   /* 画面1pxぶんのSVG座標 */
      bGlowL.style.strokeWidth = bGlowR.style.strokeWidth = 8 * k;
      bLitL.style.strokeWidth = bLitR.style.strokeWidth = 1.7 * k;
      bHeadL.style.strokeWidth = bHeadR.style.strokeWidth = 2.8 * k;
    };
    bulbStroke();
    var bRs = null;
    window.addEventListener("resize", function () {
      clearTimeout(bRs);
      bRs = setTimeout(bulbStroke, 150);
    });

    var bulbDraw = function () {
      /* 電球そのものが画面に入ってから、上へ抜けるまでの間で進める。
         セクション基準にすると、電球が見える前になぞり終わってしまう */
      var rect = bulbFig.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh - rect.top) / (vh * 0.72 + rect.height * 0.5);
      p = Math.max(0, Math.min(1, p));
      var setSide = function (lit, glow, head, L) {
        var pos = L * p;
        lit.style.strokeDashoffset = L - pos;
        glow.style.strokeDashoffset = L - pos;
        var eff = Math.min(46, pos);
        head.style.strokeDasharray = eff + " " + (L + 999);
        head.style.strokeDashoffset = eff - pos;
        head.style.opacity = (p > 0.005 && p < 0.995) ? 1 : 0;
      };
      setSide(bLitL, bGlowL, bHeadL, bLenL);
      setSide(bLitR, bGlowR, bHeadR, bLenR);
      /* なぞり終えたら点灯。少し戻ったら消す（境目でチラつかないよう幅を持たせる） */
      if (p >= 0.995) bulbFig.classList.add("is-on");
      else if (p < 0.9) bulbFig.classList.remove("is-on");
    };

    if (reducedPl()) {
      /* 動きを減らす設定では、なぞり終えた状態で静かに置く */
      bLitL.style.strokeDashoffset = 0;
      bLitR.style.strokeDashoffset = 0;
      bGlowL.style.strokeDashoffset = 0;
      bGlowR.style.strokeDashoffset = 0;
      bulbFig.classList.add("is-on");
    } else {
      bulbDraw();
      var bTick = false;
      window.addEventListener("scroll", function () {
        if (bTick) return;
        bTick = true;
        requestAnimationFrame(function () { bTick = false; bulbDraw(); });
      }, { passive: true });
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
