/* Zainuddin — Interior Design Portfolio
   GSAP + ScrollTrigger + SplitText, Lenis smooth scroll */
(() => {
  // Google Sheet enquiry endpoint — paste your Apps Script Web app URL (ends in /exec).
  // See google-apps-script/Code.gs for setup. Leave "" to fall back to opening the email app.
  const SHEET_ENDPOINT = "";

  const root = document.documentElement;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Without GSAP (offline / CDN blocked) the page stays fully readable.
  if (!hasGSAP) {
    root.classList.add("no-js");
    $(".preloader")?.remove();
    initLightbox(null);
    initModal(null);
    initPlanTabs(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const hasSplit = typeof window.SplitText !== "undefined";
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else (typeof target === "number" ? window.scrollTo({ top: target, behavior: "smooth" }) : target.scrollIntoView({ behavior: "smooth" }));
  };
  const lockScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? "hidden" : ""; };

  /* ---------- Preloader ---------- */
  const heroImg = $(".hero-slide.is-active img");
  const imgReady = new Promise((res) => {
    if (!heroImg || heroImg.complete) return res();
    heroImg.addEventListener("load", res, { once: true });
    heroImg.addEventListener("error", res, { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minTime = new Promise((res) => setTimeout(res, reduceMotion ? 0 : 1500));

  const plName = $(".pl-name");
  if (plName) plName.innerHTML = [...plName.textContent].map((c) => `<span class="char">${c}</span>`).join("");

  const counter = { v: 0 };
  const plTl = gsap.timeline();
  plTl.from(".pl-name .char", { yPercent: 110, opacity: 0, stagger: 0.04, duration: 0.9, ease: "expo.out" }, 0)
      .to(counter, { v: 90, duration: 1.4, ease: "power2.inOut", onUpdate: () => { $(".pl-num").textContent = Math.round(counter.v); $(".pl-bar i").style.width = counter.v + "%"; } }, 0);

  Promise.all([imgReady, fontsReady, minTime]).then(() => {
    gsap.to(counter, {
      v: 100, duration: 0.4, ease: "power1.out",
      onUpdate: () => { $(".pl-num").textContent = Math.round(counter.v); $(".pl-bar i").style.width = counter.v + "%"; },
      onComplete: exitPreloader,
    });
  });

  function exitPreloader() {
    const tl = gsap.timeline({
      onComplete: () => { $(".preloader")?.remove(); lenis?.start(); ScrollTrigger.refresh(); },
    });
    tl.to(".pl-inner", { opacity: 0, y: -40, duration: 0.5, ease: "power2.in" })
      .to(".preloader .pl-panel:not(.second)", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.1")
      .to(".preloader .pl-panel.second", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.82")
      .add(heroIntro(), "-=0.7");
  }

  /* ---------- Hero ---------- */
  gsap.set(".hero-title .hl", { yPercent: 115 });
  gsap.set([".hero-eyebrow", ".hero-fade", ".scroll-cue"], { opacity: 0, y: 24 });
  gsap.set(".site-header", { yPercent: -100 });

  function heroIntro() {
    const tl = gsap.timeline();
    tl.fromTo(".hero-slide.is-active img", { scale: 1.35 }, { scale: 1.08, duration: 2.2, ease: "expo.out" }, 0)
      .to(".hero-title .hl", { yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out" }, 0.15)
      .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.35)
      .to(".hero-fade", { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.6)
      .to(".scroll-cue", { opacity: 1, y: 0, duration: 0.8 }, 0.9)
      .to(".site-header", { yPercent: 0, duration: 1, ease: "expo.out" }, 0.5)
      .add(startSlideshow, 1);
    return tl;
  }

  // Slideshow with clip-path wipe + slow zoom
  const slides = $$(".hero-slide");
  const dots = $$(".hi-dots button");
  let current = 0, slideTimer = null, dotTween = null;
  const SLIDE_DUR = 6;

  function runDot(i) {
    dots.forEach((d, j) => gsap.set(d.querySelector("i"), { scaleX: j < i ? 1 : 0 }));
    dotTween?.kill();
    dotTween = gsap.fromTo(dots[i].querySelector("i"), { scaleX: 0 }, { scaleX: 1, duration: SLIDE_DUR, ease: "none" });
  }
  function goSlide(next) {
    if (next === current) return;
    const prev = slides[current], nxt = slides[next];
    gsap.set(nxt, { opacity: 1, zIndex: 2, clipPath: "inset(0 0 0 100%)" });
    gsap.set(prev, { zIndex: 1 });
    gsap.timeline()
      .to(nxt, { clipPath: "inset(0 0 0 0%)", duration: 1.4, ease: "expo.inOut" }, 0)
      .fromTo(nxt.querySelector("img"), { scale: 1.3, xPercent: 6 }, { scale: 1.08, xPercent: 0, duration: 2.4, ease: "expo.out" }, 0)
      .to(prev.querySelector("img"), { xPercent: -8, duration: 1.4, ease: "expo.inOut" }, 0)
      .add(() => { prev.classList.remove("is-active"); gsap.set(prev, { opacity: 0, zIndex: 0 }); gsap.set(prev.querySelector("img"), { xPercent: 0 }); });
    nxt.classList.add("is-active");
    current = next;
    $(".hi-cur").textContent = String(next + 1).padStart(2, "0");
    const label = $(".hi-label");
    gsap.fromTo(label, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.4, onStart: () => (label.textContent = nxt.dataset.label) });
    runDot(next);
  }
  function startSlideshow() {
    if (slides.length < 2) return;
    runDot(0);
    clearInterval(slideTimer);
    slideTimer = setInterval(() => goSlide((current + 1) % slides.length), SLIDE_DUR * 1000);
  }
  dots.forEach((d, i) => d.addEventListener("click", () => { goSlide(i); startSlideshow(); runDot(i); }));

  const mm = gsap.matchMedia();

  // Pinned hero exit: image frames into a rounded window, copy lifts away
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=90%", scrub: 0.8, pin: true, anticipatePin: 1 },
    });
    tl.to(".hero-content", { yPercent: -18, opacity: 0, ease: "power1.in" }, 0)
      .to(".scroll-cue", { opacity: 0, duration: 0.2 }, 0)
      .to(".hero-media", { clipPath: "inset(7% 5% 7% 5% round 28px)", ease: "none" }, 0)
      .to(".hero", { backgroundColor: "#f0efeb", ease: "none" }, 0);
  });

  /* ---------- Header behaviour + progress ---------- */
  const header = $(".site-header");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle("is-solid", y > window.innerHeight * 0.9);
      header.classList.toggle("is-hidden", self.direction === 1 && y > window.innerHeight * 1.2 && !root.classList.contains("menu-open"));
      gsap.set(".progress", { scaleX: self.progress });
    },
  });

  /* ---------- Anchor scrolling ---------- */
  $$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || !id.startsWith("#")) return;
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (root.classList.contains("menu-open")) toggleMenu(false);
    scrollTo(target);
  }));

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-toggle");
  function toggleMenu(open) {
    root.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      gsap.set(".mobile-menu", { visibility: "visible" });
      gsap.to(".mobile-menu", { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "expo.inOut" });
      gsap.fromTo(".mobile-menu nav a span", { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: 0.9, ease: "expo.out", delay: 0.35 });
      lockScroll(true);
    } else {
      gsap.to(".mobile-menu", { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut", onComplete: () => gsap.set(".mobile-menu", { visibility: "hidden" }) });
      lockScroll(false);
    }
  }
  menuBtn?.addEventListener("click", () => toggleMenu(!root.classList.contains("menu-open")));
  $$(".mobile-menu nav a").forEach((a) => (a.style.overflow = "hidden"));

  /* ---------- Marquee (direction follows scroll) ---------- */
  const mq = gsap.to(".marquee-track", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    trigger: ".marquee", start: "top bottom", end: "bottom top",
    onUpdate: (self) => gsap.to(mq, { timeScale: self.direction * Math.min(4, 1 + Math.abs(self.getVelocity()) / 600), duration: 0.3, overwrite: true, onComplete: () => gsap.to(mq, { timeScale: self.direction, duration: 1 }) }),
  });

  /* ---------- Split-line headings ---------- */
  function initSplits() {
    $$(".split-lines").forEach((el) => {
      if (!hasSplit || reduceMotion) return;
      SplitText.create(el, {
        type: "lines", mask: "lines", autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.2, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
      });
    });
  }

  /* ---------- Word-by-word statement ---------- */
  $$(".word-reveal").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduceMotion) return;
    gsap.to(el.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  });

  /* ---------- Counters ---------- */
  $$(".count").forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.to, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => (el.textContent = String(Math.round(obj.v)).padStart(2, "0")),
    });
  });

  /* ---------- Image reveals (clip + inner scale) ---------- */
  if (!reduceMotion) {
    $$(".reveal-media").forEach((fig) => {
      const inner = fig.querySelector(".media-inner");
      gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 88%", once: true } })
        .fromTo(fig, { clipPath: "inset(18% 0% 0% 0% round 22px)", y: 60 }, { clipPath: "inset(0% 0% 0% 0% round 22px)", y: 0, duration: 1.4, ease: "expo.out" })
        .fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
    });

    $$(".reveal-clip").forEach((el) => {
      gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });

    // Parallax helpers
    $$(".parallax-img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$("[data-speed]").forEach((el) => {
      gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 100, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Full-bleed parallax + title reveal
    $$(".fullbleed").forEach((fb) => {
      gsap.fromTo(fb.querySelector(".fb-img"), { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: fb, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(fb.querySelector(".fb-img img"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: fb, start: "top bottom", end: "center center", scrub: true } });
      gsap.from(fb.querySelectorAll(".fb-text > .fb-row > *"), { y: 60, opacity: 0, stagger: 0.15, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: fb, start: "top 45%", once: true } });
    });

    // Chapter banners: outline number slides, meta fades
    $$(".chapter-banner").forEach((cb) => {
      gsap.from(cb.querySelector(".cb-num"), { xPercent: -30, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: cb, start: "top 80%", once: true } });
      gsap.from(cb.querySelector(".cb-meta"), { y: 40, opacity: 0, duration: 1.2, ease: "expo.out", delay: 0.2, scrollTrigger: { trigger: cb, start: "top 80%", once: true } });
      gsap.to(cb.querySelector(".cb-num"), { xPercent: 12, ease: "none", scrollTrigger: { trigger: cb, start: "top top", end: "bottom top", scrub: true } });
    });

    // Sticky intro copy: stagger children in
    $$(".pi-sticky").forEach((s) => {
      gsap.from(s.querySelectorAll(".eyebrow, .pi-sub, .pi-rule, .pi-desc, .pi-facts, .pi-tags"), { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 80%", once: true } });
    });

    // Plan & mood cards
    $$(".pm-card").forEach((c, i) => {
      gsap.from(c, { y: 80, opacity: 0, duration: 1.2, delay: i % 2 ? 0.12 : 0, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 88%", once: true } });
    });
    $$(".legend").forEach((l) => {
      gsap.from(l.children, { x: -20, opacity: 0, stagger: 0.05, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: l, start: "top 90%", once: true } });
    });

    // Works cards stagger in
    gsap.from(".work-card", { y: 120, opacity: 0, stagger: 0.09, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".works-cards", start: "top 85%", once: true } });

    // Tools & timeline
    gsap.from(".tool", { y: 30, opacity: 0, stagger: 0.05, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".tools", start: "top 85%", once: true } });
    gsap.to(".tl-fill", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: true } });
    gsap.from(".tl-item", { x: 30, opacity: 0, stagger: 0.08, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".timeline", start: "top 80%", once: true } });

    // Contact
    gsap.from(".contact-item", { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".contact-list", start: "top 85%", once: true } });
    gsap.from(".polaroid", { rotate: -14, y: 100, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".contact-grid", start: "top 80%", once: true } });
  }

  /* ---------- Horizontal pinned galleries ---------- */
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    $$(".hgallery").forEach((sec) => {
      const track = sec.querySelector(".hg-track");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.9, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => gsap.set(sec.querySelector(".hg-counter .bar i"), { scaleX: self.progress }),
        },
      });
      // inner image drift, tied to the horizontal movement
      sec.querySelectorAll(".hg-item").forEach((item) => {
        gsap.fromTo(item.querySelector("img"), { xPercent: 6 }, {
          xPercent: -6, ease: "none",
          scrollTrigger: { trigger: item, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
        gsap.from(item, {
          yPercent: 12, rotate: 2, opacity: 0.3, ease: "power2.out",
          scrollTrigger: { trigger: item, containerAnimation: tween, start: "left 95%", end: "left 55%", scrub: true },
        });
      });
    });
  });

  /* ---------- Stacked sticky cards (scale back as next covers) ---------- */
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const stackGroups = [$$(".stack-card"), $$(".p-card")];
    stackGroups.forEach((cards) => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.9, filter: "brightness(0.72)", ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
        });
      });
    });
    $$(".stack-card .sc-text").forEach((t) => {
      gsap.from(t.children, { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: t.closest(".stack-card"), start: "top 60%", once: true } });
    });
  });

  /* ---------- Works accordion (keyboard + touch) ---------- */
  const workCards = $$(".work-card");
  workCards.forEach((c) => {
    const activate = () => workCards.forEach((o) => o.classList.toggle("is-active", o === c));
    c.addEventListener("mouseenter", activate);
    c.addEventListener("focus", activate);
  });

  /* ---------- Custom cursor + magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    const dot = $(".cursor"), ring = $(".cursor-ring");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("pointermove", (e) => { document.body.classList.add("cursor-on"); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener("pointerover", (e) => {
      const view = e.target.closest("[data-cursor='view']");
      const link = !view && e.target.closest("a, button, .tool, .legend li, .swatches span");
      ring.classList.toggle("is-view", !!view);
      ring.classList.toggle("is-link", !!link);
      ring.querySelector("span").textContent = view?.classList.contains("work-card") ? "Open" : "View";
    });

    $$(".magnetic").forEach((btn) => {
      const mx = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener("pointerleave", () => { mx(0); my(0); });
    });

    // Mood board 3D tilt
    $$(".tilt").forEach((el) => {
      const rX = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3" });
      const rY = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3" });
      gsap.set(el, { transformPerspective: 1000 });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        rY(((e.clientX - r.left) / r.width - 0.5) * 12);
        rX(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      el.addEventListener("pointerleave", () => { rX(0); rY(0); });
    });

    // Floor plan magnifier (large source plans only)
    $$(".plan-stage.has-lens").forEach((stage) => {
      const lens = stage.querySelector(".plan-lens");
      const ZOOM = 2.4;
      stage.addEventListener("pointerenter", () => stage.classList.add("lens-on"));
      stage.addEventListener("pointerleave", () => stage.classList.remove("lens-on"));
      stage.addEventListener("pointermove", (e) => {
        const img = stage.querySelector("img.is-active");
        if (!img?.naturalWidth) return;
        const r = stage.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        // rendered image box inside object-fit: contain with 14px padding
        const pad = 14, bw = r.width - pad * 2, bh = r.height - pad * 2;
        const s = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
        const w = img.naturalWidth * s, h = img.naturalHeight * s;
        const ox = pad + (bw - w) / 2, oy = pad + (bh - h) / 2;
        const L = lens.offsetWidth / 2;
        lens.style.left = x - L + "px";
        lens.style.top = y - L + "px";
        lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
        lens.style.backgroundSize = `${w * ZOOM}px ${h * ZOOM}px`;
        lens.style.backgroundPosition = `${-((x - ox) * ZOOM - L)}px ${-((y - oy) * ZOOM - L)}px`;
      });
    });
  }

  initPlanTabs(gsap);
  initLightbox(gsap);
  initModal(gsap);

  /* ---------- Boot ---------- */
  fontsReady.then(initSplits);
  window.addEventListener("load", () => ScrollTrigger.refresh());
  // lazy images can change layout height; refresh once they settle
  let refreshT;
  $$("img[loading='lazy']").forEach((img) => img.addEventListener("load", () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 250); }, { once: true }));

  /* ================= Shared widgets ================= */

  function initPlanTabs(g) {
    $$(".plan-tabs").forEach((tabs) => {
      const stage = tabs.closest(".pm-card").querySelector(".plan-stage");
      const imgs = [...stage.querySelectorAll("img")];
      tabs.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = +btn.dataset.plan;
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b === btn));
        imgs.forEach((im, i) => {
          const on = i === idx;
          im.classList.toggle("is-active", on);
          if (on && g) g.fromTo(im, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", clearProps: "opacity,transform" });
        });
      }));
    });
  }

  function initLightbox(g) {
    const lb = $(".lightbox");
    const lbImg = lb.querySelector(".lb-stage img");
    let group = [], idx = 0, open = false;

    const itemsFor = (name) => $$(`[data-lightbox="${name}"]`).flatMap((el) =>
      el.classList.contains("plan-stage") ? [el.querySelector("img.is-active")] : [el.querySelector("img")]
    ).filter(Boolean);

    function show(i, dir = 0) {
      idx = (i + group.length) % group.length;
      const img = group[idx];
      const fig = img.closest("figure");
      const small = fig?.querySelector("figcaption small")?.textContent || "";
      const title = fig?.querySelector("figcaption span")?.lastChild?.textContent?.trim() || fig?.querySelector("figcaption")?.textContent?.trim() || img.alt;
      const set = () => {
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lb.querySelector(".lb-caption").innerHTML = `<small>${small}</small>${title}`;
        lb.querySelector(".lb-cur").textContent = String(idx + 1).padStart(2, "0");
        lb.querySelector(".lb-total").textContent = String(group.length).padStart(2, "0");
      };
      if (g && dir) {
        g.to(lbImg, { x: -60 * dir, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => { set(); g.fromTo(lbImg, { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "expo.out" }); } });
      } else set();
    }

    function openLb(name, img) {
      group = itemsFor(name);
      if (!group.length) return;
      const start = Math.max(0, group.indexOf(img));
      show(start);
      open = true;
      lockScroll(true);
      if (g) {
        g.set(lb, { visibility: "visible" });
        g.to(lb, { opacity: 1, duration: 0.4 });
        g.fromTo(lbImg, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" });
      } else { lb.style.visibility = "visible"; lb.style.opacity = 1; }
      lb.querySelector(".lb-close").focus();
    }
    function closeLb() {
      if (!open) return;
      open = false;
      lockScroll(false);
      if (g) g.to(lb, { opacity: 0, duration: 0.35, onComplete: () => g.set(lb, { visibility: "hidden" }) });
      else { lb.style.visibility = "hidden"; lb.style.opacity = 0; }
    }

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-lightbox]");
      if (!trigger || e.target.closest(".plan-tabs")) return;
      const img = trigger.classList.contains("plan-stage") ? trigger.querySelector("img.is-active") : trigger.querySelector("img");
      openLb(trigger.dataset.lightbox, img);
    });
    document.addEventListener("keydown", (e) => {
      const trigger = e.target.closest?.("[data-lightbox]");
      if (!open && trigger && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); trigger.click(); return; }
      if (!open) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") show(idx + 1, 1);
      if (e.key === "ArrowLeft") show(idx - 1, -1);
    });
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1, 1));
    lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1, -1));
    lb.querySelector(".lb-stage").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeLb(); });

    // swipe
    let sx = null;
    lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const d = e.changedTouches[0].clientX - sx;
      if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1), d < 0 ? 1 : -1);
      sx = null;
    });
  }

  function initModal(g) {
    const modal = $(".modal");
    const panel = modal.querySelector(".modal-panel");
    let lastFocus = null;
    function openModal() {
      lastFocus = document.activeElement;
      lockScroll(true);
      if (g) {
        g.set(modal, { visibility: "visible" });
        g.to(".modal-backdrop", { opacity: 1, duration: 0.4 });
        g.fromTo(panel, { y: 60, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" });
        g.from(panel.querySelectorAll(".field, .form .btn"), { y: 20, opacity: 0, stagger: 0.05, duration: 0.6, delay: 0.15, ease: "power3.out" });
      } else { modal.style.visibility = "visible"; panel.style.opacity = 1; modal.querySelector(".modal-backdrop").style.opacity = 1; }
      setTimeout(() => $("#f-name").focus(), 100);
    }
    function closeModal() {
      lockScroll(false);
      if (g) {
        g.to(panel, { y: 40, opacity: 0, duration: 0.35, ease: "power2.in" });
        g.to(".modal-backdrop", { opacity: 0, duration: 0.35, onComplete: () => g.set(modal, { visibility: "hidden" }) });
      } else modal.style.visibility = "hidden";
      lastFocus?.focus();
    }
    $$("[data-open-modal]").forEach((b) => b.addEventListener("click", openModal));
    $$("[data-close-modal]").forEach((b) => b.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.style.visibility !== "hidden" && getComputedStyle(modal).visibility === "visible") closeModal(); });

    const form = $("#enquiry-form");
    const formHTML = form.innerHTML;
    // query live nodes: the form markup is swapped for a success message and restored afterwards
    const setStatus = (msg, type = "") => {
      const status = form.querySelector(".form-status");
      if (!status) return;
      status.textContent = msg;
      status.className = "form-status" + (type ? " is-" + type : "");
    };

    function validate() {
      let ok = true;
      form.querySelectorAll("[required]").forEach((el) => {
        const bad = !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        el.closest(".field").classList.toggle("is-invalid", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      return ok;
    }

    function mailtoFallback(f) {
      const subject = `Project enquiry — ${f.get("type")}`;
      const body = `Hi Zainuddin,\n\n${f.get("message")}\n\nProject type: ${f.get("type")}\nName: ${f.get("name")}\nEmail: ${f.get("email")}\nPhone: ${f.get("phone") || "—"}`;
      window.location.href = `mailto:zainudinzainu23@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) { setStatus("Please fill in your name, a valid email and a message.", "error"); return; }
      const f = new FormData(form);

      if (!SHEET_ENDPOINT) { mailtoFallback(f); closeModal(); return; }

      const payload = new URLSearchParams();
      ["name", "email", "phone", "type", "message", "company"].forEach((k) => payload.append(k, (f.get(k) || "").toString()));
      payload.append("source", "Portfolio website");
      payload.append("page", location.href);

      form.querySelector("button[type='submit']").disabled = true;
      setStatus("Sending your enquiry…");
      try {
        // Apps Script web apps don't send CORS headers, so the response is opaque;
        // a resolved request means Google received the submission.
        await fetch(SHEET_ENDPOINT, { method: "POST", mode: "no-cors", body: payload });
        form.innerHTML = `<div class="form-success"><div class="tick"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg></div><b>Thank you, ${escapeHTML(f.get("name").toString().split(" ")[0])}!</b><p class="muted">Your enquiry has been received — I'll be in touch shortly.</p></div>`;
        setTimeout(() => { closeModal(); setTimeout(() => { form.innerHTML = formHTML; }, 600); }, 3200);
      } catch (err) {
        form.querySelector("button[type='submit']").disabled = false;
        setStatus("Couldn't send right now — opening your email app instead.", "error");
        setTimeout(() => mailtoFallback(f), 1200);
      }
    });

    function escapeHTML(s) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  }
})();
