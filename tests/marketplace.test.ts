import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { calculateBookingMoney,canTransitionBooking,normalizeExternalUrl,normalizeInstagram,normalizeWhatsapp } from "../lib/marketplace.ts";
import { verifyPaystackWebhook } from "../lib/paystack.ts";
import { safeRelativePath } from "../lib/navigation.ts";

test("10% commission excludes reimbursable logistics",()=>{assert.deepEqual(calculateBookingMoney(20_000_000,1_500_000),{commissionableKobo:20_000_000,reimbursableKobo:1_500_000,platformFeeKobo:2_000_000,artistEntitlementKobo:19_500_000,customerTotalKobo:21_500_000});});
test("invalid money is rejected",()=>{assert.throws(()=>calculateBookingMoney(-1));assert.throws(()=>calculateBookingMoney(1.2));});
test("booking transitions reject unsafe jumps",()=>{assert.equal(canTransitionBooking("funded","in_progress"),true);assert.equal(canTransitionBooking("funded","completed"),false);assert.equal(canTransitionBooking("awaiting_client_approval","completed"),true);assert.equal(canTransitionBooking("refunded","funded"),false);});
test("Paystack webhook signatures use a timing-safe SHA-512 HMAC",()=>{process.env.PAYSTACK_SECRET_KEY="test_secret";const body=JSON.stringify({event:"charge.success",data:{reference:"AIN-test"}});const signature=crypto.createHmac("sha512","test_secret").update(body).digest("hex");assert.equal(verifyPaystackWebhook(body,signature),true);assert.equal(verifyPaystackWebhook(body,"0".repeat(128)),false);delete process.env.PAYSTACK_SECRET_KEY;});
test("artist contact links reject unsafe schemes",()=>{assert.equal(normalizeExternalUrl("https://beoarts.com/gallery"),"https://beoarts.com/gallery");assert.throws(()=>normalizeExternalUrl("javascript:alert(1)"));assert.equal(normalizeInstagram("@_beoarts"),"https://instagram.com/_beoarts");assert.throws(()=>normalizeInstagram("https://example.com/not-instagram"));assert.equal(normalizeWhatsapp("+234 907 542 4681"),"2349075424681");assert.throws(()=>normalizeWhatsapp("123"));});
test("post-auth redirects stay on this site",()=>{assert.equal(safeRelativePath("/artist/beo-art-studio/claim"),"/artist/beo-art-studio/claim");assert.equal(safeRelativePath("//evil.example/path"),"/dashboard");assert.equal(safeRelativePath("/\\evil.example/path"),"/dashboard");assert.equal(safeRelativePath("https://evil.example"),"/dashboard");});
