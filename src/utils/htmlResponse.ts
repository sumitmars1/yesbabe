const OVERLAY_ID = "html-response-overlay";
const REGION_OVERLAY_ID = "region-restriction-overlay";

let htmlResponseShown = false;
let regionRestrictionShown = false;

const ensureIframe = () => {
  if (typeof document === "undefined") {
    return null;
  }

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "2147483647";
    overlay.style.backgroundColor = "#ffffff";
    overlay.style.overflow = "hidden";

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Access restriction notice");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    overlay.appendChild(iframe);

    const body = document.body || document.querySelector("body");
    if (body) {
      body.appendChild(overlay);
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          document.body?.appendChild(overlay!);
        },
        { once: true }
      );
    }
  }

  const iframe = overlay.querySelector("iframe");
  if (iframe instanceof HTMLIFrameElement) {
    return iframe;
  }
  return null;
};

export const renderHtmlResponseOverlay = (html: string) => {
  if (typeof window === "undefined" || !html) {
    return;
  }

  const iframe = ensureIframe();
  if (!iframe) {
    return;
  }

  const iframeDocument = iframe.contentWindow?.document;
  if (!iframeDocument) {
    return;
  }

  iframeDocument.open();
  iframeDocument.write(html);
  iframeDocument.close();

  htmlResponseShown = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("html-response:shown"));
  }
};

export const hasHtmlResponseOverlay = () => htmlResponseShown;

export const renderRegionRestrictionOverlay = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (regionRestrictionShown) {
    return;
  }

  const existing = document.getElementById(REGION_OVERLAY_ID);
  if (existing) {
    regionRestrictionShown = true;
    return;
  }

  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.backgroundColor = "#ffffff";
  document.body.innerHTML = "";

  const container = document.createElement("div");
  container.id = REGION_OVERLAY_ID;
  container.style.height = "100%";
  container.style.width = "100%";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  const h1 = document.createElement("h1");
  h1.textContent = "This service is not available in your area。";
  h1.style.margin = "0";

  container.appendChild(h1);
  document.body.appendChild(container);

  regionRestrictionShown = true;
  window.dispatchEvent(new CustomEvent("region-restriction:shown"));
};

export const hasRegionRestrictionOverlay = () => regionRestrictionShown;
