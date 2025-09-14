import React,{useEffect,useMemo,useRef,useState} from 'react';
import ColumnToggles from '../components/ColumnToggles';
import DataTable from '../components/DataTable';
import {transformFixture,flattenRow} from '../lib/transform';
type ApiResponse={data?:any[];error?:any};
export default function Home(){
  const [raw,setRaw] = useState<any[]>([]);
  const [error,setError] = useState<string|null>(null);
  const [lastUpdated,setLastUpdated] = useState<string>("");
  const [lastFetchMs,setLastFetchMs]=useState<number>(0);
  const [search,setSearch]=useState('');
  const [hidden,setHidden]=useState<Record<string,boolean>>({});
  const lastStart=useRef<number>(0);
  async function fetchData(){lastStart.current=Date.now();
    try{const resp=await fetch('/api/livescores',{cache:'no-store'});
      if(!resp.ok) throw new Error('Upstream '+resp.status);
      let json:ApiResponse|null=null;
      try{json=await resp.json();}catch{setError('Invalid JSON');setRaw([]);return;}
      setRaw(Array.isArray(json?.data)?json?.data:[]);setError(null);
    }catch(e:any){setError(e?.message??'Fetch failed');}
    finally{setLastFetchMs(Date.now()-lastStart.current);}}
  useEffect(()=>{fetchData();const id=setInterval(fetchData,3000);return()=>clearInterval(id);},[]);
// 🔎 Debug logging of raw API data (always)
  useEffect(()=>{
    console.log("=== RAW DATA ===", raw);
    if(raw && raw.length>0){
      console.log("=== SAMPLE FIXTURE ===", raw[0].id);
      console.log("=== TRENDS ===", raw[0].trends);
      console.log("=== STATISTICS ===", raw[0].statistics);
    }
  },[raw]);

  const rows=useMemo(()=>{return(raw??[]).map(transformFixture).map(flattenRow).filter(r=>String(r['Match']).toLowerCase().includes(search.toLowerCase()));},[raw,search]);
  const columns=useMemo(()=>(rows&&rows.length>0?Object.keys(rows[0]):[]),[rows]);
  function toggle(col:string){setHidden(h=>({...h,[col]:!h[col]}));}
  const healthy=!error&&lastFetchMs>0&&lastFetchMs<=3400;
  return(<div style={{padding:20}}>
    <div style={{marginBottom:12}}><strong>Last updated:</strong> {lastUpdated || "Loading..."}</div>
    <div style={{marginBottom:12,display:'flex',alignItems:'center'}}>
      <span style={{display:'inline-block',width:12,height:12,borderRadius:6,background:healthy?'green':'red',marginRight:8}}/>
      <strong>Live refresh:</strong> {healthy?'OK':'Error'} · last {lastFetchMs}ms
      {error&&<span style={{marginLeft:8,color:'red'}}>Error: {error}</span>}
      <input style={{marginLeft:20,padding:4}} placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
    </div>
    <ColumnToggles columns={columns} hidden={hidden} onToggle={toggle}/>
    <DataTable rows={rows} hidden={hidden}/>
  </div>);
}