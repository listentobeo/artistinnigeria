"use client";
import { useState } from "react";

const flows = {
  clients: [["01", "Find a verified artist", "Search by service and the artist’s genuine base or service location."], ["02", "Approve a written quote", "Agree on deliverables, timing, revisions, rights and delivery before paying."], ["03", "Pay and track securely", "Use Paystack, follow progress and leave a verified review after completion."]],
  artists: [["01", "Create or claim a profile", "Own your bio, portfolio, services, locations and availability."], ["02", "Quote structured requests", "Keep the brief, agreement, messages, progress and delivery together."], ["03", "Earn from completed work", "Receive your payout after customer approval; the platform retains 10%."]],
};

export function HomeTabs() {
  const [tab, setTab] = useState<keyof typeof flows>("clients");
  return <div><div className="tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>I need an artist</button><button className={tab === "artists" ? "active" : ""} onClick={() => setTab("artists")}>I am an artist</button></div><div className="steps">{flows[tab].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div>;
}
