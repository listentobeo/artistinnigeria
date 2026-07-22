"use client";
import { useState } from "react";

const flows = {
  clients: [["01", "Search Local Artists", "Browse Nigerian artists by location and speciality."], ["02", "Compare Artist Portfolios", "Review artwork, styles and typical prices."], ["03", "Contact an Artist", "Message your chosen artist directly about your commission."]],
  artists: [["01", "Create an Artist Profile", "Tell clients about your art practice."], ["02", "Become a Verified Artist", "We review every Nigerian artist personally."], ["03", "Reach Local Art Buyers", "Your profile appears when clients search by location."]],
};

export function HomeTabs() {
  const [tab, setTab] = useState<keyof typeof flows>("clients");
  return <div><div className="tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>I need an artist</button><button className={tab === "artists" ? "active" : ""} onClick={() => setTab("artists")}>I am an artist</button></div><div className="steps">{flows[tab].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div>;
}
