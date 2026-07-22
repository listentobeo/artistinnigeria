"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { artistCategories } from "@/lib/categories";
import { states } from "@/lib/constants";

export function FindArtistsForm() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (category && state) router.push(`/${category}-artist-in-${state}`);
  }
  return <form className="finder-form" onSubmit={submit}>
    <div className="field"><label htmlFor="find-category">Category</label><select id="find-category" value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Choose an artist category</option>{artistCategories.map((item) => <option value={item.slug} key={item.slug}>{item.displayName}</option>)}</select></div>
    <div className="field"><label htmlFor="find-state">State</label><select id="find-state" value={state} onChange={(event) => setState(event.target.value)} required><option value="">Choose a state</option>{states.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></div>
    <button className="button" type="submit" disabled={!category || !state}>Show Local Artists</button>
  </form>;
}
