"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

export interface RouteInfo {
  page: string; // '' for home
  param?: string;
  query: Record<string, string>;
  full: string; // path like '/doctors?x=1'
}

function parseHash(hash: string): RouteInfo {
  let h = hash.replace(/^#/, "");
  if (!h || h === "/") return { page: "", query: {}, full: "/" };
  const [path, qs] = h.split("?");
  const query: Record<string, string> = {};
  if (qs) {
    for (const pair of qs.split("&")) {
      const [k, v] = pair.split("=");
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  const segs = path.split("/").filter(Boolean);
  return {
    page: segs[0] || "",
    param: segs[1] ? decodeURIComponent(segs[1]) : undefined,
    query,
    full: h.startsWith("/") ? h : "/" + h,
  };
}

export function navigate(to: string, opts?: { keepScroll?: boolean }) {
  const target = to.startsWith("/") ? to : "/" + to;
  if (opts?.keepScroll) {
    window.location.hash = target;
    return;
  }
  // set hash and scroll to top
  if (window.location.hash === "#" + target) return;
  window.location.hash = target;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
}

export function useHashRoute(): RouteInfo {
  const [hash, setHash] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.hash || "#/" : "#/"
  );

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return useMemo(() => parseHash(hash), [hash]);
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}

/** Anchor that works with hash routing */
export function Link({
  to,
  className,
  children,
  onClick,
  ariaLabel,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <a
      href={`#${to.startsWith("/") ? to : "/" + to}`}
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
