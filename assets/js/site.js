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

})();
