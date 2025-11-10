import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

let testnetWallet = { "demo_user": { balance: 100000 } };
let testnetCoins = [{ id: "test-cbl", name: "Test CBL", symbol: "TCBL", price: 1 }];
let testnetHistory: Record<string, { time: string; price: number }[]> = { "test-cbl": [{ time: "0", price: 1 }] };

app.get("/testnet/coins", (req: Request, res: Response) => res.json(testnetCoins));
app.get("/testnet/wallet/demo_user", (req: Request, res: Response) => res.json({ wallet: testnetWallet.demo_user }));
app.get("/testnet/market_chart/:coin", (req: Request, res: Response) => {
    const points = parseInt(req.query.points as string) || 24;
    res.json(testnetHistory[req.params.coin] || []);
});
app.post("/testnet/trade", (req: Request, res: Response) => {
    const { coin, type, amount }: { coin: string; type: "BUY" | "SELL"; amount: number } = req.body;
    if (type === "BUY") testnetWallet.demo_user.balance += amount;
    else if (type === "SELL") testnetWallet.demo_user.balance -= amount;

    if (!testnetHistory[coin]) testnetHistory[coin] = [];
    testnetHistory[coin].push({ time: Date.now().toString(), price: testnetCoins[0].price });
    res.json({ wallet: testnetWallet.demo_user });
});

app.post("/ai/query", (req: Request, res: Response) => {
    res.json({ reply: "This is a placeholder AI response." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server listening on port", PORT));
