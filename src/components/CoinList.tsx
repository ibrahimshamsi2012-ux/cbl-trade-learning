import React from "react";
interface Coin { id: string; name: string; symbol: string }
interface CoinListProps { coins: Coin[]; onSelect: (id: string) => void }
export default function CoinList({ coins, onSelect }: CoinListProps) {
return (

<div style={{width:"250px"}}>  
<h3>Coins</h3>  
<ul>  
{coins.map(coin => (  
<li key={coin.id}>  
<button onClick={()=>onSelect(coin.id)}>{coin.name} ({coin.symbol})</button>  
</li>))}  
</ul>  
</div>  
);  
}  
