<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111827">
<link rel="manifest" href="./manifest.webmanifest">
<title>Lada English Quest</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f4f6fa;color:#172033}
header{background:#111827;color:white;padding:18px}
h1{margin:0;font-size:23px}
main{max-width:700px;margin:auto;padding:15px 15px 90px}
.card{background:white;border-radius:18px;padding:18px;margin:12px 0;box-shadow:0 2px 10px #0001}
h2{margin-top:0}
button{border:0;border-radius:12px;padding:13px 17px;margin:5px;font-size:16px;font-weight:bold;background:#111827;color:white}
.answers{display:grid;gap:8px}
.answers button{width:100%;text-align:left;background:#e8edff;color:#172033}
.feedback{min-height:30px;margin-top:12px;font-weight:bold}
nav{position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #ddd;display:flex}
nav button{flex:1;background:white;color:#333;border-radius:0;margin:0}
.hidden{display:none}
.stat{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee}
.progress{height:8px;background:#ddd;border-radius:10px}
.bar{height:100%;background:#111827;width:0;border-radius:10px}
.word{text-align:center;font-size:36px;font-weight:bold;margin:20px}
</style>
</head>

<body>

<header>
<h1>Lada English Quest</h1>
<div>Английский через задания и приключения</div>
</header>

<main>

<section id="lesson">
<div class="card">
<h2>Миссия: Have / Has</h2>
<div class="progress"><div id="bar" class="bar"></div></div>
</div>

<div class="card" id="task"></div>
</section>

<section id="stats" class="hidden">
<div class="card">
<h2>Статистика</h2>
<div class="stat"><span>Заданий</span><b id="done">0</b></div>
<div class="stat"><span>Правильных</span><b id="correct">0</b></div>
<div class="stat"><span>Подсказок</span><b id="hints">0</b></div>
<div class="stat"><span>Попыток</span><b id="attempts">0</b></div>
</div>

<div class="card">
<h3>Рекомендация</h3>
<p id="recommendation">Продолжай заниматься.</p>
</div>
</section>

<section id="parent" class="hidden">
<div class="card">
<h2>Родителю</h2>
<p>Статистика хранится на этом телефоне.</p>
<p>Приложение работает без платного API и без подписки.</p>
</div>
</section>

</main>

<nav>
<button onclick="show('lesson')">Урок</button>
<button onclick="show('stats')">Статистика</button>
<button onclick="show('parent')">Родителю</button>
</nav>

<script>

const tasks=[
["I ___ a book.",["have","has"],0,"После I используем have."],
["She ___ a dog.",["have","has"],1,"После she используем has."],
["We ___ football.",["have","has"],0,"После we используем have."],
["Harry ___ a wand.",["have","has"],1,"Harry = he, поэтому has."],
["They ___ Minecraft.",["have","has"],0,"После they используем have."]
];

let current=0;

let stats=JSON.parse(
localStorage.getItem("ladaStats") ||
'{"done":0,"correct":0,"hints":0,"attempts":0}'
);

function save(){
localStorage.setItem("ladaStats",JSON.stringify(stats));
updateStats();
}

function updateStats(){
document.getElementById("done").textContent=stats.done;
document.getElementById("correct").textContent=stats.correct;
document.getElementById("hints").textContent=stats.hints;
document.getElementById("attempts").textContent=stats.attempts;

if(stats.hints>2)
document.getElementById("recommendation").textContent=
"Повтори правило have / has ещё раз.";
else
document.getElementById("recommendation").textContent=
"Продолжай. Старайся сначала подумать, а не угадывать.";
}

function render(){

if(current>=tasks.length){
finish();
return;
}

let t=tasks[current];

document.getElementById("bar").style.width=
(current/tasks.length*100)+"%";

document.getElementById("task").innerHTML=
"<h2>"+t[0]+"</h2>"+
'<div class="answers">'+
t[1].map((x,n)=>
'<button onclick="answer('+n+')">'+x+"</button>"
).join("")+
"</div>"+
'<div id="feedback" class="feedback"></div>'+
'<div id="tools"></div>';
}

function answer(n){

stats.attempts++;
save();

let t=tasks[current];

if(n===t[2]){

stats.correct++;
stats.done++;
save();

document.getElementById("feedback").textContent=
"Правильно! "+t[3];

document.getElementById("tools").innerHTML=
'<button onclick="next()">Дальше</button>';

}else{

document.getElementById("feedback").textContent=
"Не угадывай. Возьми подсказку.";

document.getElementById("tools").innerHTML=
'<button onclick="hint()">Подсказка</button>';
}
}

function hint(){

stats.hints++;
save();

let t=tasks[current];

document.getElementById("feedback").textContent=t[3];

document.getElementById("tools").innerHTML=
'<button onclick="render()">Попробовать ещё раз</button>';
}

function next(){
current++;
render();
}

function finish(){

document.getElementById("bar").style.width="100%";

document.getElementById("task").innerHTML=
"<h2>Миссия выполнена!</h2>"+
"<p>Теперь потренируем произношение.</p>"+
'<div class="word">three</div>'+
'<button onclick="speak()">🔊 Послушать</button>'+
'<button onclick="recognize()">🎙️ Произнести</button>'+
'<div id="speech" class="feedback"></div>'+
'<button onclick="restart()">Повторить урок</button>';
}

function restart(){
current=0;
render();
}

function speak(){

let voice=new SpeechSynthesisUtterance("three");
voice.lang="en-US";
speechSynthesis.speak(voice);
}

function recognize(){

let Recognition=
window.SpeechRecognition||
window.webkitSpeechRecognition;

if(!Recognition){

document.getElementById("speech").textContent=
"Распознавание речи не поддерживается этим браузером.";

return;
}

let r=new Recognition();

r.lang="en-US";
r.interimResults=false;

r.onresult=function(e){

let text=e.results[0][0].transcript.toLowerCase();

if(text.includes("three"))
document.getElementById("speech").textContent=
"Похоже, получилось: "+text;
else
document.getElementById("speech").textContent=
"Я услышал: "+text+". Попробуй ещё раз.";
};

r.onerror=function(){
document.getElementById("speech").textContent=
"Не удалось распознать речь. Попробуй ещё раз.";
};

r.start();
}

function show(id){

["lesson","stats","parent"].forEach(x=>{
document.getElementById(x).classList.toggle(
"hidden",x!==id);
});

updateStats();
}

updateStats();
render();

if("serviceWorker" in navigator){
navigator.serviceWorker.register("./sw.js");
}

</script>

</body>
</html>
