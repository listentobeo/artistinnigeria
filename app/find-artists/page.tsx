import type { Metadata } from "next";
import { MapPin } from "@/components/icons";
import { FindArtistsForm } from "./find-artists-form";

export const metadata: Metadata = {
  title: { absolute: "Find Artists in Nigeria | Search by State & Category" },
  description: "Search for portrait artists, muralists, sculptors, live painters, makeup artists and other creatives by category and Nigerian state.",
};

export default function FindArtistsPage() {
  return <><section className="page-hero"><div className="shell"><p className="eyebrow"><MapPin size={15} /> Search the Nigerian artist directory</p><h1>Find Artists Near You<br />in Nigeria</h1><p>Choose the kind of artist you need and the state they should serve. We’ll take you directly to the matching local listings.</p></div></section><section className="section"><div className="finder-shell"><FindArtistsForm /></div></section></>;
}
