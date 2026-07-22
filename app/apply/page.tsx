import type { Metadata } from "next";
import { Check } from "@/components/icons";
import { ApplicationForm } from "./application-form";
export const metadata: Metadata = { title:"Join the Artist Directory", description:"Apply for a verified Artist in Nigeria profile and help new clients discover your work." };
export default function ApplyPage(){return <section className="form-page"><div className="shell form-layout"><aside className="form-intro"><p className="eyebrow">For working artists</p><h1>Let your work<br/>be found.</h1><p>Create a free profile in Nigeria’s curated artist directory. We review every application to keep the community useful and trustworthy.</p><ul className="form-points"><li><Check size={18}/> A search-friendly artist profile</li><li><Check size={18}/> Up to eight portfolio images</li><li><Check size={18}/> Direct WhatsApp enquiries</li><li><Check size={18}/> No commission on your work</li></ul></aside><ApplicationForm/></div></section>}
