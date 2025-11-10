import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ChartProps { coin: string; live?: boolean }
interface ChartDataPoint { time: string; price: number }

export default function ChartWithIndicators({ coin, live=false }: ChartProps) {
const [chartData, setChartData] = useState({labels:[], datasets:[]});

useEffect(()=>{
if(live){
axios.get(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=1`)
.then(r=>{
const prices: number[][] = r.data.prices;
setChartData({
labels: prices.map(p=>new Date(p[0]).toLocaleTimeString()),
datasets:[{label:"Price", data: prices.map(p=>p[1]), borderColor:"green", fill:false}]
});
}).catch(console.error);
}else{
axios.get(`http://localhost:3001/testnet/market_chart/${coin}?points=24`)
.then(r=>{
const data: ChartDataPoint[] = r.data;
setChartData({
labels: data.map(p=>p.time),
datasets:[{label:"Price", data:data.map(p=>p.price), borderColor:"blue", fill:false}]
});
}).catch(console.error);
}
},[coin, live]);

return <Line data={chartData} />;
}
