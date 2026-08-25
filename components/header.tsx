"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "./icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isAdminUser } from "@/lib/auth";

export function Header() {
  const [open, setOpen] = useState(false);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [account, setAccount] = useState<{ signedIn: boolean; admin: boolean } | null>(configured ? null : { signedIn: false, admin: false });
  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setAccount({ signedIn: Boolean(data.user), admin: isAdminUser(data.user) }));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount({ signedIn: Boolean(session?.user), admin: isAdminUser(session?.user) });
    });
    return () => listener.subscription.unsubscribe();
  }, [configured]);
  const close = () => setOpen(false);
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
          <Link href="/find-artists" onClick={close}>Find artists</Link>
          <Link href="/#how" onClick={close}>How it works</Link>
          <Link href="/#faq" onClick={close}>FAQs</Link>
          {account?.signedIn ? <>
            {account.admin && <Link href="/admin" onClick={close}>Admin</Link>}
            <Link href="/dashboard" onClick={close}>Dashboard</Link>
            <form action="/auth/sign-out" method="post"><button className="nav-text-button" type="submit" onClick={close}>Sign out</button></form>
          </> : <Link href="/auth/login" onClick={close}>Sign in</Link>}
          <Link className="button button-small" href="/apply" onClick={close}>Join as an artist</Link>
        </nav>
      </div>
    </header>
  );
}
