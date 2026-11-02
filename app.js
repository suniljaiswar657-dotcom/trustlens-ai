const input=document.querySelector("#scan-input");
const result=document.querySelector("#result");
const counter=document.querySelector("#char-count");
let mode="message";
const tabs=[...document.querySelectorAll(".tab")];
const hints={
 message:["PASTE MESSAGE OR CHAT TEXT","Paste a suspicious SMS, WhatsApp message or email text here…"],
 job:["PASTE JOB OFFER OR RECRUITER MESSAGE","Paste the job description or recruiter message here…"],
 url:["PASTE FULL WEBSITE URL","https://example.com"]
};
tabs.forEach(tab=>tab.addEventListener("click",()=>{
 tabs.forEach(t=>t.classList.remove("active"));tab.classList.add("active");
 mode=tab.dataset.mode;document.querySelector("#input-label").textContent=hints[mode][0];
 input.placeholder=hints[mode][1];input.value="";counter.textContent="0 / 5000";result.classList.add("hidden");
}));
input.addEventListener("input",()=>{if(input.value.length>5000)input.value=input.value.slice(0,5000);counter.textContent=input.value.length+" / 5000";});
document.querySelector("#clear-btn").addEventListener("click",()=>{input.value="";counter.textContent="0 / 5000";result.classList.add("hidden");});
const rules=[
 [/\botp\b|one.time password|verification code/i,"Requests for OTP or verification code",30,"Never share OTPs or verification codes."],
 [/upi pin|atm pin|cvv|share your password|send your password/i,"Requests for banking credentials",35,"Never disclose PIN, CVV or passwords."],
 [/registration fee|processing fee|security deposit|pay.*(fee|deposit)/i,"Advance payment request",25,"Verify independently before paying any fee."],
 [/urgent|immediately|within 24 hours|account.*blocked|act now/i,"Pressure or urgency language",12,"Pause and contact the organisation through its official channel."],
 [/won a prize|you have won|lottery|claim your reward/i,"Unexpected prize or reward claim",20,"Do not pay fees to claim unexpected prizes."],
 [/guaranteed (job|income|returns)|no interview.*job/i,"Unrealistic guarantee or hiring claim",18,"Verify the employer, role and terms."],
 [/click here|verify now|claim now|bit\.ly|tinyurl|t\.co/i,"Link or click-through language",10,"Avoid unexpected links; visit official sites directly."],
 [/remote access|anydesk|teamviewer|share your screen/i,"Remote-access or screen-sharing request",20,"Do not grant unsolicited remote access."]
];
function show(title,score,items,detail=""){
 const level=score>=60?"HIGH":score>=25?"MEDIUM":"LOW";
 const tone=level==="HIGH"?"#ff7777":level==="MEDIUM"?"#f2c36b":"#c6f36a";
 result.innerHTML="<div class='result-head'><div><div class='eyebrow'>ANALYSIS COMPLETE</div><h3>"+title+"</h3></div><div style='text-align:right'><div class='risk-label' style='color:"+tone+"'>"+level+" INDICATOR</div><div class='score'>"+score+"<small> / 100</small></div></div></div><p>Heuristic indicator score. It is not a probability of fraud.</p><ul>"+items.map(x=>"<li>"+safe(x)+"</li>").join("")+"</ul>"+(detail?"<p>"+safe(detail)+"</p>":"")+"<p class='disclaimer'>Basic on-device pattern check only — not an AI verdict, malware scan or live reputation lookup. A low score does not prove safety.</p>";
 result.classList.remove("hidden");result.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function safe(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function checkUrl(raw){
 try{
  const u=new URL(raw);let score=0,items=[];
  const add=(text,n)=>{items.push(text);score+=n;};
  if(!["http:","https:"].includes(u.protocol))add("Unexpected URL protocol",30);
  if(u.protocol!=="https:")add("Connection does not use HTTPS",15);
  if(u.username||u.password)add("URL contains embedded login credentials",30);
  if(/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname))add("Website uses a raw IP address",25);
  if(u.hostname.split(".").some(x=>x.startsWith("xn--")))add("Domain uses punycode — inspect spelling carefully",20);
  if(u.hostname.split(".").length>4)add("Unusually nested subdomains",10);
  if(u.hostname.length>50)add("Unusually long hostname",10);
  if(!items.length)items.push("No basic URL-structure warning was detected.");
  return {score:Math.min(score,100),items,host:u.hostname};
 }catch(e){return {score:0,items:["Enter a complete URL including https:// or http://"],bad:true};}
}
document.querySelector("#analyse-btn").addEventListener("click",()=>{
 const raw=input.value.trim();if(!raw){input.focus();return;}
 if(mode==="url"){const r=checkUrl(raw);show("Website structure check",r.score,r.items,r.bad?"":"Hostname inspected: "+r.host);return;}
 let found=rules.filter(r=>r[0].test(raw));
 if(mode==="job")found=found.filter(r=>/payment|guarantee|hiring|urgency|credential/i.test(r[1]));
 const score=Math.min(100,found.reduce((n,r)=>n+r[2],0));
 const items=found.map(r=>r[1]+" — "+r[3]);
 if(!items.length)items.push("No configured warning patterns were found.");
 show(mode==="job"?"Job offer check":"Message check",score,items);
});
