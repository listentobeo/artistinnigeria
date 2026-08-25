import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://artistinnigeria.com").replace(/\/$/,"");return{rules:{userAgent:"*",allow:"/",disallow:["/admin","/api/","/auth/","/dashboard/","/bookings/","/requests/","/payments/"]},sitemap:`${base}/sitemap.xml`}}
