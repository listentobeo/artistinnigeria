import Link from "next/link";
import { signUp } from "../actions";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  return <section className="auth-shell"><form className="auth-card" action={signUp}>
    <p className="eyebrow">Account-based commissions</p><h1>Create your account</h1><p>Customers and artists both begin here. Artist permissions are activated after profile approval or a successful claim.</p>
    {query.error && <div className="status-message error">{query.error}</div>}
    <input type="hidden" name="next" value={query.next || "/dashboard"} />
    <div className="field"><label htmlFor="full_name">Full name</label><input id="full_name" name="full_name" autoComplete="name" required /></div>
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /><p className="help-text">Use at least eight characters.</p></div>
    <button className="button" type="submit">Create account</button>
    <p className="help-text">Already registered? <Link className="text-link" href="/auth/login">Sign in</Link></p>
  </form></section>;
}
