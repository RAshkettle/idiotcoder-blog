"use client";

import { useEffect } from "react";

export default function CacheBuster() {
  useEffect(() => {
    // Add timestamp to all dynamic imports
    const timestamp = Date.now();

    // Add version parameter to prevent caching
    const meta = document.createElement("meta");
    meta.httpEquiv = "Cache-Control";
    meta.content = "no-cache, no-store, must-revalidate";
    document.head.appendChild(meta);

    const pragma = document.createElement("meta");
    pragma.httpEquiv = "Pragma";
    pragma.content = "no-cache";
    document.head.appendChild(pragma);

    const expires = document.createElement("meta");
    expires.httpEquiv = "Expires";
    expires.content = "0";
    document.head.appendChild(expires);

    // Force reload stylesheets with version parameter
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach((sheet) => {
      const href = sheet.getAttribute("href");
      if (href && !href.includes("?v=")) {
        sheet.setAttribute("href", `${href}?v=${timestamp}`);
      }
    });

    // Add version to body for debugging
    document.body.setAttribute("data-version", timestamp.toString());

    console.log(`Cache Buster: Version ${timestamp}`);
  }, []);

  return null;
}
