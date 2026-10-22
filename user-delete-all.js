(()=>{
  'use strict';

  const DB_NAME='solarwatch_iphone_field_v1';
  const STORE='sessions';
  const $=id=>document.getElementById(id);

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function clearAllSessions(){
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||new Error('削除処理が中断されました'));
    });
    db.close();
  }

  function updateEmptyUi(){
    const count=$('userSavedCount');
    const share=$('userShareAllBtn');
    const list=$('userSavedList');
    if(count) count.textContent='保存 0件';
    if(share) share.disabled=true;
    if(list){
      list.replaceChildren();
      const empty=document.createElement('div');
      empty.className='user-empty';
      empty.textContent='保存データはありません。';
      list.appendChild(empty);
    }
  }

  function install(){
    if($('userDeleteAllBtn')) return;
    const share=$('userShareAllBtn');
    if(!share) return;

    const style=document.createElement('style');
    style.id='userDeleteAllStyle';
    style.textContent='#userDeleteAllBtn{width:100%;margin:0 0 14px;padding:12px;border-radius:12px;border:1px solid #efc7c7;background:#fff0f0;color:#9d2626;font-weight:800}';
    document.head.appendChild(style);

    const button=document.createElement('button');
    button.id='userDeleteAllBtn';
    button.type='button';
    button.textContent='保存データをすべて削除';
    share.insertAdjacentElement('afterend',button);

    button.addEventListener('click',async()=>{
      if(!confirm('保存済みの測定データをすべて削除しますか？\nこの操作は取り消せません。')) return;
      button.disabled=true;
      button.textContent='削除中…';
      try{
        await clearAllSessions();
        updateEmptyUi();
        button.textContent='保存データをすべて削除';
      }catch(err){
        console.error('failed to clear saved sessions',err);
        alert('保存データの削除に失敗しました。');
        button.textContent='保存データをすべて削除';
      }finally{
        button.disabled=false;
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
