const MENU_FILES = {
  en: "./src/data/menu.en.json",
  ar: "./src/data/menu.ar.json",
};

const UI_COPY = {
  en: {
    menu: "Menu",
    eyebrow: "Good food. Good mood.",
    heroLineOne: "Big bites.",
    heroLineTwo: "Better vibes.",
    heroCopy:
      "Burgers, wraps, crispy favorites and comfort food made for every craving.",
    explore: "Explore the menu",
    fresh: "Made fresh. Served happy.",
    ourMenu: "Our menu",
    menuCopy: "Pick a category or scroll through all of our favorites.",
    loading: "Preparing the menu…",
    footer: "Good food. Good mood.",
    backToTop: "Back to top",
    switchLabel: "Switch to Arabic",
    error:
      "We couldn't load the menu. Please open the website through a local or hosted web server.",
  },
  ar: {
    menu: "المنيو",
    eyebrow: "أكل طيب. مزاج أطيب.",
    heroLineOne: "لقم كبيرة.",
    heroLineTwo: "وجوّ أحلى.",
    heroCopy: "برغر، راب، مقرمشات وأكلات بتلبّي كل نفسية.",
    explore: "تصفّح المنيو",
    fresh: "طازة دايماً. وبكل حب.",
    ourMenu: "منيو شميْسم",
    menuCopy: "اختار القسم أو تصفّح كل أكلاتنا.",
    loading: "عم نجهّز المنيو…",
    footer: "أكل طيب. مزاج أطيب.",
    backToTop: "العودة للأعلى",
    switchLabel: "Switch to English",
    error:
      "ما قدرنا نحمّل المنيو. افتح الموقع من خلال خادم ويب محلي أو مستضاف.",
  },
};

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
const savedLanguage = localStorage.getItem("chmaysem-language");

const state = {
  language: ["en", "ar"].includes(requestedLanguage)
    ? requestedLanguage
    : ["en", "ar"].includes(savedLanguage)
      ? savedLanguage
      : "en",
  menus: {},
  observer: null,
};

const menuContent = document.querySelector("#menu-content");
const categoryNav = document.querySelector("#category-nav");
const languageSwitcher = document.querySelector(".language-switcher");

function setDocumentLanguage(language) {
  const isArabic = language === "ar";
  document.documentElement.lang = language;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.body.dir = isArabic ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (UI_COPY[language][key]) {
      element.textContent = UI_COPY[language][key];
    }
  });

  document.querySelectorAll("[data-language-label]").forEach((element) => {
    element.classList.toggle("active", element.dataset.languageLabel === language);
  });

  languageSwitcher.setAttribute("aria-label", UI_COPY[language].switchLabel);
  document.title = isArabic
    ? "شميْسم بايتس آند فايبز | المنيو"
    : "Chmaysem Bites & Vibes | Menu";
}

function formatSectionNumber(index) {
  return String(index + 1).padStart(2, "0");
}

function createMenuItem(item) {
  const article = document.createElement("article");
  article.className = "menu-item";

  const info = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = item.name;
  info.appendChild(title);

  if (item.description) {
    const description = document.createElement("p");
    description.className = "menu-description";
    description.textContent = item.description;
    info.appendChild(description);
  }

  const price = document.createElement("p");
  price.className = "menu-price";
  price.textContent = item.price;

  article.append(info, price);
  return article;
}

function createSection(section, index) {
  const sectionElement = document.createElement("section");
  sectionElement.className = "menu-section";
  sectionElement.id = section.id;
  sectionElement.dataset.sectionId = section.id;

  const heading = document.createElement("div");
  heading.className = "menu-section-heading";

  const number = document.createElement("span");
  number.className = "section-number";
  number.textContent = formatSectionNumber(index);

  const title = document.createElement("h3");
  title.textContent = section.title;

  const line = document.createElement("span");
  line.className = "heading-line";
  line.setAttribute("aria-hidden", "true");

  heading.append(number, title, line);

  const grid = document.createElement("div");
  grid.className = "menu-grid";
  section.items.forEach((item) => grid.appendChild(createMenuItem(item)));

  sectionElement.append(heading, grid);

  if (section.note) {
    const note = document.createElement("aside");
    note.className = "section-note";

    const icon = document.createElement("span");
    icon.className = "note-icon";
    icon.textContent = "+";
    icon.setAttribute("aria-hidden", "true");

    const noteText = document.createElement("div");
    const noteTitle = document.createElement("strong");
    noteTitle.textContent = section.note.title;
    const noteBody = document.createElement("p");
    noteBody.textContent = section.note.text;

    noteText.append(noteTitle, noteBody);
    note.append(icon, noteText);
    sectionElement.appendChild(note);
  }

  return sectionElement;
}

function createNavigation(sections) {
  categoryNav.replaceChildren();

  sections.forEach((section, index) => {
    const link = document.createElement("a");
    link.className = "category-link";
    if (index === 0) link.classList.add("active");
    link.href = `#${section.id}`;
    link.dataset.target = section.id;
    link.textContent = section.title;
    categoryNav.appendChild(link);
  });
}

function watchSections() {
  state.observer?.disconnect();

  state.observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      document.querySelectorAll(".category-link").forEach((link) => {
        const isActive = link.dataset.target === visible.target.dataset.sectionId;
        link.classList.toggle("active", isActive);
      });
    },
    { rootMargin: "-25% 0px -62% 0px", threshold: [0, 0.1] },
  );

  document
    .querySelectorAll(".menu-section")
    .forEach((section) => state.observer.observe(section));
}

function renderMenu(menu) {
  const fragment = document.createDocumentFragment();
  menu.sections.forEach((section, index) => {
    fragment.appendChild(createSection(section, index));
  });

  menuContent.replaceChildren(fragment);
  createNavigation(menu.sections);
  watchSections();

  if (window.location.hash) {
    requestAnimationFrame(() => {
      document
        .querySelector(window.location.hash)
        ?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
}

async function loadMenu(language) {
  if (!state.menus[language]) {
    const response = await fetch(MENU_FILES[language]);
    if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
    state.menus[language] = await response.json();
  }
  return state.menus[language];
}

async function applyLanguage(language) {
  state.language = language;
  localStorage.setItem("chmaysem-language", language);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState({}, "", url);
  setDocumentLanguage(language);

  try {
    const menu = await loadMenu(language);
    renderMenu(menu);
  } catch (error) {
    console.error(error);
    menuContent.innerHTML = `<div class="error-state"><p>${UI_COPY[language].error}</p></div>`;
    categoryNav.replaceChildren();
  }
}

languageSwitcher.addEventListener("click", () => {
  applyLanguage(state.language === "en" ? "ar" : "en");
});

applyLanguage(state.language);
