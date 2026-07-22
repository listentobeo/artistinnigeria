"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "./icons";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="Artist in Nigeria home">
          Artist<span>in</span>Nigeria<i>.</i>
        </Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={open ? "nav-links open" : "nav-links"}>
          <Link href="/find-artists" onClick={() => setOpen(false)}>Find artists</Link>
          <Link href="/#how" onClick={() => setOpen(false)}>How it works</Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>FAQs</Link>
          <Link className="button button-small" href="/apply" onClick={() => setOpen(false)}>List your work</Link>
        </nav>
      </div>
    </header>
  );
}
