import "server-only";

type AdminNotice={subject:string;text:string;idempotencyKey:string};

export async function notifyAdmin(notice:AdminNotice){const apiKey=process.env.RESEND_API_KEY,to=process.env.ADMIN_NOTIFICATION_EMAIL,from=process.env.RESEND_FROM_EMAIL;if(!apiKey||!to||!from)return false;try{const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":notice.idempotencyKey.slice(0,256)},body:JSON.stringify({from,to:[to],subject:notice.subject,text:notice.text}),cache:"no-store"});if(!response.ok){console.error("Admin notification failed",response.status,await response.text());return false;}return true;}catch(error){console.error("Admin notification failed",error);return false;}}
