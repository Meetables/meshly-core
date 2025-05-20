const {
    calculateGeographicMidpoint,
    getCoordinatesFromAddress
} = require('./calculateMeetingLocation.components/coordinates');
const {
    findClosestBySquaredRouteDistanceSum
} = require('./calculateMeetingLocation.components/distance');
const {
    getNearbyAmenityCoordinates
} = require('./calculateMeetingLocation.components/apiQuery');



const findOptimalAmenityByCoordinates = async (P0s, first_check_radius, profile = "driving-car", metric = "distance") => {
    const center = calculateGeographicMidpoint(P0s);
    const coordinates = await getNearbyAmenityCoordinates(center, first_check_radius);
    if (!coordinates) {
        console.error("No place given. Can't extract coordinates.");
        return null;
    }
    const closest = await findClosestBySquaredRouteDistanceSum(P0s, coordinates, profile, metric);
    if (!closest) {
        console.error("No closest place found.");
        return null;
    }

    return [closest[1], closest[0]];
}


const findOptimalAmenityByAddresses = async (P0s_addresses, first_check_radius, profile = "driving-car", metric = "distance") => {
    const P0s = await Promise.all(P0s_addresses.map(getCoordinatesFromAddress));
    if (P0s.some(coord => coord === null)) {
        console.error("Could not fetch coordinates for all addresses.");
        return null;
    }

    return findOptimalAmenityByCoordinates(
        P0s,
        first_check_radius,
        profile,
        metric
    )
}

findOptimalAmenityByAddresses(
    P0s_addresses=["Braunaugenstraße 53, 80939 München", "Prof-Angermair-Ring 40, 85748 Garching bei München"],
    first_check_radius=1000
).then(
    result => console.log(result)
)