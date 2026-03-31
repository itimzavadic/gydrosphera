(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var burger = document.getElementById("burger");
  var drawer = document.getElementById("drawer");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateHeaderFromScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) {
      header.classList.toggle("is-scrolled", y > 6);
    }
  }

  function onScroll() {
    updateHeaderFromScroll();
    updateStatsProgress();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Drawer */
  var backdrop = document.createElement("div");
  backdrop.className = "drawer-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  document.body.appendChild(backdrop);

  function setDrawer(open) {
    if (!drawer || !burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    backdrop.classList.toggle("is-visible", open);
    drawer.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = !drawer.classList.contains("is-open");
      setDrawer(open);
    });
    backdrop.addEventListener("click", function () {
      setDrawer(false);
    });
  }

  document.querySelectorAll("[data-nav-anchor]").forEach(function (link) {
    link.addEventListener("click", function () {
      setDrawer(false);
    });
  });

  /* Stats: progress 0→1 based on section center vs viewport center */
  var statsSection = document.querySelector("[data-stats-section]");
  var statNums = statsSection ? statsSection.querySelectorAll(".stat-num") : [];

  function updateStatsProgress() {
    if (!statsSection || !statNums.length) return;
    var rect = statsSection.getBoundingClientRect();
    var vh = window.innerHeight;
    var viewCenter = vh * 0.5;
    var elCenter = rect.top + rect.height * 0.5;

    var progress;
    if (elCenter > vh) {
      progress = 0;
    } else if (elCenter <= viewCenter) {
      progress = 1;
    } else {
      progress = (vh - elCenter) / (vh - viewCenter);
      progress = Math.max(0, Math.min(1, progress));
    }

    statNums.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-target"), 10);
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (isNaN(target)) return;
      var val = target * progress;
      if (decimals === 0) {
        el.textContent = String(Math.round(val));
      } else {
        el.textContent = val.toFixed(decimals);
      }
    });
  }

  updateStatsProgress();

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxClose = document.getElementById("lightbox-close");

  function openLightboxFromButton(btn) {
    var src = btn.getAttribute("data-full");
    var alt = btn.getAttribute("data-alt") || "";
    if (!src || !lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  document.querySelectorAll(".gallery-thumb, .blago-gallery__zoom").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openLightboxFromButton(btn);
    });
  });

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    if (!drawer || !drawer.classList.contains("is-open")) {
      document.body.style.overflow = "";
    }
    if (lightboxImg) {
      lightboxImg.src = "";
      lightboxImg.alt = "";
    }
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLightbox();
      setDrawer(false);
    }
  });

  var galleryRail = document.getElementById("gallery-rail");
  if (galleryRail) {
    galleryRail.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var step = Math.min(420, galleryRail.clientWidth * 0.82);
      galleryRail.scrollBy({
        left: e.key === "ArrowRight" ? step : -step,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  /* Карусель в блоке «Благоустройство» */
  (function initBlagoServiceGallery() {
    var root = document.querySelector("[data-blago-gallery]");
    if (!root) return;
    var viewport = root.querySelector(".blago-gallery__viewport");
    var track = root.querySelector(".blago-gallery__track");
    var dotsWrap = root.querySelector(".blago-gallery__dots");
    var btnPrev = root.querySelector(".blago-gallery__arrow--prev");
    var btnNext = root.querySelector(".blago-gallery__arrow--next");
    if (!viewport || !track || !dotsWrap) return;

    var slides = track.querySelectorAll(".blago-gallery__slide");
    var n = slides.length;
    if (!n) return;

    var dots = [];
    for (var i = 0; i < n; i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "blago-gallery__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Слайд " + (i + 1));
      dot.setAttribute("data-slide-index", String(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }

    function slideWidth() {
      return viewport.clientWidth || 1;
    }

    function currentIndex() {
      return Math.round(viewport.scrollLeft / slideWidth());
    }

    function updateDots(activeIdx) {
      dots.forEach(function (d, j) {
        d.classList.toggle("is-active", j === activeIdx);
        d.setAttribute("aria-current", j === activeIdx ? "true" : "false");
      });
    }

    function goToSlide(index) {
      var clamped = Math.max(0, Math.min(n - 1, index));
      var w = slideWidth();
      viewport.scrollTo({
        left: clamped * w,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      updateDots(clamped);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var idx = parseInt(dot.getAttribute("data-slide-index"), 10);
        if (!isNaN(idx)) goToSlide(idx);
      });
    });

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        goToSlide(currentIndex() - 1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        goToSlide(currentIndex() + 1);
      });
    }

    var scrollTimer;
    viewport.addEventListener(
      "scroll",
      function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          updateDots(currentIndex());
        }, 60);
      },
      { passive: true }
    );

    viewport.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (e.key === "ArrowLeft") goToSlide(currentIndex() - 1);
      else goToSlide(currentIndex() + 1);
    });

    window.addEventListener("resize", function () {
      var idx = currentIndex();
      viewport.scrollLeft = idx * slideWidth();
    });
  })();
})();
