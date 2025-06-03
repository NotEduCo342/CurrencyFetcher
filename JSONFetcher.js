// NotEduCo342 - Json fetcher using axios
const axios = require('axios');

// API Key Navasan inja jaygozari shod.
const API_KEY = 'free4ytAE8muSkoKbKBpNMy4CjtSJgDL'; 

// Endpointe navasan dar inja jaygozari shod.
// Array ey ke gheymat haro dakhel khoodesh negah midare
const API_URL = 'http://api.navasan.tech/latest/';

// List Arz hayy ke gharare az Navasan Fetch beshan. (Array)
const ITEMS_TO_FETCH = [
    'dolar_solymanieh',  // دلار سلیمانیه
    'dirham_dubai',     // درهم دوبی
    'geram_18_ayyar',   // گرم طلای 18 عیار
    'dolar_kordestan'   // دلار کردستان
];


// Await : Montazer tamam shodan request bemoon che fail beshe che success
// async function
async function fetchNavasanData() {
    try {
        const response = await axios.get(API_URL, {
            params: {
                api_key: API_KEY
            }
        });

        const allData = response.data;
        const extractedData = {};

        // Be Dakhel value har item boro va etelaat json eshon ro fetch kon.
        ITEMS_TO_FETCH.forEach(item => {
            if (allData[item]) {
                extractedData[item] = {
                    value: parseFloat(allData[item].value), // Tabdil on value be number
                    change: parseFloat(allData[item].change), // Tabdil Change on arz be number
                    timestamp: allData[item].timestamp,
                    date: allData[item].date
                };
            } else {
                console.warn(`Data '${item}' Dakhel API Peyda nashod!`);
                extractedData[item] = null;
            }
        });

        console.log("Dataye Fetch shode:");
        console.log(JSON.stringify(extractedData, null, 2)); // Khoshgel kardan value json daryaft shode

        return extractedData; // Return kardan value ha
    } catch (error) {
        // Error handling =======>
        if (error.response) {
            // Request anjam shod vali server maro ba yek error value movajeh kard!
            // Request az mahdode 2xx kharej shod!
            console.error(`Error fetching data: ${error.response.status}`);
            console.error('Response Data:', error.response.data);
        } else if (error.request) {
            // Request Anjam shod vali Server javaby nadad. (Timeout)
            console.error('Error fetching data : Server returned nothing (Timeout)');
            console.error(error.request);
        } else {
            // Fatal error yek chiz mohem dar setting baes ejad in error shod.
            console.error('Error:', error.message);
        }
        return null; // Return kardan fail shodan request (Neshan dadan fail)
    }
}

// Call kardan function baraye Return kardan dataye fetch shode.
fetchNavasanData();