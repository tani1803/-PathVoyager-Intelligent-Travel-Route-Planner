const axios = require("axios");

const API_KEY = process.env.ORS_API_KEY;

exports.getRoute = async (start, end) => {
// console.log(`Routing from: [${start.lng}, ${start.lat}] to [${end.lng}, ${end.lat}]`);
  try {

    const url = "https://api.openrouteservice.org/v2/directions/driving-car";

    const response = await axios.post(
      url,
      {
        coordinates: [
          [parseFloat(start.lng), parseFloat(start.lat)], 
          [parseFloat(end.lng), parseFloat(end.lat)]
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const summary = response.data.routes[0].summary;

    return {
      distance: summary.distance / 1000,   // km
      time: summary.duration / 3600        // hours
    };

  } catch (error) {

    console.error(
    "Map API error:",
    error.response?.data || error.message
    );
    
    throw new Error("Failed to fetch route data");

  }

};