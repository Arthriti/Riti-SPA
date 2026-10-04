(function () {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.getElementById("primary-menu");
  const desktopBreakpoint = 896;

  function setMenu(open, restoreFocus) {
    if (!menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open && window.innerWidth < desktopBreakpoint);
    if (!open && restoreFocus) menuButton.focus();
  }

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true", false);
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false, false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenu(false, true);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= desktopBreakpoint) setMenu(false, false);
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  const main = document.getElementById("main-content");
  const lifeChapter = document.querySelector('[data-scroll-chapter="life"]');
  const reserveChapter = document.querySelector('[data-scroll-chapter="reserve"]');
  const audienceChapter = document.querySelector('[data-scroll-chapter="audience"]');
  const householdStory = document.querySelector("[data-audience-story]");
  const lifeChoices = Array.from(document.querySelectorAll("[data-life-choice]"));
  const reserveChoices = Array.from(document.querySelectorAll("[data-reserve-choice]"));
  const audienceChoices = Array.from(document.querySelectorAll("[data-audience-choice]"));
  const lifeCopy = document.getElementById("life-story-copy");
  const reserveCopy = document.getElementById("reserve-story-copy");
  const audienceCopy = document.getElementById("audience-story-copy");

  const stories = {
    life: {
      income: "See how extra income can strengthen breathing room, bring a goal closer, or support life today.",
      work: "A job change can reshape the household plan. See what needs attention before uncertainty becomes pressure.",
      family: "When family needs change, bring today’s responsibilities and tomorrow’s hopes into the same conversation.",
      expense: "An unexpected cost should reveal a choice, not create a private crisis for the person who earns."
    },
    reserve: {
      hidden: "The numbers are in different places. Before deciding what to do, the household has to work out what is true.",
      visible: "The expense has not disappeared. But a shared picture helps you see what is available, understand the tradeoff, and discuss the next step."
    },
    audience: {
      stability: "Build the habit of seeing clearly, keeping a buffer, and taking the next steady step.",
      together: "Turn separate assumptions into shared priorities for the life you are building.",
      decisions: "Use one connected view as the household’s boardroom for decisions with wider consequences."
    }
  };

  const manualScroll = {};
  let scrollFrame = 0;
  const lifeScenes = {
    income: ["01 / 04", "Income changes", "A little more breathing room", "Decide together where extra income will help most."],
    work: ["02 / 04", "Work changes", "Protect the essentials first", "A new role or a gap between jobs can change what feels comfortable."],
    family: ["03 / 04", "Family changes", "Make room for a new responsibility", "Bring family needs into the plan before making the next commitment."],
    expense: ["04 / 04", "An unexpected cost", "See what can cover the surprise", "Discuss what can be used now and which plans may need to wait."]
  };
  const audienceScenes = {
    stability: ["01 / 03", "Finding your footing", "Build a buffer. Find your next steady step."],
    together: ["02 / 03", "Building together", "Connect everyday needs with the future you want."],
    decisions: ["03 / 03", "Managing bigger decisions", "See the connections before making a bigger commitment."]
  };
  function writeScene(ids, values) {
    ids.forEach(function (id, index) {
      const node = document.getElementById(id);
      if (node) node.textContent = values[index];
    });
  }
  function animateScene(selector) {
    const scene = document.querySelector(selector);
    if (!scene) return;
    scene.classList.remove("is-changing");
    void scene.offsetWidth;
    scene.classList.add("is-changing");
  }
  function canFollowScroll(name) {
    if (manualScroll[name] === undefined) return true;
    if (Math.abs(window.scrollY - manualScroll[name]) < 90) return false;
    delete manualScroll[name];
    return true;
  }

  function setPressed(controls, activeValue, attribute) {
    controls.forEach(function (control) {
      control.setAttribute("aria-pressed", String(control.getAttribute(attribute) === activeValue));
    });
  }

  function setLifeStory(value, announce) {
    if (!main || !stories.life[value]) return;
    if (main.dataset.lifeStory === value) return;
    main.dataset.lifeStory = value;
    setPressed(lifeChoices, value, "data-life-choice");
    if (lifeCopy) {
      lifeCopy.setAttribute("aria-live", announce ? "polite" : "off");
      lifeCopy.textContent = stories.life[value];
    }
    writeScene(["life-scene-count", "life-scene-title", "life-impact-title", "life-impact-detail"], lifeScenes[value]);
    animateScene(".life-sequence");
  }

  function setReserveStory(value, announce) {
    if (!main || !stories.reserve[value]) return;
    if (main.dataset.reserveStory === value) return;
    main.dataset.reserveStory = value;
    setPressed(reserveChoices, value, "data-reserve-choice");
    if (reserveCopy) {
      reserveCopy.setAttribute("aria-live", announce ? "polite" : "off");
      reserveCopy.textContent = stories.reserve[value];
    }
    writeScene(["reserve-scene-count", "reserve-scene-title"], value === "visible" ? ["02 / 02", "One shared picture. A clearer next step."] : ["01 / 02", "Scattered pieces. Unanswered questions."]);
    document.querySelectorAll(".scattered-piece, .scattered-question").forEach(function (node) { node.setAttribute("aria-hidden", String(value === "visible")); });
    const sharedView = document.querySelector(".shared-reserve-view");
    if (sharedView) sharedView.setAttribute("aria-hidden", String(value !== "visible"));
  }

  function setAudienceStory(value, announce) {
    if (!householdStory || !stories.audience[value]) return;
    const changed = householdStory.dataset.audienceStory !== value;
    householdStory.dataset.audienceStory = value;
    setPressed(audienceChoices, value, "data-audience-choice");
    if (audienceCopy) {
      audienceCopy.setAttribute("aria-live", announce ? "polite" : "off");
      audienceCopy.textContent = stories.audience[value];
    }
    writeScene(["audience-scene-count", "audience-scene-title", "audience-focus"], audienceScenes[value]);
    if (changed) animateScene(".money-table-visual");
  }

  function chapterProgress(chapter) {
    if (!chapter) return 0;
    const bounds = chapter.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (window.getComputedStyle(chapter.querySelector('.motion-frame')).position === 'sticky') {
      const travel = Math.max(chapter.offsetHeight - viewportHeight, viewportHeight * 0.65);
      return Math.max(0, Math.min(1, -bounds.top / travel));
    }

    const isReserve = chapter.dataset.scrollChapter === 'reserve';
    const entryLine = viewportHeight * (isReserve ? 0.7 : 0.08);
    const travel = Math.max(bounds.height * (isReserve ? 0.7 : 0.9), viewportHeight * (isReserve ? 0.45 : 0.65));
    return Math.max(0, Math.min(1, (entryLine - bounds.top) / travel));
  }

  function updateScrollStories() {
    scrollFrame = 0;

    const lifeOrder = ["income", "work", "family", "expense"];
    const lifeIndex = Math.min(lifeOrder.length - 1, Math.floor(chapterProgress(lifeChapter) * lifeOrder.length));
    if (canFollowScroll("life")) setLifeStory(lifeOrder[lifeIndex], false);
    const audienceOrder = ["stability", "together", "decisions"];
    const audienceIndex = Math.min(2, Math.floor(chapterProgress(audienceChapter) * 3));
    if (canFollowScroll("audience")) setAudienceStory(audienceOrder[audienceIndex], false);
    if (canFollowScroll("reserve")) setReserveStory(chapterProgress(reserveChapter) >= 0.5 ? "visible" : "hidden", false);
  }

  function requestScrollUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollStories);
  }

  lifeChoices.forEach(function (choice) {
    choice.addEventListener("click", function () {
      manualScroll.life = window.scrollY;
      setLifeStory(choice.dataset.lifeChoice, true);
    });
  });

  reserveChoices.forEach(function (choice) {
    choice.addEventListener("click", function () {
      manualScroll.reserve = window.scrollY;
      setReserveStory(choice.dataset.reserveChoice, true);
    });
  });

  audienceChoices.forEach(function (choice) {
    choice.addEventListener("click", function () {
      manualScroll.audience = window.scrollY;
      setAudienceStory(choice.dataset.audienceChoice, true);
    });
  });

  if (main) {
    setLifeStory("income", false);
    setReserveStory("hidden", false);
    setAudienceStory("stability", false);
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    requestScrollUpdate();
  }

})();
