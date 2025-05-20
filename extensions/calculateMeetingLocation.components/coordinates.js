const axios = require("axios");


// finds airline middle coordinates from two coordinates
const calculateGeographicMidpoint = (Ps) => { //! use Haversine Midpoint
    return Ps.reduce((acc, p) => {
        acc[0] += p[0];
        acc[1] += p[1];
        return acc;
    }, [0, 0]).map(coord => coord / Ps.length);
}


// converts address to coordinates
const getCoordinatesFromAddress = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    
    try {
        const response = await axios.get(url);
        if (response.data.length > 1) {
            console.warn(`Multiple results found for address: \"${address}\". Using the first result.`);
        }
        if (response.data.length > 0) {
            return [parseFloat(response.data[0].lon), parseFloat(response.data[0].lat)];
        } else {
            console.error("No results found for address:", address);
            return null;
        }
    } catch (error) {
        console.error("Error fetching coordinates:", error.message);
        return null;
    }
}


// converts one place to coordinates
const extractCoordinatesFromPlace = (place) => {
    if (place.lon == undefined || place.lat == undefined) {
        return [place.center.lon, place.center.lat];
    }
    return [place.lon, place.lat];
};


// converts multiple places to coordinates
const extractCoordinatesFromPlaces = (places) => {
    return places.map(extractCoordinatesFromPlace);
};


module.exports = { calculateGeographicMidpoint, getCoordinatesFromAddress, extractCoordinatesFromPlaces }