const axios = require('axios');

// Replace with your actual API key from Navasan.
// You need to request this from webservice (at) navasan.net
const API_KEY = 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL'; 

// The API endpoint for fetching the latest prices
const API_URL = 'http://api.navasan.tech/latest/';

// The 'item' codes for the values you want to fetch.
// These are derived from the Navasan API documentation.
const ITEMS_TO_FETCH = [
    'btc',  // بیت کوین
    'dirham_dubai',     // درهم دوبی
    'rob',   // ربع سکه
    'nim'   // نیم سکه
];

async function fetchNavasanData() {
    console.log("DEBUG: Initiating data fetch operation...");
    console.log(`DEBUG: API Endpoint: ${API_URL}`);
    console.log(`DEBUG: Items requested: ${ITEMS_TO_FETCH.join(', ')}`);

    try {
        console.log("DEBUG: Making API request to Navasan...");
        const response = await axios.get(API_URL, {
            params: {
                api_key: API_KEY
            }
        });

        console.log("DEBUG: API response received.");
        
        // --- Debug Instance: Show the full raw API response ---
        console.log("\n--- Full Raw API Response (for verification) ---");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("----------------------------------------------\n");

        const allData = response.data;
        const extractedData = {};

        console.log("DEBUG: Processing extracted data...");
        // Iterate through the desired items and extract their values
        ITEMS_TO_FETCH.forEach(item => {
            if (allData[item]) {
                extractedData[item] = {
                    value: parseFloat(allData[item].value), // Convert value to a number
                    change: parseFloat(allData[item].change), // Convert change to a number
                    timestamp: allData[item].timestamp,
                    date: allData[item].date
                };
                // --- Console log for fetched item value ---
                console.log(`Fetched '${item}': Value = ${extractedData[item].value}, Change = ${extractedData[item].change}`);
            } else {
                console.warn(`WARNING: Data for '${item}' not found in the API response. Setting to null.`);
                extractedData[item] = null; // Or handle as an error
            }
        });

        console.log("\n--- Final Extracted Data (JSON Format) ---");
        console.log(JSON.stringify(extractedData, null, 2)); // Pretty print the JSON
        console.log("-------------------------------------------\n");
        console.log("DEBUG: Data fetch operation completed successfully.");

        return extractedData; // Return the fetched data for further use
    } catch (error) {
        console.error("DEBUG: An error occurred during data fetching.");
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`ERROR: HTTP Status ${error.response.status}`);
            console.error('ERROR: Response Data:', error.response.data);
            if (error.response.status === 401) {
                console.error("HINT: A 401 Unauthorized error usually means your API_KEY is invalid or missing.");
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('ERROR: No response received from API.');
            console.error('ERROR: Request details:', error.request);
            console.error("HINT: This could be a network issue or the API server is down.");
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('ERROR: While setting up request:', error.message);
        }
        return null; // Indicate failure
    }
}

// Call the function to fetch data
fetchNavasanData();