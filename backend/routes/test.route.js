const { getRoute } = require("../services/map.services");
const {estimateCost} = require("../utils/costEstimator");

const start = {
  lat: 28.6139,
  lng: 77.2090
};

const end = {
  lat: 26.9124,
  lng: 75.7873
};

async function test() {

  const route = await getRoute(start, end);
    const cost = estimateCost(route.distance);
  console.log(route);
//   console.log(cost)
  console.log(`cost is ${cost}`);

}

test();