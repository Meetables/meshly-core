const {
    fetchRouteMatrix
} = require('./routing');




const calculateSquaredDistanceSums = async (P0s, Ps, profile = "driving-car", metric = "distance") => {
    const distances = await fetchRouteMatrix(P0s, Ps, profile, [metric]);
    if (!distances || !distances[metric + "s"]) {
        console.error("Error calculating distances.");
        return null;
    }

    const metricValues = distances[metric + "s"]

    const sums = metricValues[0].map((_, i) =>
        metricValues.reduce((sum, row) => sum + Math.pow(row[i], 2), 0)
    );

    return sums;
}


const findClosestBySquaredRouteDistanceSum = async (P0s, Ps, profile = "driving-car", metric = "distance") => {
    const squaredDistances = await calculateSquaredDistanceSums(P0s, Ps, profile, metric);
    if (!squaredDistances) {
        console.error("Error calculating squared distances.");
        return null;
    }

    const minIndex = squaredDistances.indexOf(Math.min(...squaredDistances));

    return Ps[minIndex];
}




module.exports = { findClosestBySquaredRouteDistanceSum };