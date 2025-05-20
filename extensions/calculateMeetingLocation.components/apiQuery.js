const axios = require("axios");

const {
    extractCoordinatesFromPlaces
} = require('./coordinates');




// finds airline nearby places with radius in meters and location as coordinates AS PLACE FORMAT
const queryNearbyAmenities = async ([lon, lat], radius) => {
    //! CHECK THIS
    const query = `
    [out:json];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      node["amenity"="restaurant"](around:${radius},${lat},${lon});
      way["amenity"="cafe"](around:${radius},${lat},${lon});
      way["amenity"="restaurant"](around:${radius},${lat},${lon});
      relation["amenity"="cafe"](around:${radius},${lat},${lon});
      relation["amenity"="restaurant"](around:${radius},${lat},${lon});
    );
    out center;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    try {
        const response = await axios.post(url, query, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const elements = response.data.elements;
        return elements;
    } catch (error) {
        console.error("Error fetching OSM data:", error.message);
        return null;
    }
};


// find airline nearby coordinates with radius in meters and location as coordinates AS COORDINATES FORMAT
const getNearbyAmenityCoordinates = async ([lon, lat], radius) => {
    const places = await queryNearbyAmenities([lon, lat], radius);
    if (!places) {
        console.error("No place given. Can't extract coordinates.");
        return null;
    }
    return extractCoordinatesFromPlaces(places);
}
    



module.exports = { getNearbyAmenityCoordinates };