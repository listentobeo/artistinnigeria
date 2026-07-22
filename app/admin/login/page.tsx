import type { Metadata } from "next";
import { LoginForm } from "./login-form";
export const metadata:Metadata={title:"Admin sign in",robots:{index:false,follow:false}};
export default function AdminLogin(){return <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Private dashboard</p><h1>Welcome back.</h1><p>Sign in to review new artist applications.</p><LoginForm/></div></section>}
