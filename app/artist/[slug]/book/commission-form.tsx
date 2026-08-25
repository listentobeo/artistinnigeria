"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { serviceBriefs } from "@/lib/marketplace";
import { states } from "@/lib/constants";

const labels: Record<string,string> = { subjects:"Number and names of subjects", medium:"Preferred medium", dimensions:"Dimensions", reference_photos:"Describe the reference photos you can provide", background:"Background preference", framing:"Framing requirements", deadline:"Required date", delivery_state:"Delivery state", wall_photos:"Describe or link to wall photographs", wall_dimensions:"Wall dimensions", indoor_or_outdoor:"Indoor or outdoor", surface_condition:"Wall surface and condition", project_address:"Project city and address", concept:"Concept or story", brand_colours:"Brand colours", access_and_scaffolding:"Access or scaffolding needs", installation_date:"Preferred installation date", material:"Preferred material", site_photos:"Describe the site", foundation:"Foundation requirements", finish:"Finish", transport:"Transport requirements", installation:"Installation requirements", event_type:"Event type", event_date:"Event date", venue:"Venue and city", key_moment:"Moment to capture", canvas_size:"Canvas size", service_hours:"Required service hours", travel_and_accommodation:"Travel or accommodation", production_type:"Production type", effect:"Effect or character", date:"Date", location:"Location", performer_count:"Number of performers", body_area:"Body or face area", allergies:"Allergies or sensitivities", continuity_days:"Continuity days", call_time:"Call time", private_references:"Private reference description", technique:"Technique", garment_or_fabric:"Garment or raw fabric", measurements:"Measurements", quantity:"Quantity", colours:"Colours", pattern:"Pattern", base_material:"Base material", sample_approval:"Sample approval needs", care_requirements:"Care requirements", palette:"Colour palette", room_photos:"Describe or link to room photographs", mockup:"Mockup requirements", shipping:"Shipping destination" };

export function CommissionForm({ artistId, artistName, categories }: { artistId: string; artistName: string; categories: string[] }) {
  const router = useRouter(); const [category,setCategory]=useState(categories[0]); const [status,setStatus]=useState("");
  const brief = useMemo(() => serviceBriefs[category] || { label: "Commission", fields: [] }, [category]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("Sending your brief…"); const form = new FormData(event.currentTarget); const details: Record<string,string> = {};
    brief.fields.forEach((field) => { details[field] = String(form.get(field) || "").trim(); });
    const response = await fetch("/api/commissions", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ artistId, category, title:form.get("title"), stateSlug:form.get("state_slug"), targetDate:form.get("target_date") || null, budgetMin:form.get("budget_min"), budgetMax:form.get("budget_max"), brief:details }) });
    const result = await response.json(); if (!response.ok) { setStatus(result.error || "Could not send request."); return; }
    router.push(`/dashboard?request=${result.id}`);
  }
  return <form className="application-form" onSubmit={submit}>
    <div className="field"><label htmlFor="category">Service</label><select id="category" value={category} onChange={(e)=>setCategory(e.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></div>
    <div className="field"><label htmlFor="title">Project title</label><input id="title" name="title" required maxLength={120} placeholder={`Your commission with ${artistName}`} /></div>
    <div className="field-grid"><div className="field"><label htmlFor="state_slug">Project or delivery state</label><select id="state_slug" name="state_slug" required>{states.map(state=><option value={state.slug} key={state.slug}>{state.name}</option>)}</select></div><div className="field"><label htmlFor="target_date">Target date</label><input id="target_date" name="target_date" type="date" /></div></div>
    <div className="field-grid"><div className="field"><label htmlFor="budget_min">Minimum budget (₦)</label><input id="budget_min" name="budget_min" type="number" min="0" step="1000" /></div><div className="field"><label htmlFor="budget_max">Maximum budget (₦)</label><input id="budget_max" name="budget_max" type="number" min="0" step="1000" /></div></div>
    <h2 className="form-subheading">{brief.label} details</h2>
    {brief.fields.map(field => <div className="field" key={field}><label htmlFor={field}>{labels[field] || field.replaceAll("_"," ")}</label><textarea id={field} name={field} required /></div>)}
    {status && <div className={status.startsWith("Could") ? "status-message error" : "status-message"}>{status}</div>}
    <button className="button" type="submit">Send commission request</button>
  </form>;
}
