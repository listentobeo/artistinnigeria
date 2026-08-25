import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("booking messages upload private files and render expiring signed links",()=>{const actions=read("app/bookings/actions.ts"),page=read("app/bookings/[id]/page.tsx");assert.match(actions,/storage\.from\("booking-files"\)\.upload/);assert.match(actions,/attachments\.length>3/);assert.match(page,/createSignedUrl\(path,900\)/);assert.match(page,/path\.startsWith\(`\$\{id\}\//);});

test("public and booking-private WIP media are signed and expire",()=>{const artist=read("app/artist/[slug]/page.tsx"),booking=read("app/bookings/[id]/page.tsx"),dashboard=read("app/dashboard/artist-actions.ts");assert.match(dashboard,/visibility==="booking_private"&&!bookingId/);assert.match(dashboard,/in\("status",\["funded","in_progress","awaiting_client_approval","revision_requested"\]\)/);assert.match(artist,/createSignedUrl\(update\.media_url,3600\)/);assert.match(booking,/createSignedUrl\(update\.media_url,900\)/);});

test("quote acceptance uses the newest version and booking transitions use compare-and-set",()=>{const quotes=read("app/requests/actions.ts"),bookings=read("app/bookings/actions.ts");assert.match(quotes,/latest\?\.id!==quote\.id/);assert.match(quotes,/quote_version:quote\.version/);assert.match(bookings,/eq\("status",from\)\.select\("id"\)\.maybeSingle/);assert.match(bookings,/payout_eligible_at/);});

test("Paystack checkout, payout OTP and reconciliation are persisted server-side",()=>{const initialize=read("app/api/payments/initialize/route.ts"),admin=read("app/admin/actions.ts"),paystack=read("lib/paystack.ts");assert.match(initialize,/eq\("status","initialized"\)/);assert.match(initialize,/provider_payload:initialized/);assert.match(admin,/status:"initializing"/);assert.match(admin,/finalizePaystackTransfer/);assert.match(admin,/verifyPaystackTransfer/);assert.match(paystack,/transfer\/finalize_transfer/);assert.match(paystack,/transfer\/verify/);});

test("private account routes are excluded from indexing",()=>{const robots=read("app/robots.ts"),booking=read("app/bookings/[id]/page.tsx");for(const path of ["/admin","/api/","/auth/","/dashboard/","/bookings/","/requests/","/payments/"])assert.match(robots,new RegExp(path.replace("/","\\/")));assert.match(booking,/robots:\{index:false,follow:false\}/);});

test("self-service applications preview media and notify the private admin queue",()=>{const form=read("app/apply/application-form.tsx"),route=read("app/api/apply/route.ts"),admin=read("app/admin/page.tsx");assert.match(form,/URL\.createObjectURL/);assert.match(form,/files\.length>8/);assert.match(route,/notifyAdmin/);assert.match(admin,/submitted portfolio/);assert.match(admin,/moderation_reason/);});
