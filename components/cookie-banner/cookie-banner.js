/* -------------- Cookie Banner -------------- */
var klaroConfig = {
  version: 1,
  elementID: "cookie-container",
  cookieName: "cookie-consent-v1",
  htmlTexts: true,
  embedded: false,
  storageMethod: "cookie",
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  lang: "de",

  /* Übersetzungen */
  translations: {
    de: {
      consentModal: {
        title: "Datenschutz-Einstellungen",
        description:
          'Mit Klick auf "Einverstanden" erlaubst du uns Cookies zu setzen. ' +
          "So funktioniert die Website besser wir verstehen die Nutzung genauer " +
          "und können unser Marketing gezielter ausrichten. " +
          "Mehr dazu findest du in unseren " +
          '<a href="https://inoovion.com/rechtliches" target="_blank" rel="noopener">Datenschutzinfos</a>.',
      },
      consentNotice: {
        description:
          'Mit Klick auf "Einverstanden" erlaubst du uns Cookies zu setzen. ' +
          "So funktioniert die Website besser wir verstehen die Nutzung genauer " +
          "und können unser Marketing gezielter ausrichten. " +
          "Mehr dazu findest du in unseren " +
          '<a href="/rechtliches" target="_blank" rel="noopener">Datenschutzinfos</a>.',
        learnMore: "Einstellungen",
      },
      purposes: {
        functional: "Funktionale Dienste",
        marketing: "Marketing",
        analytics: "Analyse",
        dataProcessing: "Datenverarbeitung",
      },
      ok: "Einverstanden",
      acceptAll: "Alle akzeptieren",
      decline: "Nur erforderliche",
      save: "Speichern",
    },
  },

  /* Dienste */
  services: [
    /* --- vorhandene --- */
    {
      name: "google-analytics",
      title: "Google Analytics",
      purposes: ["analytics"],
      cookies: [/^_ga/, /^_gid/, /^_gat/],
      required: false,
      default: false,
      onlyOnce: true,
    },
    {
      name: "calcom",
      title: "Cal.com Terminbuchung",
      purposes: ["functional"],
      required: false,
      default: false,
      onlyOnce: true,
    },
    {
      name: "googlemaps",
      title: "Google Maps",
      purposes: ["functional"],
      default: false,
    },
    {
      name: "beehiiv-marketing",
      title: "Beehiiv Marketing-Cookies",
      purposes: ["marketing"],
      default: false,
    },
    {
      name: "beehiiv-dataProcessing",
      title: "Beehiiv Datenverarbeitung",
      purposes: ["dataProcessing"],
      default: false,
    },
  ],

  purposes: ["functional", "marketing", "analytics", "dataProcessing"],
};

/* ---------- Helfer ---------- */
const DAY_MS = 864e5; // 24 Stunden in ms
const BEE_COOKIE = "beehiiv_honey";

// Cookie lesen
function getCookie(name) {
  const m = document.cookie.match("(^|;)\\s*" + name + "=([^;]*)");
  return m ? decodeURIComponent(m[2]) : null;
}

// Cookie schreiben
function setCookie(name, value, days, domain) {
  const expires = new Date(Date.now() + days * DAY_MS).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const dom = domain ? "; Domain=" + domain : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Expires=${expires}; Path=/; SameSite=Lax${dom}${secure}`;
}

// Registrierbare Root-Domain (z. B. inoovion.com)
function getRootDomain() {
  const parts = location.hostname.split(".");
  return parts.slice(-2).join(".");
}

/* ---------- Beehiiv-Sync ---------- */
function buildBeePrefs() {
  const mgr = klaro.getManager(klaroConfig);
  return {
    marketing: mgr.getConsent("beehiiv-marketing"),
    dataProcessing: mgr.getConsent("beehiiv-dataProcessing"),
  };
}

function syncBeehiiv() {
  const prefs = buildBeePrefs();
  const str = JSON.stringify(prefs);

  // aktuelle Sub-Domain
  setCookie(BEE_COOKIE, str, 365);

  // alle Sub-Domains
  setCookie(BEE_COOKIE, str, 365, "." + getRootDomain());
}

/* ---------- Main ---------- */
window.addEventListener("DOMContentLoaded", () => {
  /* Iframe-Lazy-Load (unverändert) */
  document.querySelectorAll("iframe[data-initial-src]").forEach((i) => {
    const src = i.getAttribute("data-initial-src");
    if (!src) return;
    i.setAttribute("data-src", src);
    i.removeAttribute("data-initial-src");
  });

  /* Klaro-Links ohne #href (unverändert) */
  const stripHref = () => {
    document
      .querySelectorAll('.klaro a[href="#"]')
      .forEach((a) => a.removeAttribute("href"));
  };
  stripHref();
  const obsTarget = document.querySelector(".klaro");
  if (obsTarget)
    new MutationObserver(stripHref).observe(obsTarget, {
      childList: true,
      subtree: true,
    });

  /* Beehiiv-Sync initial + bei jedem Speichern */
  if (window.klaro) {
    const mgr = klaro.getManager(klaroConfig);
    mgr.watch({
      update(obj, key) {
        if (key === "consents") syncBeehiiv();
      },
    });
  }

  // direkt beim Laden
  syncBeehiiv();
});
