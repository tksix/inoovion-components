// Helper: Check Klaro consent for calcom
function hasCalcomConsent() {
  try {
    return klaro?.getManager().getConsent("calcom") === true;
  } catch (e) {
    console.warn("Klaro check failed:", e);
    return false;
  }
}

// Helper: Grant consent + apply it
function grantCalcomConsent(callback) {
  try {
    const manager = klaro.getManager();
    manager.updateConsent("calcom", true);
    manager.saveAndApplyConsents();
    if (callback) callback();
  } catch (e) {
    console.error("Klaro grant failed:", e);
  }
}

// Load Cal.com script and initialize
function loadCalEmbed(callback) {
  (function (window, scriptUrl, initMethod) {
    const documentRef = window.document;

    function queueCall(api, args) {
      api.q.push(args);
    }

    window.Cal =
      window.Cal ||
      function () {
        const cal = window.Cal;
        const args = arguments;

        // Load script only once
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          const script = documentRef.createElement("script");
          script.src = scriptUrl;
          script.async = true;
          documentRef.head.appendChild(script);
          cal.loaded = true;
        }

        if (args[0] === initMethod) {
          const namespace = args[1];
          const api = function () {
            queueCall(api, arguments);
          };
          api.q = api.q || [];

          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            queueCall(cal.ns[namespace], args);
            queueCall(cal, ["initNamespace", namespace]);
          } else {
            queueCall(cal, args);
          }
          return;
        }

        queueCall(cal, args);
      };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  // Init Cal embed and UI customization
  Cal("init", "kostenlose-beratung-selbstverwalter", {
    origin: "https://app.cal.com",
  });

  Cal.ns["kostenlose-beratung-selbstverwalter"]("ui", {
    cssVarsPerTheme: {
      light: { "cal-brand": "#171717" },
      dark: { "cal-brand": "#6366F1" },
    },
    hideEventTypeDetails: false,
    layout: "column_view",
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("support-button");
  const text = document.getElementById("support-text");
  const consentPrompt = document.getElementById("calcom-consent-prompt");
  const acceptBtn = document.getElementById("enable-calcom");

  if (!btn || !acceptBtn || !consentPrompt) return;

  btn.addEventListener("click", (e) => {
    if (!hasCalcomConsent()) {
      e.preventDefault();
      e.stopPropagation();
      consentPrompt.style.display = "block";
    } else {
      loadCalEmbed(); // Load script if not already
    }
  });

  acceptBtn.addEventListener("click", () => {
    grantCalcomConsent(() => {
      consentPrompt.style.display = "none";
      loadCalEmbed(() => {
        // Auto trigger button again after loading
        btn.click();
      });
    });
  });

  if (window.innerWidth < 768) {
    setTimeout(() => {
      text.style.opacity = "0";

      text.addEventListener(
        "transitionend",
        () => {
          text.style.display = "none";
          requestAnimationFrame(() => btn.classList.add("circle"));
        },
        { once: true }
      );
    }, 3000);
  }
});
