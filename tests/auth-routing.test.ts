import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("owner promotion matches the exact existing Supabase account", () => {
  const migration = read("supabase/promote-owner-admin.sql");
  assert.match(migration, /d7009652-3a51-4b1c-847e-2322dc2c3839/);
  assert.match(migration, /odekeb9@gmail\.com/);
  assert.match(migration, /raw_app_meta_data[\s\S]*"role":"admin"/);
  assert.match(migration, /set role = 'admin'/);
});

test("account routes distinguish administrators and sign out with POST", () => {
  const actions = read("app/auth/actions.ts");
  const dashboard = read("app/dashboard/page.tsx");
  const signOut = read("app/auth/sign-out/route.ts");
  const header = read("components/header.tsx");
  assert.match(actions, /isAdminUser\(data\.user\)/);
  assert.match(dashboard, /if \(isAdminUser\(user\)\) redirect\("\/admin"\)/);
  assert.match(signOut, /export async function POST/);
  assert.match(signOut, /auth\.signOut\(\)/);
  assert.match(header, /account\.admin[\s\S]*href="\/admin"/);
  assert.match(header, /action="\/auth\/sign-out" method="post"/);
});
