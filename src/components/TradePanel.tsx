import React, { useState } from "react";
interface TradePanelProps { coin: string; onTrade: (type: "BUY"|"SELL", amount: number) => void }
export default function TradePanel({ coin, onTrade }: TradePanelProps) {
const [amount, setAmount] = useState(0);
return (

<div>  
<h4>Trade {coin}</h4>  
<input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))}/>  
<button onClick={()=>onTrade("BUY",amount)}>Buy</button>  
<button onClick={()=>onTrade("SELL",amount)}>Sell</button>  
</div>  
);  
}  
