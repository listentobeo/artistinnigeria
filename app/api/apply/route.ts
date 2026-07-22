import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabase } from "@/lib/supabase/server";

const safeSlug=(value:string)=>value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-");
export async function POST(request:Request){
  if(!hasSupabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:"Applications are not connected yet. Add the Supabase environment variables to enable submissions."},{status:503});
  try{
    const form=await request.formData(); const businessName=String(form.get("business_name")||"").trim(); const ownerName=String(form.get("owner_name")||"").trim(); const email=String(form.get("email")||"").trim(); const whatsapp=String(form.get("whatsapp")||"").trim(); const bio=String(form.get("bio")||"").trim(); const categories=form.getAll("categories").map(String); const states=form.getAll("states_served").map(String); const images=form.getAll("images").filter((item):item is File=>item instanceof File && item.size>0);
    if(!businessName||!ownerName||!email||!whatsapp||bio.length<80||!categories.length||!states.length||!images.length) return NextResponse.json({error:"Please complete every required field and choose at least one category and state."},{status:400});
    if(states.length>3) return NextResponse.json({error:"Standard listings can serve up to 3 states. Want nationwide coverage? Ask about a Featured listing."},{status:400});
    if(images.length>8||images.some((file)=>file.size>5*1024*1024)||images.some((file)=>!["image/jpeg","image/png","image/webp"].includes(file.type))) return NextResponse.json({error:"Upload up to 8 JPG, PNG or WebP images, no larger than 5 MB each."},{status:400});
    const supabase=createSupabaseAdminClient(); let slug=safeSlug(businessName); const {data:existing}=await supabase.from("artists").select("slug").eq("slug",slug).maybeSingle(); if(existing) slug=`${slug}-${Date.now().toString().slice(-5)}`;
    const urls:string[]=[]; for(const [index,file] of images.entries()){const extension=file.name.split(".").pop()?.toLowerCase()||"jpg"; const path=`${slug}/${crypto.randomUUID()}-${index}.${extension}`; const {error}=await supabase.storage.from("artist-portfolios").upload(path,file,{contentType:file.type,upsert:false}); if(error) throw error; urls.push(supabase.storage.from("artist-portfolios").getPublicUrl(path).data.publicUrl);}
    const {error}=await supabase.from("artists").insert({slug,business_name:businessName,owner_name:ownerName,email,whatsapp,bio,categories,states_served:states,profile_image_url:urls[0],portfolio_image_urls:urls,instagram:String(form.get("instagram")||"")||null,portfolio_link:String(form.get("portfolio_link")||"")||null,price_range:String(form.get("price_range")||"")||null,status:"pending",featured:false,featured_until:null,featured_tier:null}); if(error) throw error;
    return NextResponse.json({ok:true},{status:201});
  }catch(error){console.error(error);return NextResponse.json({error:"We couldn’t save the application. Please try again."},{status:500});}
}
