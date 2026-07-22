"use client";

import { FormEvent, useState } from "react";
import { categories, states } from "@/lib/constants";

const stateLimitMessage = "Standard listings can serve up to 3 states. Want nationwide coverage? Ask about a Featured listing.";

export function ApplicationForm() {
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [stateError, setStateError] = useState("");

  function toggleState(value: string, checked: boolean) {
    if (checked && selectedStates.length >= 3) {
      setStateError(stateLimitMessage);
      return;
    }
    setSelectedStates((current) => checked ? [...current, value] : current.filter((item) => item !== value));
    setStateError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStates.length || selectedStates.length > 3) {
      setStateError(selectedStates.length ? stateLimitMessage : "Choose at least one state you serve.");
      return;
    }
    setStatus({ type: "loading" });
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/apply", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit application.");
      setStatus({ type: "success", message: "Application received. We’ll review your work and contact you by email." });
      form.reset();
      setSelectedStates([]);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  return <form className="application-form" onSubmit={submit}>
    <div className="field-grid"><div className="field"><label htmlFor="business_name">Business / studio name *</label><input id="business_name" name="business_name" required maxLength={100} /></div><div className="field"><label htmlFor="owner_name">Your full name *</label><input id="owner_name" name="owner_name" required maxLength={100} /></div><div className="field"><label htmlFor="email">Email address *</label><input id="email" name="email" type="email" required /></div><div className="field"><label htmlFor="whatsapp">WhatsApp number *</label><input id="whatsapp" name="whatsapp" type="tel" placeholder="234…" required /></div></div>
    <div className="field"><label htmlFor="bio">Tell us about your work *</label><textarea id="bio" name="bio" required minLength={80} maxLength={1200} placeholder="Your story, style, experience and the kind of commissions you love…" /><p className="help-text">Minimum 80 characters. This becomes the introduction on your profile.</p></div>
    <div className="field"><label>What do you create? *</label><div className="choice-grid">{categories.map((category) => <label className="choice" key={category}><input type="checkbox" name="categories" value={category} />{category}</label>)}</div></div>
    <div className="field"><label>Where do you work or deliver? * (maximum 3)</label><div className="choice-grid">{states.map((state) => <label className="choice" key={state.slug}><input type="checkbox" name="states_served" value={state.name} checked={selectedStates.includes(state.name)} onChange={(event) => toggleState(state.name, event.target.checked)} />{state.name}</label>)}</div><p className="help-text">Choose your home state and up to two nearby states. Featured listings can receive nationwide placement.</p>{stateError && <div className="status-message error" role="alert">{stateError}</div>}</div>
    <div className="field-grid"><div className="field"><label htmlFor="instagram">Instagram URL</label><input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/…" /></div><div className="field"><label htmlFor="portfolio_link">Portfolio website</label><input id="portfolio_link" name="portfolio_link" type="url" placeholder="https://…" /></div></div>
    <div className="field"><label htmlFor="price_range">Typical price range</label><input id="price_range" name="price_range" placeholder="e.g. ₦30,000 – ₦200,000" /></div>
    <div className="field"><label htmlFor="images">Portfolio images * (up to 8)</label><input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required /><p className="help-text">JPG, PNG or WebP. Up to 5 MB each. The first image becomes your profile photo.</p></div>
    {status.type !== "idle" && <div className={`status-message ${status.type === "error" ? "error" : ""}`} role="status">{status.type === "loading" ? "Submitting your application…" : status.message}</div>}
    <button className="button" disabled={status.type === "loading"} type="submit">{status.type === "loading" ? "Submitting…" : "Submit for review"}</button>
  </form>;
}
