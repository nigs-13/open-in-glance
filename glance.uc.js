// ==UserScript==
// @name           Open in Glance
// @description    Opens all new tabs (target="_blank", ctrl+click, middle click) in Zen Glance instead
// @author         nigs
// @version        1.0
// @include        main
// ==/UserScript==

window.addEventListener("load", () => {
  let linkClicked = false;

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0 || e.button === 1) {
      linkClicked = true;
      setTimeout(() => { linkClicked = false; }, 500);
    }
  }, true);

  const _origAddTab = gBrowser.addTab.bind(gBrowser);
  gBrowser.addTab = function(url, params = {}) {
    const isBlankFromPage = url === "about:blank" && !!params.openerBrowser && !params._forZenEmptyTab;
    const isHttpLink = typeof url === "string" && url.startsWith("http") && !!params.openerBrowser;

    if (window.gZenGlanceManager && (isHttpLink || (isBlankFromPage && linkClicked))) {
      if (isBlankFromPage) {
        const tab = _origAddTab(url, { ...params, inBackground: true });
        const browser = gBrowser.getBrowserForTab(tab);

        const tryOpen = () => {
          const realUrl = browser.currentURI?.spec;
          if (realUrl && realUrl !== "about:blank" && realUrl.startsWith("http")) {
            gBrowser.removeTab(tab, { animate: false });
            const browserRect = window.windowUtils.getBoundsWithoutFlushing(gBrowser.tabbox);
            window.gZenGlanceManager.openGlance({
              url: realUrl,
              clientX: browserRect.width / 2,
              clientY: browserRect.height / 2,
              width: 0,
              height: 0,
              triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
            });
          } else {
            setTimeout(tryOpen, 100);
          }
        };
        setTimeout(tryOpen, 100);
        return tab;
      }

      linkClicked = false;
      const browserRect = window.windowUtils.getBoundsWithoutFlushing(gBrowser.tabbox);
      window.gZenGlanceManager.openGlance({
        url: url,
        clientX: browserRect.width / 2,
        clientY: browserRect.height / 2,
        width: 0,
        height: 0,
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
      return gBrowser.selectedTab;
    }

    return _origAddTab(url, params);
  };
}, { once: true });
