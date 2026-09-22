const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const STATE = path.join(ROOT, "data", "state.json");

function readState(){
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); }
  catch(e){ return {child:{name:"Лада",age:10,grade:4},stats:{},topics:{},history:[]}; }
}
function writeState(s){ fs.writeFileSync(STATE, JSON.stringify(s,null,2), "utf8"); }

const lesson = {
  id:"have-has",
  title:"Secret Library: have / has",
  intro:"Сегодня мы научимся выбирать have или has и объяснять, почему.",
  story:"В секретной библиотеке потерялась карта. На ней написано: Lada has a map. I have a book.",
  tasks:[
    {q:"Lada ___ a book.", options:["have","has"], answer:"has", hint1:"Lada = she.", hint2:"С he / she / it обычно используем has."},
    {q:"I ___ a football.", options:["have","has"], answer:"have", hint1:"I — особое местоимение.", hint2:"С I используем have."},
    {q:"Harry Potter ___ a wand.", options:["have","has"], answer:"has", hint1:"Harry Potter = he.", hint2:"He / she / it → has."},
    {q:"We ___ Minecraft.", options:["have","has"], answer:"have", hint1:"We = мы.", hint2:"I / you / we / they → have."}
  ]
};

function send(res, code, data, type="application/json"){
  res.writeHead(code, {"Content-Type": type, "Cache-Control":"no-store"});
  res.end(type==="application/json" ? JSON.stringify(data) : data);
}
async function body(req){
  return new Promise((resolve,reject)=>{
    let b=""; req.on("data",c=>b+=c); req.on("end",()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}})
  });
}
async function aiReply(messages){
  if(!process.env.OPENAI_API_KEY) return fallback(messages.at(-1)?.content || "");
  const model = process.env.OPENAI_MODEL || "gpt-5.6-mini";
  const system = `Ты персональный репетитор английского для Лады, 10 лет, 4 класс.
Объясняй по-русски, английские примеры оставляй на английском.
Уровень начальный/начальный A1-A2. Цель — школьный английский.
Используй короткие понятные шаги. Не давай ответ сразу после ошибки:
сначала задай наводящий вопрос, затем подсказку, затем пример.
Не перегружай. Поддерживай интересы: Minecraft, Roblox, Harry Potter, футбол, Cristiano Ronaldo, Smeshariki.
Не используй TikTok как самостоятельную учебную среду.`;
  const r=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.OPENAI_API_KEY},
    body:JSON.stringify({model,messages:[{role:"system",content:system},...messages],temperature:.5,max_tokens:500})
  });
  if(!r.ok) throw new Error("AI API error");
  const j=await r.json(); return j.choices?.[0]?.message?.content || "Попробуй сформулировать вопрос ещё раз.";
}
function fallback(q){
  const s=q.toLowerCase();
  if(s.includes("has")||s.includes("have")) return "Давай разберёмся: кто выполняет действие? Если это I/you/we/they — чаще всего have. Если he/she/it — has. Попробуй составить свой пример.";
  if(s.includes("read")||s.includes("чита")) return "Прочитай предложение медленно по словам. Сначала поймём смысл, потом проверим трудные слова. Напиши предложение, которое вызывает трудность.";
  if(s.includes("pron")||s.includes("произнош")) return "Нажми «Слушать», затем произнеси слово в микрофон. В MVP проверка сравнивает распознанное слово с целью, поэтому результат зависит от микрофона и браузера.";
  return "Я готов помочь. Напиши английское слово или предложение, которое сейчас разбираем.";
}

const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,`http://${req.headers.host}`);
    if(req.method==="GET" && u.pathname==="/api/state") return send(res,200,readState());
    if(req.method==="GET" && u.pathname==="/api/lesson") return send(res,200,lesson);
    if(req.method==="POST" && u.pathname==="/api/progress"){
      const data=await body(req), s=readState();
      if(data.taskCompleted) s.stats.tasks=(s.stats.tasks||0)+1;
      if(typeof data.independent==="number") s.stats.independent=Math.round((s.stats.independent+data.independent)/2);
      if(data.topic && typeof data.score==="number") s.topics[data.topic]={score:data.score,status:data.score>=80?"strong":data.score>=60?"progress":"review"};
      if(data.session) { s.stats.sessions++; s.stats.minutes+=(data.minutes||30); s.history.unshift({date:new Date().toISOString().slice(0,10),topic:data.topic||"Практика",score:data.score||0,minutes:data.minutes||30}); s.history=s.history.slice(0,20); }
      writeState(s); return send(res,200,s);
    }
    if(req.method==="POST" && u.pathname==="/api/tutor"){
      const data=await body(req); const reply=await aiReply(data.messages||[]); return send(res,200,{reply,liveAI:!!process.env.OPENAI_API_KEY});
    }
    if(req.method==="POST" && u.pathname==="/api/reset"){
      const s=readState(); s.stats={sessions:0,minutes:0,tasks:0,independent:0,xp:0}; s.history=[]; writeState(s); return send(res,200,s);
    }
    let file=u.pathname==="/" ? "/index.html" : u.pathname;
    const full=path.normalize(path.join(ROOT,"public",file));
    if(!full.startsWith(path.join(ROOT,"public"))) return send(res,403,{error:"Forbidden"});
    if(fs.existsSync(full) && fs.statSync(full).isFile()){
      const ext=path.extname(full); const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};
      return send(res,200,fs.readFileSync(full),types[ext]||"application/octet-stream");
    }
    return send(res,404,{error:"Not found"});
  }catch(e){ console.error(e); send(res,500,{error:e.message}); }
});
server.listen(PORT,()=>console.log(`Lada English Quest: http://localhost:${PORT}`));
