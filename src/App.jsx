import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, setDoc, updateDoc } from 'firebase/firestore';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Global Firebase variables (provided by the environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const App = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const [priceData, setPriceData] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [balance, setBalance] = useState(10000);
    const [shares, setShares] = useState(0);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    
    // NOTE: The chat state and logic have been removed to fix the monkedev API issue.

    // Get the base URL from the environment (VITE_APP_API_BASE_URL). 
    // Using process.env as a fallback to resolve the ES2015 compiler warning.
    const API_BASE_URL = process.env.VITE_APP_API_BASE_URL || import.meta.env.VITE_APP_API_BASE_URL;

    // --- Firebase Initialization and Authentication ---
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);
            
            setDb(firestore);
            setAuth(firebaseAuth);

            const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        setUserId(firebaseAuth.currentUser.uid);
                    } else {
                        await signInAnonymously(firebaseAuth);
                        setUserId(firebaseAuth.currentUser.uid);
                    }
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            setError("Failed to initialize Firebase services.");
        }
    }, []);
    
    // --- Firestore Snapshot Listener for Trading State ---
    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;

        // Path: /artifacts/{appId}/users/{userId}/trading_state/current_state
        const userStatePath = `artifacts/${appId}/users/${userId}/trading_state`;
        const stateDocRef = doc(db, userStatePath, 'current_state');
        
        const unsubscribe = onSnapshot(stateDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBalance(data.balance || 10000);
                setShares(data.shares || 0);
            } else {
                // Initialize default state if document doesn't exist
                setDoc(stateDocRef, { balance: 10000, shares: 0, userId: userId });
            }
        }, (err) => {
            console.error("Error fetching trading state:", err);
            setError("Could not retrieve trading state.");
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, db]);
    
    // --- Data Fetching and AI Grounding ---
    useEffect(() => {
        if (!API_BASE_URL) {
            console.error("VITE_APP_API_BASE_URL is not defined in the environment.");
            setError("Configuration Error: API base URL not set.");
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            try {
                // 1. Fetch Price Data
                const priceResponse = await axios.get(`${API_BASE_URL}/price`);
                const prices = priceResponse.data.price_history || [];
                setPriceData(prices);
                setCurrentPrice(prices.length > 0 ? prices[prices.length - 1].price : 0);
                
                // 2. Fetch AI Recommendations
                const aiResponse = await axios.get(`${API_BASE_URL}/ai-recommendation`);
                setAiRecommendations(aiResponse.data.recommendations || []);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to connect to the simulated trading API.");
            } finally {
                setLoading(false);
            }
        };

        // Poll every 5 seconds to simulate real-time updates
        fetchAllData();
        const intervalId = setInterval(fetchAllData, 5000);
        return () => clearInterval(intervalId);
    }, [API_BASE_URL]);

    // --- Trading Logic ---
    const handleTrade = useCallback(async (type) => {
        if (!isAuthReady || !userId || !db || loading || currentPrice <= 0) return;

        const amount = 1000; // Fixed amount for simplified trading
        let newBalance = balance;
        let newShares = shares;
        let success = false;
        
        if (type === 'BUY' && balance >= amount) {
            const sharesToBuy = amount / currentPrice;
            newBalance -= amount;
            newShares += sharesToBuy;
            success = true;
            setMessage(`Bought ${sharesToBuy.toFixed(2)} shares for $${amount}.`);
        } else if (type === 'SELL' && shares > 0) {
            const sharesToSell = shares * 0.5; // Sell 50% of holdings
            const proceeds = sharesToSell * currentPrice;
            newBalance += proceeds;
            newShares -= sharesToSell;
            success = true;
            setMessage(`Sold ${sharesToSell.toFixed(2)} shares for $${proceeds.toFixed(2)}.`);
        } else if (type === 'SELL') {
            setMessage("Not enough shares to sell.");
        } else {
            setMessage("Not enough balance to buy.");
        }
        
        if (success) {
            const userStatePath = `artifacts/${appId}/users/${userId}/trading_state`;
            const stateDocRef = doc(db, userStatePath, 'current_state');
            
            await updateDoc(stateDocRef, {
                balance: newBalance,
                shares: newShares,
            });
            setBalance(newBalance);
            setShares(newShares);
        }
    }, [balance, shares, currentPrice, isAuthReady, userId, db, loading, appId]);

    // --- Rendering Logic ---
    if (loading && !error) {
        return <div className="flex items-center justify-center h-screen bg-gray-50">
            <p className="text-xl text-indigo-600">Loading initial simulator data...</p>
        </div>;
    }

    if (error) {
        return <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 p-8">
            <h1 className="text-2xl font-bold mb-4">Application Error</h1>
            <p className="text-center">{error}</p>
            <p className="mt-4 text-sm">Please check your Vercel Environment Variables: VITE_APP_API_BASE_URL and Firebase configuration.</p>
        </div>;
    }

    const chartData = {
        labels: priceData.map((d, i) => i),
        datasets: [
            {
                label: 'Simulated Price',
                data: priceData.map(d => d.price),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.1,
                pointRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Simulated Asset Price History', font: { size: 16 } },
            tooltip: { callbacks: { label: (context) => `Price: $${context.parsed.y.toFixed(2)}` } }
        },
        scales: {
            x: { display: false },
            y: { beginAtZero: false }
        }
    };
    
    const portfolioValue = balance + (shares * currentPrice);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-inter">
            <script src="https://cdn.tailwindcss.com"></script>
            <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6 border-b pb-2">
                CBL Trade Learning Simulator
            </h1>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- Left Column: Portfolio & Trading --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Portfolio Summary</h2>
                        <div className="space-y-3">
                            <p className="flex justify-between text-lg">
                                <span className="text-gray-500">Total Value:</span>
                                <span className="font-bold text-indigo-600">${portfolioValue.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-500">Cash Balance:</span>
                                <span className="font-medium">${balance.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-500">Shares Held:</span>
                                <span className="font-medium">{shares.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between text-xl pt-2 border-t mt-3">
                                <span className="text-gray-500">Current Price:</span>
                                <span className="font-extrabold text-green-600">${currentPrice.toFixed(2)}</span>
                            </p>
                        </div>
                        {userId && (
                            <div className="mt-4 pt-4 border-t text-xs text-gray-500 break-all">
                                User ID: {userId}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Trading Actions (Buy/Sell $1000)</h2>
                        {message && (
                            <p className={`p-2 rounded mb-3 text-sm font-medium ${message.includes("Bought") || message.includes("Sold") ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {message}
                            </p>
                        )}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleTrade('BUY')}
                                className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition duration-150 shadow-md hover:shadow-lg disabled:opacity-50"
                                disabled={loading || balance < 1000}
                            >
                                Buy ($1000)
                            </button>
                            <button
                                onClick={() => handleTrade('SELL')}
                                className="flex-1 bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition duration-150 shadow-md hover:shadow-lg disabled:opacity-50"
                                disabled={loading || shares === 0}
                            >
                                Sell (50% Holdings)
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Middle Column: Chart & AI Recommendations --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-96">
                        <Line options={chartOptions} data={chartData} />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm3-3a1 1 0 00-1 1v1a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            AI Grounded Recommendations
                        </h2>
                        <ul className="space-y-3">
                            {aiRecommendations.length > 0 ? (
                                aiRecommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start text-sm bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
                                        <span className="font-bold mr-2 text-indigo-700">{index + 1}.</span>
                                        <p className="text-gray-700">{rec}</p>
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No current AI recommendations available.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
