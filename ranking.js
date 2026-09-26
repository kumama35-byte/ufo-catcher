(()=>{
  "use strict";
  const config=window.UFO_RANKING_CONFIG||{},connected=/^https:\/\/.+\.supabase\.co$/.test(config.supabaseUrl)&&config.supabaseAnonKey.length>20;
  const els=Object.fromEntries(["game","rankingToggle","seToggle","rankingDialog","rankingClose","rankingStatus","rankingList","rankingEdit","rankingName","rankingNameSave","rankingNameError","rankingNotice"].map(id=>[id,document.getElementById(id)]));
  const ngWords=["死ね","ころす","殺す","ばか","バカ","アホ","くそ","クソ","fuck","shit","sex","admin","運営"];
  let ownId=localStorage.getItem("ufoRankingEntryId")||"",editToken=localStorage.getItem("ufoRankingEditToken")||"",qualified=Boolean(ownId&&editToken),loading=false;
  const headers=()=>({apikey:config.supabaseAnonKey,Authorization:`Bearer ${config.supabaseAnonKey}`,"Content-Type":"application/json"});
  const api=async(path,options={})=>{const response=await fetch(`${config.supabaseUrl}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).message||`HTTP ${response.status}`);return response.status===204?null:response.json()};
  const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const formatDate=value=>new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
  function sanitizeName(value){return value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>\u0026"']/g,"").replace(/\s+/g," ").trim()}
  function validateName(value){const name=sanitizeName(value);if(!name)return{error:"名前を入力してください"};if(name.length>10)return{error:"名前は10文字以内です"};if(!/^[\p{L}\p{N}ー＿_・\- ]+$/u.test(name))return{error:"使用できない記号が含まれています"};if(ngWords.some(word=>name.toLowerCase().includes(word.toLowerCase())))return{error:"使用できない言葉が含まれています"};return{name}}
  async function loadRanking(){
    if(!connected){els.rankingStatus.textContent="Supabaseの接続情報を設定するとオンラインランキングが有効になります。";els.rankingList.innerHTML="";return}
    els.rankingStatus.textContent="ランキングを読み込み中…";els.rankingList.innerHTML="";
    try{const rows=await api("ufo_rankings?select=id,player_name,score,catches,registered_at&order=score.desc,catches.desc,registered_at.asc&limit=30"),canEdit=qualified&&els.game.classList.contains("ending-mode");if(!canEdit)els.rankingEdit.hidden=true;els.rankingStatus.textContent=rows.length?"":"まだ登録がありません";els.rankingList.innerHTML=rows.map((row,index)=>`<li class="${row.id===ownId?"is-player":""}"><b>${index+1}</b><span class="rank-name">${escapeHtml(row.player_name)}${row.id===ownId&&canEdit?'<button class="rank-edit-button" type="button" aria-label="名前を編集">✎</button>':""}</span><strong>${Number(row.score).toLocaleString("ja-JP")}</strong><span>${Number(row.catches)}体</span><time>${formatDate(row.registered_at)}</time></li>`).join("");els.rankingList.querySelector(".rank-edit-button")?.addEventListener("click",()=>{els.rankingEdit.hidden=false;els.rankingName.value=els.rankingList.querySelector(".is-player .rank-name")?.firstChild?.textContent||"ゲストさん";els.rankingName.focus()})}catch(error){els.rankingStatus.textContent="ランキングを取得できませんでした。接続設定をご確認ください。";console.error(error)}
  }
  async function submitScore(detail){
    els.rankingNotice.textContent="";qualified=false;ownId="";els.game.classList.remove("ranking-qualified");if(detail.debug||!connected)return;
    editToken=crypto.randomUUID();localStorage.setItem("ufoRankingEditToken",editToken);
    try{const result=await api("rpc/submit_ufo_score",{method:"POST",body:JSON.stringify({p_score:Math.max(0,Math.trunc(detail.score)),p_catches:Math.max(0,Math.trunc(detail.catches)),p_edit_token:editToken})}),row=Array.isArray(result)?result[0]:result;if(row?.qualified){qualified=true;ownId=row.entry_id;localStorage.setItem("ufoRankingEntryId",ownId);els.rankingNotice.textContent="ランキングに登録されました！";els.game.classList.add("ranking-qualified")}else{editToken="";localStorage.removeItem("ufoRankingEditToken");localStorage.removeItem("ufoRankingEntryId")}await loadRanking()}catch(error){console.error(error)}
  }
  async function saveName(){const checked=validateName(els.rankingName.value);if(checked.error){els.rankingNameError.textContent=checked.error;return}els.rankingNameError.textContent="";els.rankingNameSave.disabled=true;try{await api("rpc/rename_ufo_score",{method:"POST",body:JSON.stringify({p_entry_id:ownId,p_edit_token:editToken,p_player_name:checked.name})});els.rankingEdit.hidden=true;await loadRanking()}catch(error){els.rankingNameError.textContent="名前を更新できませんでした";console.error(error)}finally{els.rankingNameSave.disabled=false}}
  function openRanking(){els.rankingDialog.showModal();loadRanking()}
  els.rankingToggle.addEventListener("click",event=>{event.stopPropagation();openRanking()});
  els.rankingClose.addEventListener("click",()=>els.rankingDialog.close());
  els.rankingDialog.addEventListener("click",event=>{event.stopPropagation();if(event.target===els.rankingDialog){const rect=els.rankingDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)els.rankingDialog.close()}});
  els.rankingNameSave.addEventListener("click",saveName);els.rankingName.addEventListener("keydown",event=>{if(event.key==="Enter")saveName()});
  [els.rankingToggle,els.rankingDialog].forEach(element=>element.addEventListener("pointerdown",event=>event.stopPropagation()));
  window.addEventListener("ufo-ending",event=>submitScore(event.detail));
  window.addEventListener("ufo-restart",()=>{qualified=false;ownId="";editToken="";els.rankingNotice.textContent="";els.game.classList.remove("ranking-qualified");els.rankingDialog.close()});
})();
