import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// Import Chart.js components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
// Firebase Imports
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
    // State for Firebase instances and user ID
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    
    // State for application data (from your original snippet)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tradeData, setTradeData] = useState([]);
    const [portfolioValue, setPortfolioValue] = useState(0);

    // --- CRITICAL FIX 1: Initialize Firebase and Authenticate ---
    useEffect(() => {
        // Only run initialization once
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase configuration is missing. Cannot initialize services.");
            setLoading(false);
            return;
        }

        try {
            // 1. Initialize App and Firestore
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            setDb(firestore);

            // 2. Initialize Auth
            const authService = getAuth(app);
            setAuth(authService);

            // 3. Sign In (using custom token or anonymously)
            const signInUser = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authService, initialAuthToken);
                    } else {
                        await signInAnonymously(authService);
                    }
                    // Auth state listener handles setting userId
                } catch (e) {
                    console.error("Firebase Sign-in Failed:", e);
                    setError("Could not sign in to user services.");
                }
            };
            
            signInUser();

            // 4. Set up Auth State Listener
            const unsubscribeAuth = authService.onAuthStateChanged(user => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null); // User is signed out or waiting
                }
            });

            return () => unsubscribeAuth(); // Cleanup listener

        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setError("Failed to initialize Firebase services.");
            setLoading(false);
        }
    }, []);

    // --- CRITICAL FIX 2: Data Fetching and Real-Time Listener ---
    // This hook runs once Firebase is initialized and we have a userId
    useEffect(() => {
        if (!db || !userId) return; // Wait until services and user ID are ready

        // Define the path for the user's private data
        // MUST use the correct path format: /artifacts/{appId}/users/{userId}/{collectionName}
        const userTradesPath = `artifacts/${appId}/users/${userId}/trades`;
        const q = query(collection(db, userTradesPath));

        // Set up real-time listener for trades
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const trades = [];
            querySnapshot.forEach((doc) => {
                trades.push({ id: doc.id, ...doc.data() });
            });
            setTradeData(trades);
            setLoading(false);
            
            // Example calculation (replace with your real logic)
            const calculatedValue = trades.reduce((sum, trade) => sum + trade.value || 0, 0);
            setPortfolioValue(calculatedValue);

        }, (err) => {
            console.error("Firestore error:", err);
            setError("Failed to fetch real-time trade data.");
            setLoading(false);
        });

        // Cleanup listener when component unmounts or dependencies change
        return () => unsubscribe();
    }, [db, userId]); // Dependencies ensure this runs only when db and userId are available

    // --- Placeholder for your external API fetching (if needed) ---
    const fetchMarketData = useCallback(async () => {
        // Placeholder logic for your original fetchAllData
        // If you were using external APIs, the code would go here
        console.log("Fetching market data... (Requires full App logic)");
    }, []);

    // --- Render Logic ---
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading trade data...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center bg-red-800 text-white">Error: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-indigo-400">Trade Learning Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">User ID: <span className="font-mono text-indigo-300">{userId || 'N/A'}</span></p>
                <p className="text-xl text-green-400 mt-2">Current Portfolio Value: ${portfolioValue.toFixed(2)}</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart placeholder */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Portfolio Performance</h2>
                    {/* Placeholder for chart component */}
                    <div className="text-center py-10 text-gray-400">
                        <p>Chart data placeholder.</p>
                    </div>
                </div>

                {/* Trade History Placeholder */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg overflow-y-auto max-h-[600px]">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Recent Trades ({tradeData.length})</h2>
                    <ul className="space-y-3">
                        {tradeData.length > 0 ? (
                            tradeData.map((trade) => (
                                <li key={trade.id} className="p-3 bg-gray-700 rounded-lg text-sm">
                                    <div className="font-bold text-indigo-300">{trade.symbol || 'N/A'}</div>
                                    <div className="text-gray-400">Value: ${trade.value ? trade.value.toFixed(2) : '0.00'}</div>
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500">No trades found. Start adding data to Firestore!</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default App;
