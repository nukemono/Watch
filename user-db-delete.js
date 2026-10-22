(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDBを開けませんでした'));
      req.onblocked=()=>reject(new Error('IndexedDBが他の処理で使用中です'));
    });
  }

  async function getAll(){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error||tx.error);
        tx.onabort=()=>reject(tx.error||new Error('読み込みが中断されました'));
      });
    }finally{db.close();}
  }

  function waitTx(tx,ms=1800){
    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=fn=>value=>{if(done)return;done=true;clearTimeout(timer);fn(value)};
      const timer=setTimeout(finish(reject),ms,new Error('IndexedDB削除の完了待ちがタイムアウトしました'));
      tx.oncomplete=finish(resolve);
      tx.onerror=finish(reject);
      tx.onabort=finish(reject);
    });
  }

  async function mutate(kind,id){
    const db=await openDb();
    try{
      const tx=db.transaction(STORE,'readwrite');
      const store=tx.objectStore(STORE);
      const req=kind==='clear'?store.clear():store.delete(id);
      await new Promise((resolve,reject)=>{
        req.onsuccess=()=>resolve();
        req.onerror=()=>reject(req.error||tx.error||new Error('削除要求に失敗しました'));
      });
      try{await waitTx(tx);}catch(e){console.warn(e);}
    }finally{db.close();}
  }

  async function verifyOne(id){return !(await getAll()).some(row=>row&&row.session_id===id)}
  async function verifyEmpty(){return (await getAll()).length===0}

  async function deleteOne(id){
    for(let attempt=0;attempt<2;attempt++){
      await mutate('delete',id);
      if(await verifyOne(id))return true;
    }
    return false;
  }

  async function clearAll(){
    for(let attempt=0;attempt<2;attempt++){
      await mutate('clear');
      if(await verifyEmpty())return true;
    }
    return false;
  }

  async function sessionIdFromCard(card){
    if(!card)return null;
    if(card.dataset.sessionId)return card.dataset.sessionId;

    const pre=card.querySelector('pre.user-log');
    if(pre){
      try{const data=JSON.parse(pre.textContent);if(data?.session_id)return data.session_id;}catch{}
    }

    const displayed=(card.querySelector('.user-session-title')?.textContent||'').trim();
    if(!displayed)return null;
    const rows=await getAll();
    const matches=rows.filter(row=>{
      const d=row?.created_at?new Date(row.created_at):null;
      return d&&!Number.isNaN(d.getTime())&&d.toLocaleString('ja-JP')===displayed;
    });
    return matches.length===1?matches[0].session_id:null;
  }

  function setEmptyUi(){
    const count=$('userSavedCount'),share=$('userShareAllBtn'),list=$('userSavedList');
    if(count)count.textContent='保存 0件';
    if(share)share.disabled=true;
    if(list){
      list.replaceChildren();
      const empty=document.createElement('div');
      empty.className='user-empty';empty.textContent='保存データはありません。';list.appendChild(empty);
    }
  }

  async function refreshList(){
    const rows=await getAll();
    const count=$('userSavedCount');if(count)count.textContent='保存 '+rows.length+'件';
    if(!rows.length)setEmptyUi();
  }

  document.addEventListener('click',async event=>{
    const allBtn=event.target?.closest?.('#userDeleteAllBtn');
    if(allBtn){
      event.preventDefault();event.stopImmediatePropagation();
      if(!confirm('保存済みの測定データをすべて削除しますか？\nこの操作は取り消せません。'))return;
      allBtn.disabled=true;allBtn.textContent='削除中…';
      try{
        if(!await clearAll())throw new Error('削除後もデータが残っています');
        setEmptyUi();
      }catch(err){
        console.error('clear all failed',err);
        alert('保存データを削除できませんでした。ページを開き直して再度お試しください。');
      }finally{
        allBtn.disabled=false;allBtn.textContent='保存データをすべて削除';
      }
      return;
    }

    const oneBtn=event.target?.closest?.('.user-session-actions .delete');
    if(oneBtn){
      event.preventDefault();event.stopImmediatePropagation();
      const card=oneBtn.closest('.user-session');
      const id=await sessionIdFromCard(card);
      if(!id){alert('削除対象のデータIDを取得できませんでした。');return;}
      if(!confirm('この測定データを削除しますか？\n削除すると元に戻せません。'))return;
      oneBtn.disabled=true;oneBtn.textContent='削除中…';
      try{
        if(!await deleteOne(id))throw new Error('削除後も対象データが残っています');
        card?.remove();
        await refreshList();
      }catch(err){
        console.error('delete one failed',err);
        alert('この保存データを削除できませんでした。ページを開き直して再度お試しください。');
        oneBtn.disabled=false;oneBtn.textContent='1件削除';
      }
    }
  },true);
})();
