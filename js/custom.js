
   
  /* =========================================================
     PORTFOLIO SCRIPTS — jQuery + GSAP + AOS
     Sections:
     01 Preloader        05 Sticky nav & scrollspy
     02 Custom cursor    06 Smooth scrolling
     03 Typing effect    07 Animated counters
     04 GSAP / AOS       08 Draggable cards
                         09 Contact form validation
                         10 Back to top
  ========================================================== */
  jQuery(function ($) {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 01. PRELOADER ---------- */
    gsap.to("#loaderFill", { width: "100%", duration: 1.1, ease: "power2.inOut" });
    $(window).on("load", function () {
      setTimeout(() => {
        $("#preloader").addClass("hidden");
        AOS.refresh();
      }, reducedMotion ? 0 : 1200);
    });
    // Safety net: never trap the user behind the loader
    setTimeout(() => $("#preloader").addClass("hidden"), 4000);

    /* ---------- 02. CUSTOM CURSOR + MOUSE FOLLOWER ---------- */
    const $dot = $(".cursor-dot"), $ring = $(".cursor-ring");
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    $(document).on("mousemove", function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      gsap.set($dot[0], { x: mouseX, y: mouseY });
    });
    // ring lags behind the dot (mouse-follow effect)
    gsap.ticker.add(() => {
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      gsap.set($ring[0], { x: ringX, y: ringY });
    });
    $(document).on("mouseenter", "a, button, .hoverable", () => $ring.addClass("grow"))
               .on("mouseleave", "a, button, .hoverable", () => $ring.removeClass("grow"));

    /* ---------- 03. TYPING EFFECT ---------- */
    const roles = ["UI Designer", "UI/UX Designer", "Front End Developer", "Product Designer"];
    const $typed = $("#typed");
    let roleIdx = 0, charIdx = 0, deleting = false;

    (function type() {
      const word = roles[roleIdx];
      $typed.text(word.slice(0, charIdx));
      let delay = deleting ? 45 : 95;

      if (!deleting && charIdx === word.length) { deleting = true; delay = 1600; }
      else if (deleting && charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 350; }
      else charIdx += deleting ? -1 : 1;

      setTimeout(type, delay);
    })();

    /* ---------- 04. SCROLL ANIMATIONS (AOS + GSAP) ---------- */
    AOS.init({ duration: 750, once: true, offset: 80, disable: reducedMotion });

    gsap.registerPlugin(ScrollTrigger, Draggable);
    if (!reducedMotion) {
      // timeline items cascade in
      gsap.utils.toArray(".timeline").forEach(tl => {
        gsap.from(tl.querySelectorAll(".t-item"), {
          x: -30, opacity: 0, stagger: .1, duration: .6, ease: "power2.out",
          scrollTrigger: { trigger: tl, start: "top 85%" }
        });
      });
      // portrait ring gentle float
      gsap.to(".portrait-ring", { y: -14, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }

    /* ---------- 05. STICKY NAV + ACTIVE MENU HIGHLIGHT ---------- */
    const $header = $("#siteHeader");
    const $navAnchors = $(".nav-links a");
    const sections = $("main section").toArray();

    function onScroll() {
      $header.toggleClass("scrolled", window.scrollY > 40);
      $("#toTop").toggleClass("show", window.scrollY > 500);

      // scrollspy
      const pos = window.scrollY + 120;
      let currentId = sections[0].id;
      sections.forEach(sec => { if (sec.offsetTop <= pos) currentId = sec.id; });
      $navAnchors.removeClass("active")
                 .filter(`[href="#${currentId}"]`).addClass("active");
    }
    $(window).on("scroll", onScroll);
    onScroll();

    /* mobile menu */
    $("#hamburger").on("click", function () {
      const open = $("#navLinks").toggleClass("open").hasClass("open");
      $(this).attr("aria-expanded", open)
             .find("i").toggleClass("fa-bars", !open).toggleClass("fa-xmark", open);
    });
    $navAnchors.on("click", () => {
      $("#navLinks").removeClass("open");
      $("#hamburger").attr("aria-expanded", false).find("i").addClass("fa-bars").removeClass("fa-xmark");
    });

    /* ---------- 06. SMOOTH SCROLLING (jQuery-animated) ---------- */
    $(document).on("click", 'a[href^="#"]', function (e) {
      const href = this.getAttribute("href");
      if (href === "#") { e.preventDefault(); return; } // placeholder links
      const target = $(href);
      if (!target.length) return;
      e.preventDefault();
      $("html, body").animate(
        { scrollTop: target.offset().top - 70 },
        reducedMotion ? 0 : 650
      );
    });

    /* ---------- 07. ANIMATED COUNTERS ---------- */
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = +el.dataset.target;
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: target, duration: 1.8, ease: "power1.out",
          snap: { innerText: 1 },
          onUpdate() { el.innerText = Math.round(gsap.getProperty(el, "innerText")); }
        });
        counterObserver.unobserve(el);
      });
    }, { threshold: .6 });
    $(".count").each((_, el) => counterObserver.observe(el));

    /* ---------- 08. DRAGGABLE IMAGE CARDS ---------- */
    Draggable.create(".float-chip", {
      type: "x,y",
      bounds: "#home",
      inertia: false,
      onPress()  { gsap.to(this.target, { scale: 1.12, duration: .2 }); },
      onRelease(){ gsap.to(this.target, { scale: 1,    duration: .3, ease: "back.out(2)" }); }
    });

    /* ---------- 09. CONTACT FORM VALIDATION ---------- */
    const validators = {
      fullName: v => v.trim().length >= 3               || "Please enter your full name.",
      email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Please enter a valid email address.",
      phone:    v => v.trim() === "" || /^[+\d\s()\-]{7,18}$/.test(v) || "Please enter a valid phone number.",
      subject:  v => v.trim().length >= 3               || "Please add a short subject.",
      message:  v => v.trim().length >= 10              || "Message should be at least 10 characters."
    };

    function validateField($input) {
      const rule = validators[$input.attr("name")];
      if (!rule) return true;
      const result = rule($input.val());
      const $field = $input.closest(".field");
      const ok = result === true;
      $field.toggleClass("error", !ok).find(".err-msg").text(ok ? "" : result);
      return ok;
    }

    $("#contactForm input, #contactForm textarea").on("blur input", function () {
      if ($(this).closest(".field").hasClass("error")) validateField($(this));
    });

    $("#contactForm").on("submit", function (e) {
      e.preventDefault();
      let allOk = true;
      $(this).find("input, textarea").each(function () {
        if (!validateField($(this))) allOk = false;
      });
      const $status = $("#formStatus");
      if (!allOk) {
        $status.removeClass("ok").addClass("bad").text("Please fix the highlighted fields and try again.");
        return;
      }
      // 🔁 Hook your backend / EmailJS / Formspree endpoint here.
      $status.removeClass("bad").addClass("ok").text("Thanks! Your message has been sent — I'll get back to you soon.");
      this.reset();
    });

    /* ---------- 10. EXPERIENCE ACCORDION ---------- */
    $("#expAccordion").on("click", ".acc-head", function () {
      const $item = $(this).closest(".acc");
      const isOpen = $item.hasClass("open");

      // close any open panel
      $("#expAccordion .acc.open").not($item).removeClass("open")
        .find(".acc-head").attr("aria-expanded", "false")
        .end().find(".acc-body").slideUp(reducedMotion ? 0 : 320);

      // toggle the clicked one
      $item.toggleClass("open", !isOpen);
      $(this).attr("aria-expanded", String(!isOpen));
      $item.find(".acc-body").slideToggle(reducedMotion ? 0 : 320);
    });

    /* ---------- 11. BACK TO TOP ---------- */    $("#toTop").on("click", () =>
      $("html, body").animate({ scrollTop: 0 }, reducedMotion ? 0 : 600)
    );
  });
