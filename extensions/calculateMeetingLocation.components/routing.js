const axios = require("axios");

const APIKEY_OPENROUTESERVICE_DEMO = "5b3ce3597851110001cf62484115fa023ecf4b82848b44754a356cc9";
// move to env vars


const fetchRouteMatrix = async (P0s, Ps, profile = "driving-car", metrics = ["distance"]) => {
    const requestBody = {
        locations: [...P0s, ...Ps],
        destinations: Array.from({ length: Ps.length }, (_, i) => P0s.length + i),
        metrics: metrics,
        sources: Array.from({ length: P0s.length }, (_, i) => i)
    };

    try {
        const t = await axios.post(
            `https://api.openrouteservice.org/v2/matrix/${profile}`,
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                    "Authorization": APIKEY_OPENROUTESERVICE_DEMO
                }
            }
        )
        return t.data;
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        return null;
    }
}


module.exports = { fetchRouteMatrix };