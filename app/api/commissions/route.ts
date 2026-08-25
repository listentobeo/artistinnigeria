import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { serviceBriefs } from "@/lib/marketplace";
import { notifyAdmin } from "@/lib/notifications";

export async function POST(request: Request) {
  if (!hasSupabase) return NextResponse.json({error:"Accounts are not connected in this preview."},{status:503});
  const supabase = await createSupabaseServerClient(); const {data:{user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error:"Sign in before requesting a commission."},{status:401});
  const input = await request.json(); const category=String(input.category||""); const title=String(input.title||"").trim();
  if (!serviceBriefs[category] || title.length<5 || title.length>140 || !input.artistId) return NextResponse.json({error:"Use a project title between 5 and 140 characters."},{status:400});
  const {data:artist}=await supabase.from("artists").select("id,categories,bookable,status").eq("id",input.artistId).eq("status","approved").maybeSingle();
  if (!artist || !artist.bookable || !artist.categories.includes(category)) return NextResponse.json({error:"This artist is not currently bookable for that service."},{status:400});
  const rawBrief=input.brief&&typeof input.brief==="object"&&!Array.isArray(input.brief)?input.brief:{};const required=serviceBriefs[category].fields;const brief=Object.fromEntries(required.map(field=>[field,String(rawBrief[field]||"").trim()]));if(required.some(field=>!brief[field]||brief[field].length>2000)||Object.values(brief).join("").length>15_000)return NextResponse.json({error:"Complete every brief field and keep each answer under 2,000 characters."},{status:400});
  const toKobo=(value:unknown)=>{if(value===null||value===undefined||value==="")return null;const amount=Number(value);return Number.isFinite(amount)&&amount>=0&&amount<=10_000_000?Math.round(amount*100):null;};const min=toKobo(input.budgetMin),max=toKobo(input.budgetMax);if((input.budgetMin!==""&&input.budgetMin!=null&&min===null)||(input.budgetMax!==""&&input.budgetMax!=null&&max===null)||(min!==null&&max!==null&&min>max))return NextResponse.json({error:"Enter a valid budget range."},{status:400});
  const admin=createSupabaseAdminClient();const [{data:state},recent]=await Promise.all([admin.from("states").select("slug").eq("slug",String(input.stateSlug||"").toLowerCase()).maybeSingle(),admin.from("commission_requests").select("id",{count:"exact",head:true}).eq("customer_id",user.id).gte("created_at",new Date(Date.now()-3600000).toISOString())]);if(!state)return NextResponse.json({error:"Choose a valid Nigerian state or FCT."},{status:400});if((recent.count||0)>=10)return NextResponse.json({error:"Too many commission requests. Try again later."},{status:429});
  const targetDate=input.targetDate?String(input.targetDate):null;if(targetDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)||targetDate<new Date().toISOString().slice(0,10)))return NextResponse.json({error:"Choose today or a future target date."},{status:400});const {data,error}=await admin.from("commission_requests").insert({customer_id:user.id,artist_id:artist.id,category,title,brief,state_slug:state.slug,target_date:targetDate,budget_min_kobo:min,budget_max_kobo:max}).select("id").single();
  if(error) return NextResponse.json({error:error.message},{status:400});await notifyAdmin({subject:`New ${category} request: ${title}`,text:`A customer submitted a managed commission request for artist ${artist.id} in ${state.slug}. Request ID: ${data.id}.`,idempotencyKey:`commission-request/${data.id}`}); return NextResponse.json(data,{status:201});
}
