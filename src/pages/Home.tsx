import React, { useState, useEffect } from "react";
import CoinList from "../components/CoinList";
import ChartWithIndicators from "../components/ChartWithIndicators";
import TradePanel from "../components/TradePanel";
import axios from "axios";

interface Coin { id: string; name: string; symbol: string }

export default function Home() {
const [testnetCoins, setTestnetCoins] = useState<Coin[]>([]);
const [liveCoins, setLiveCoins] = useState<Coin[]>([]);
const [selected, setSelected] = useState<string|null>(null);
const [wallet, setWallet] = useState<any>({});
const [liveSelected, setLiveSelected] = useState(false);

useEffect(()=>{
axios.get("[http://localhost:3001/testnet/coins").then(r=>setTestnetCoins(r.data)](http://localhost:3001/testnet/coins%22%29.then%28r=>setTestnetCoins%28r.data%29));
axios.get("[https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false](https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false)")
.then(r=>setLiveCoins(r.data.map((c:any)=>({id:c.id, name:c.name, symbol:c.symbol}))));
},[]);

const handleSelect = (coin:string, isLive=false)=>{ setSelected(coin); setLiveSelected(isLive); }
const handleTrade = async (type:"BUY"|"SELL", amount:number)=>{
if(!selected || liveSelected) return;
try {
const res = await axios.post("[http://localhost:3001/testnet/trade](http://localhost:3001/testnet/trade)", { coin:selected, type, amount });
setWallet(res.data.wallet);
} catch(err){ console.error(err); }
};

return (

<div style={{display:"flex", gap:"50px"}}>  
<div>  
<h2>Testnet Coins</h2>  
<CoinList coins={testnetCoins} onSelect={c=>handleSelect(c,false)}/>  
<h2>Live Coins (Demo Only)</h2>  
<CoinList coins={liveCoins} onSelect={c=>handleSelect(c,true)}/>  
</div>  
<div>  
{selected && <ChartWithIndicators coin={selected} live={liveSelected}/>}  
{!liveSelected && selected && <TradePanel coin={selected} onTrade={handleTrade}/>}  
<h4>Wallet:</h4>  
<pre>{JSON.stringify(wallet,null,2)}</pre>  
</div>  
</div>  
);  
}  
