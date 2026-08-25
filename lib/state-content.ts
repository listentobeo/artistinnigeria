import type { StateContent } from "./types";

const locationData: Array<[string,string,string[]]> = [
  ["abia","Umuahia",["Umuahia","Aba"]],["adamawa","Yola",["Yola","Mubi"]],["akwa-ibom","Uyo",["Uyo","Eket","Ikot Ekpene"]],
  ["anambra","Awka",["Awka","Onitsha","Nnewi"]],["bauchi","Bauchi",["Bauchi"]],["bayelsa","Yenagoa",["Yenagoa"]],
  ["benue","Makurdi",["Makurdi","Gboko","Otukpo"]],["borno","Maiduguri",["Maiduguri"]],["cross-river","Calabar",["Calabar"]],
  ["delta","Asaba",["Asaba","Warri","Sapele"]],["ebonyi","Abakaliki",["Abakaliki"]],["edo","Benin City",["Benin City"]],
  ["ekiti","Ado-Ekiti",["Ado-Ekiti"]],["enugu","Enugu",["Enugu","Nsukka"]],["gombe","Gombe",["Gombe"]],
  ["imo","Owerri",["Owerri"]],["jigawa","Dutse",["Dutse"]],["kaduna","Kaduna",["Kaduna","Zaria"]],
  ["kano","Kano",["Kano"]],["katsina","Katsina",["Katsina"]],["kebbi","Birnin Kebbi",["Birnin Kebbi"]],
  ["kogi","Lokoja",["Lokoja"]],["kwara","Ilorin",["Ilorin"]],["lagos","Ikeja",["Ikeja","Lagos Island","Lekki"]],
  ["nasarawa","Lafia",["Lafia"]],["niger","Minna",["Minna","Suleja"]],["ogun","Abeokuta",["Abeokuta"]],
  ["ondo","Akure",["Akure"]],["osun","Osogbo",["Osogbo","Ile-Ife"]],["oyo","Ibadan",["Ibadan","Ogbomoso"]],
  ["plateau","Jos",["Jos"]],["rivers","Port Harcourt",["Port Harcourt"]],["sokoto","Sokoto",["Sokoto"]],
  ["taraba","Jalingo",["Jalingo"]],["yobe","Damaturu",["Damaturu"]],["zamfara","Gusau",["Gusau"]],
  ["fct-abuja","Abuja",["Abuja"]],
];

export const stateContent: Record<string,StateContent> = Object.fromEntries(locationData.map(([slug,capital,majorCities])=>[slug,{
  state_slug:slug, capital, major_cities:majorCities, map_query:`${capital}, Nigeria`,
  local_summary:`For a commission around ${majorCities.join(", ")}, distinguish artists based in the area from artists travelling for on-site work or shipping finished artwork into ${capital}. Record transport, venue access, installation and delivery costs separately in the written quote.`,
  source_urls:[`https://www.google.com/maps/search/${encodeURIComponent(`${capital}, Nigeria`)}`,"https://services.gov.ng/about/government","https://sccr.gov.ng/?p=121"], last_verified_at:"2026-08-25",
}]));

export const serviceHiringNotes: Record<string,string> = {
  portrait:"For a portrait, prepare clear reference photographs and agree on subject count, medium, size, framing, delivery and the number of revisions before work begins.",
  mural:"For a mural, share wall photographs and measurements. The quote should cover surface preparation, mockup approval, materials, access equipment, travel and installation timing.",
  sculpture:"For sculpture or carving, document the material, scale, finish, placement, transport, foundation and installation requirements.",
  "live-event-painting":"For live event painting, confirm the date, venue, scene to capture, setup time, working hours, canvas size, travel and whether studio touch-ups follow the event.",
  "sfx-makeup":"For SFX makeup, confirm performers, effect references, allergies, call time, continuity days, removal and privacy requirements for production photographs.",
  "fabric-textile":"For textile work, specify the technique, base fabric, measurements, quantity, palette, sample approval and care instructions.",
  "abstract-contemporary":"For a contemporary commission, agree on dimensions, medium, palette, conceptual direction, framing, shipping and installation.",
};

export const serviceResearchSources: Record<string,{label:string;url:string}> = {
  portrait:{label:"Artist Kelle commission guide",url:"https://www.artistkelle.com/"},
  mural:{label:"Nathan Emorey mural practice",url:"https://nathanemorey.com/"},
  sculpture:{label:"Molten Metal Studios services",url:"https://moltenmetal.ng/"},
  "live-event-painting":{label:"Beo Art Studio live-event process",url:"https://www.beoarts.com/p/live-event-painting-services-in-nigeria.html"},
  "sfx-makeup":{label:"Ovie Makeup Effects services",url:"https://oviemakeupeffect.com/"},
  "fabric-textile":{label:"TOACC textile practice",url:"https://www.tundeodunladearts.com/about"},
  "abstract-contemporary":{label:"Anthony Azekwoh commercial practice",url:"https://www.anthonyazekwoh.com/commercial"},
};
