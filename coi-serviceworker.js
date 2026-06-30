/*! coi-serviceworker v0.1.7 - register coep/coop headers in github pages */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    (() => {
        // Register the service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register(window.document.currentScript.src)
                .then((registration) => {
                    console.log("COI Service Worker registered with scope: ", registration.scope);
                    
                    // Listen for updates and reload to enforce headers immediately
                    registration.addEventListener("updatefound", () => {
                        const installingWorker = registration.installing;
                        installingWorker.addEventListener("statechange", () => {
                            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                                console.log("New COI service worker installed; reloading...");
                                window.location.reload();
                            }
                        });
                    });
                    
                    // Enforce immediate reload if newly activated to prevent CPU fallback
                    if (registration.active && !navigator.serviceWorker.controller) {
                        console.log("COI Service worker active but not controlling; reloading...");
                        window.location.reload();
                    }
                })
                .catch((err) => {
                    console.error("COI Service Worker registration failed: ", err);
                });
        }
    })();
}
