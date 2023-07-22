import React, { useRef, useEffect, useState, useContext } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Navbar from './Navbar';
// import { fetchData } from '../api/Api';
import FilterNav from './FilterNav';
import { ApiContext } from '../context/ApiContext.js';
import CafeDrawer from './CafeDrawer';
import Legend from './Legend';
import HeatMapBox from './HeatMapBox';

mapboxgl.accessToken = 'pk.eyJ1IjoibWF4MTczOCIsImEiOiJjbGoybXdvc3QxZGZxM2xzOTRpdGtqbmMzIn0.ZLAd2HM1pH6fm49LnVzK5g';

function Map({ selectedIndex, onCafeSelection }) {
  const [selectedCafeId, setSelectedCafeId] = useState(null);
  const [data, setData, reviews, setReviews, picklePredictions, setPicklePredictions] = useContext(ApiContext);  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [mapIsCurrent, setmapIsCurrent] = useState(false);

  const [selectRating,  setSelectedRating] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null); //we need to store the geoJson data in state so that we can use it outside where its defined 
  const [predictionsData, setPredictions] = useState(null); //we need to store the predictions ... 
  const [isButton5Active, setIsButton5Active] = useState(true); //render the heatmap legend or not
  const [prices, setPrices] = useState(null); //we need to store the prices ...
  const [priceGeoJsonData, setPriceGeoJsonData] = useState(null); //we need to store the prices ...
  const [busyness, setBusynessData] = useState(null); 
  const [crimeData, setCrimeData] = useState(null);
  const [rankedData, setRankedData] = useState(null);
  // const [isRankLoaded, setIsRankLoaded] = useState(false);
  const [rankedGeoJson, setRankGeojsonData] = useState(null);
  const [activeMaps, setActiveMaps] = useState(null);
  const[newGeoJson, setNewGeoJson] = useState(null);



  useEffect(() => {
    if (busyness && prices && crimeData) {
      let rankedData = {
        "busyness": {},
        "prices": {},
        "crimeData": {},
        "combined": {},
        "current": {},
      };
  
      let sortedKeysBusyness = Object.keys(busyness).sort((a, b) => busyness[b] - busyness[a]);
      let sortedKeysPrices = Object.keys(prices).sort((a, b) => prices[b] - prices[a]);
      let sortedKeysCrime = Object.keys(crimeData).sort((a, b) => crimeData[a] - crimeData[b]); //sort so that zone with lowest crime is first
  
      let combined = {};
      let current = {};
  
      for (let rank = 0; rank < sortedKeysBusyness.length; rank++) {
        let objectid = sortedKeysBusyness[rank];
        rankedData.busyness[objectid] = { score: busyness[objectid], rank: rank + 1 };
  
        // Initialize combined rank with busyness rank
        combined[objectid] = { rank: rank + 1 };
      }
  
      for (let rank = 0; rank < sortedKeysPrices.length; rank++) {
        let objectid = sortedKeysPrices[rank];
        rankedData.prices[objectid] = { score: prices[objectid], rank: rank + 1 };
  
        // Add prices rank to combined rank
        combined[objectid].rank += rank + 1;
      }
  
      for (let rank = 0; rank < sortedKeysCrime.length; rank++) {
        let objectid = sortedKeysCrime[rank];
        rankedData.crimeData[objectid] = { score: crimeData[objectid], rank: rank + 1 };
  
        // Add crimeData rank to combined rank
        combined[objectid].rank += rank + 1;
      }
  
      // Sort combined data and assign ranks
      // The ranks are all added together, so the lowest combined rank is the best
      //currently there is no logic to handle if combined scores are the same, they simply have the same combined rank
      let sortedCombined = Object.entries(combined).sort((a, b) => a[1].rank - b[1].rank);
      for (let rank = 0; rank < sortedCombined.length; rank++) {
        let [objectid] = sortedCombined[rank];
        rankedData.combined[objectid] = { rank: rank + 1 };
      }
      if (activeMaps) {
        const activeCount = Object.values(activeMaps).filter(val => val).length;
      
        if (activeCount > 1) {
          // Initialize current
          rankedData.current = {};
          const sources = { busyness: sortedKeysBusyness, prices: sortedKeysPrices, crimeData: sortedKeysCrime };
      
          // Loop over each data source
          for (let source in sources) {
            // If the checkbox for this source is checked
            if (activeMaps[source]) {
              // Loop over the sorted keys for this source
              // while the rank is less than the amount of objects in the source, add the rank to the objectid
              for (let rank = 0; rank < sources[source].length; rank++) {
                let objectid = sources[source][rank];
                rankedData[source][objectid] = { score: eval(source)[objectid], rank: rank + 1 };
      
                // If the objectid already exists in current, add to its rank; otherwise, initialize it
                if (current[objectid]) {
                  current[objectid].rank += rank + 1;
                } else {
                  current[objectid] = { rank: rank + 1 };
                }
              }
            }
          }
      
          // Sort current data and assign ranks
          let sortedCurrent = Object.entries(current).sort((a, b) => a[1].rank - b[1].rank);
          for (let rank = 0; rank < sortedCurrent.length; rank++) {
            let [objectid] = sortedCurrent[rank];
            rankedData.current[objectid] = { rank: rank + 1 };
          }
        }
      }

      console.log("ranked data object: ", rankedData);
      console.log("active maps: ", activeMaps);
      setRankedData(rankedData);
    }
  
  }, [busyness, prices, crimeData, activeMaps]);
  
function getColorFromRank(rank) {
  if (rank === undefined) {
    return '#000000';
  }

  let lightness = ((rank - 1) / 32.5) * 35 + 25; 
  return `hsl(120, 100%, ${lightness}%)`;
}

const createHeatMapGeo = async (rankedData) => {
  // fetch('/filtered_geojson_file.geojson')
  // .then(response => response.json())
  // .then(data => {
  const response = await fetch('/filtered_geojson_file.geojson');
  let data = await response.json();
  
    if (mapIsCurrent) {
      console.log("This is our geojson: ", data);
      data.features.forEach(feature => {
        let objectid = feature.properties.objectid;

        if (rankedData.busyness.hasOwnProperty(objectid)) {
          let busynessRank = rankedData.busyness[objectid].rank;
          let busynessColor = getColorFromRank(busynessRank);
          feature.properties.busyness_color = busynessColor;
          feature.properties.busyness_rank = busynessRank;
          feature.properties.busyness_score = rankedData.busyness[objectid].score;
        } else {
          console.log(`objectid ${objectid} not found in rankedData.busyness.`);
        }
        if (rankedData.prices.hasOwnProperty(objectid)) {
          let pricesRank = rankedData.prices[objectid].rank;
          let pricesColor = getColorFromRank(pricesRank);
          feature.properties.prices_color = pricesColor;
          feature.properties.prices_rank = pricesRank;
          feature.properties.prices_score = rankedData.prices[objectid].score;

        } else {
          console.log(`objectid ${objectid} not found in rankedData.prices.`);
        }
        if (rankedData.crimeData.hasOwnProperty(objectid)) {
          let crimeRank = rankedData.crimeData[objectid].rank;
          let crimeColor = getColorFromRank(crimeRank);
          feature.properties.crime_color = crimeColor;
          feature.properties.crime_rank = crimeRank;
          feature.properties.crime_score = rankedData.crimeData[objectid].score;
        } else {
          console.log(`objectid ${objectid} not found in rankedData.crimeData.`);
        }
        //count of activeMaps
        if (activeMaps) {
        let activeCount = Object.values(activeMaps).filter(val => val).length;
        if (activeCount > 1) {
          if (rankedData.current.hasOwnProperty(objectid)) {
            let currentRank = rankedData.current[objectid].rank;
            let currentColor = getColorFromRank(currentRank);
            feature.properties.current_color = currentColor;
            feature.properties.current_rank = currentRank;
          } else {
            console.log(`objectid ${objectid} not found in rankedData.current.`);
          }
      }
    }
      })
        }
    setRankGeojsonData(data);
    console.log("This is our final geojson: ", data);

    return data;
  // });
}

// logic to handle heatmap creation
const createHeatMap = (geoJson, colorProperty) => {
  map.current.getSource("taxi_zones")?.setData(geoJson);
  
  map.current.addLayer({
    id: 'taxi_zones_fill_map',
    type: 'fill',
    source: 'taxi_zones',
    paint: {
      'fill-color': ['get', colorProperty],
      'fill-opacity': 0.5,
      'fill-outline-color': '#000000',
    }
  });
}


useEffect(() => {
  const generateGeoJson = async () => {
    if (mapIsCurrent && rankedData) {
      const newGeoJson = await createHeatMapGeo(rankedData);
      setNewGeoJson(newGeoJson);
    }
  };
  
  generateGeoJson();
}, [mapIsCurrent, rankedData, activeMaps]);

//updates the taxi_zone geojson data with the ranked data
// useEffect(() => {
//   if (mapIsCurrent && rankedData) {
//     createHeatMapGeo(rankedData);
    
//   }
// }, [mapIsCurrent, rankedData, activeMaps]);

// //adds busyness heatmap on page load
// useEffect(() => {
//   if (mapIsCurrent && rankedGeoJson) {
//     createHeatMap(rankedGeoJson, "busyness_color");
//   }
// }, [mapIsCurrent, rankedGeoJson]);



////////////////////////

  // useEffect(() => {
  //   console.log("Data changing:", data)
  // }, [data]);
  


  //checks to see if the predictions load in
  // also removed the model_ text so that we have a hashmap where its just taxi_zone number : busyness value
  // useEffect(() => {
  //   const predictions = Object.fromEntries(
  //     Object.entries(picklePredictions).map(([key, value]) => [key.replace("model_", ""), value])
  //   );
  //   console.log("type of: ", typeof predictions);
  //   console.log("pickles: ", predictions);
  //   // console.log("Pickles Pickles Pickles:", picklePredictions)
  //   console.log("Testing key:value", predictions["4"]);
  // }, [picklePredictions]);

  // function getColorFromScore(score) {
  //   if (score === undefined) {
  //     return '#000000';
  //   }
  //   if (score < 0.1) {
  //     return '#00FF00'; // Green
  //   }
  //   if (score < 0.2) {
  //       return '#33FF00';
  //   }
  //   if (score < 0.3) {
  //       return '#66FF00';
  //   }
  //   if (score < 0.4) {
  //       return '#99FF00';
  //   }
  //   if (score < 0.5) {
  //       return '#CCFF00';
  //   }
  //   if (score < 0.6) {
  //       return '#FFFF00'; // Yellow
  //   }
  //   if (score < 0.7) {
  //       return '#FFCC00';
  //   }
  //   if (score < 0.8) {
  //       return '#FF9900';
  //   }
  //   if (score < 0.9) {
  //       return '#FF6600';
  //   }
  //   if (score < 1.0) {
  //       return '#FF3300';
  //   }
  //   if (score >= 1.0) {
  //       return '#FF0000'; // Red
  //   }
    
  //     return '#000000'; // Default color if none of the conditions match
  //   }
    

  //cleans up busyness data and sets it to state
  useEffect(() => {
    if (picklePredictions) {
      const predictions = Object.fromEntries(
        Object.entries(picklePredictions).map(([key, value]) => [key.replace("model_", ""), value])
      );
      console.log("Predictions is not empty:", predictions);
      console.log("Pickle predictions", picklePredictions);
      setBusynessData(predictions);

      }
  }, [mapIsCurrent, picklePredictions]);
      ///this might be removed once we have the data all together

    // Load GeoJSON data
  //   fetch('/filtered_geojson_file.geojson')
  //     .then(response => response.json())
  //     .then(data => {
  //       // Now we have the GeoJSON data
  //       console.log("GeoJSON data: ", geojsonData);
  //       if (mapIsCurrent) {
  //         console.log("if map.current");
  //         data.features.forEach(feature => {
  //           let objectid = feature.properties.objectid;
  //           let objectstring = objectid.toString();
  //           // console.log("Type of objectstring: ", typeof objectstring);
  //           // console.log("Type of objectid: ", typeof objectid);
  //           // console.log("My objectid: ", objectid);
  //           let score = predictions[objectstring];
  //           // console.log("My objectid: ", objectid);
  //           // console.log("My score: ", score);          
  //           feature.properties.color = getColorFromScore(score);
  //           feature.properties.busyness = score;
  //           setGeojsonData(data);
  //           setPredictions(predictions);
  //         });

  //         map.current.getSource('taxi_zones').setData(data);
  
  //         map.current.addLayer({
  //           id: 'taxi_zones_fill_map',
  //           type: 'fill',
  //           source: 'taxi_zones',
  //           paint: {
  //             'fill-color': ['get', 'color'],
  //             'fill-opacity': 0.5,
  //             'fill-outline-color': '#000000',
  //           }
  //         });
  //       }
  //     });
  //   }
  // }, [mapIsCurrent, picklePredictions]);  // Re-run effect whenever picklePredictions changes
                      
  // const addHeatMap = () => {
  //   if (geojsonData && map.current) {
  //     map.current.getSource("taxi_zones")?.setData(geojsonData);
  //     if (!map.current.getLayer("taxi_zones_fill_map")) {
  //       map.current.addLayer({
  //         id: "taxi_zones_fill_map",
  //         type: "fill",
  //         source: "taxi_zones",
  //         paint: {
  //           "fill-color": ["get", "color"],
  //           "fill-opacity": 0.5,
  //           "fill-outline-color": "#000000",
  //         },
  //       });
  //     }
  //   }
  // };

  //
//We will read from market.json and take the data from there and add the rating to '/filtered_geojson_file.geojson'
useEffect(() => {
  // Load the market data
  fetch('/market.json')
    .then(response => response.json())
    .then(marketData => {
      // Now we have the market data
      console.log("Original Market data: ", marketData);

      // Format the data as a key-value pair object
      let formattedData = marketData.reduce((accumulator, current) => {
        accumulator[current.TLC] = current.normalized_price;
        return accumulator;
      }, {});

      console.log("Formatted Market data: ", formattedData);

      if (mapIsCurrent) {
        console.log("if map.current");

        // Load GeoJSON data
        fetch('/filtered_geojson_file.geojson')
          .then(response => response.json())
          .then(data => {
            // Now we have the GeoJSON data
            // console.log("GeoJSON data: ", data);

            data.features.forEach(feature => {
              let objectid = feature.properties.objectid;
              let objectstring = objectid.toString();
              let normalizedPrice = formattedData[objectstring];

              // if (normalizedPrice) {
              //   // console.log("PRICE: ", normalizedPrice)
              //   feature.properties.color = getColorFromScore(normalizedPrice);
              //   feature.properties.price = normalizedPrice;
              // }

            });
            setPrices(formattedData);
            // setPriceGeoJsonData(data);
          });
      }
    });
}, [mapIsCurrent]);  // Re-run effect whenever mapIsCurrent changes


  // const addPriceHeatMap = () => {
  //   if (geojsonData && map.current) {
  //     map.current.getSource("taxi_zones")?.setData(priceGeoJsonData);
  //     if (!map.current.getLayer("taxi_zones_price_map")) {
  //       map.current.addLayer({
  //         id: "taxi_zones_price_map",
  //         type: "fill",
  //         source: "taxi_zones",
  //         paint: {
  //           "fill-color": ["get", "color"],
  //           "fill-opacity": 0.5,
  //           "fill-outline-color": "#000000",
  //         },
  //       });
  //     }
  //   }
  // };


  //clean crime data and set it to state
  useEffect(() => {
    fetch('/crime_count.json')
      .then(response => response.json())
      .then(crimeData => {
        // Now we have the crime data
        console.log("Original Crime data: ", crimeData);
        /*
    OBJECTID  Count
0        4.0    417
1       12.0     10
2       13.0    106
3       24.0    121
4       41.0   1162
..       ...    ...
61     246.0    252
62     249.0    621
63     261.0    210
64     262.0    177
65     263.0    363
        */
       // for each object in crimeData create a new json object thats ObjectID: Count
        let formattedCrimeData = crimeData.reduce((accumulator, current) => {
          accumulator[current.OBJECTID] = current.Count;
          return accumulator;
        }
        , {});
        console.log("Formatted Crime data: ", formattedCrimeData);
        setCrimeData(formattedCrimeData);
      });
  }, [mapIsCurrent]);  // Re-run effect whenever mapIsCurrent changes


// console.log(myColorFunction(4));

  const [isLoading, setIsLoading] = useState(true);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-73.9712);
  const [lat, setLat] = useState(40.7831);
  const [zoom, setZoom] = useState(11.75);
  const [pitch, setPitch] = useState(45);
  const [zonename, setName] = useState('');
  const [zonebusyness, setBusyness] = useState('');
  const taxiZones = ['/filtered_geojson_file.geojson'];

  // Set bounds for Manhattan, New York.
  const bounds = [
    [-74.255591, 40.477399], // Southwest coordinates
    [-73.698697, 40.983697] // Northeast coordinates
  ];
      // const [currentGeoJSONIndex, setCurrentGeoJSONIndex] = useState(0);
  const [currentGeoJSONIndex, setCurrentGeoJSONIndex] = useState(selectedIndex);

  useEffect(() => {
    console.log('Test to see if my data is correct:', data);
    if (data.length > 0) {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (!isLoading && data.length > 0) {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom,
      minZoom: zoom,
      maxBounds: bounds,
      pitch: pitch,
      
    });

    // setmapIsCurrent(true);
    // console.log("set map is current == TRUE");

    map.current.on('style.load', () => {

      map.current.rotateTo(0);

      map.current.loadImage('/bench.png', (error, image) => {
        if (error) throw error;
        map.current.addImage('custom-marker', image);
    
      map.current.loadImage('/metro.png', (error, secondImage) => {
        if (error) throw error;
        map.current.addImage('custom-marker-2', secondImage);
          // Add a GeoJSON source with 2 points

      map.current.loadImage('/coffee.png', (error, fourthImage) => {
        if (error) throw error;
        map.current.addImage('custom-marker-4', fourthImage); 
    
      map.current.loadImage('/bus_stop.png', (error, thirdImage) => {
        if (error) throw error;
        map.current.addImage('custom-marker-3', thirdImage); 

        map.current.addSource('bench_locations', {
          type: 'geojson',
          data: '/City_Bench_Locations.geojson',
                  
        });
          
      map.current.addSource('taxi_zones', {
        type: 'geojson',
        data: '/filtered_geojson_file.geojson'      
      });
// useState to check if map is current and if taxi zones have been loaded (must be after addSource(taxi_zones))
// used in heatmap function
      setmapIsCurrent(true);


      map.current.addSource('subway', {
        type: 'geojson',
        data: '/Subway_Entrances.geojson'
      });

      map.current.addSource('bus', {
        type: 'geojson',
        data: '/Bus_Stop.geojson'
      });

    // Add the cafes data as a GeoJSON source
    map.current.addSource('cafes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: data.map((cafe) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [cafe.longitude, cafe.latitude],
          },
          properties: {
            name: cafe.name,
            address: cafe.address,
            rating: cafe.rating,
            id: cafe.id,
            image_url: cafe.image_url,
          },
        })),
      },
    });
  });
    });
  });
});



});

        
    // Create a popup
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.current.on('mouseenter', 'bench_locations_markers', (e) => {
      console.log("testtesttest");
      const bench = e.features[0].properties;
      const popupContent = `<strong>Address:</strong> ${bench.address}<br>` +
        `<strong>Category:</strong> ${bench.category}`;
      popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map.current);
    });
      
    // Handle mouseleave event on bench markers
    map.current.on('mouseleave', 'bench_locations_markers', () => {
      popup.remove();
    });


    map.current.on('mouseenter', 'cafe_markers', (e) => {
      const cafe = e.features[0].properties;
      const popupContent = `<strong>Name:</strong> ${cafe.name}<br>` +
        `<strong>Address:</strong> ${cafe.address}<br>` +
        `<strong>Rating:</strong> ${cafe.rating}`;
      popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map.current);
    });
    
    // Handle mouseleave event on cafe markers
    map.current.on('mouseleave', 'cafe_markers', () => {
      popup.remove();
    });

    // Close the popup when the map is clicked
    map.current.on('click', () => {
      popup.remove();
    });
    // Add mouseenter event listener to change zone color on hover
    map.current.on('mousemove', 'taxi_zones_fill', (e) => {
      const hoveredZone = e.features[0].properties.objectid; // Get the ID of the hovered zone
      const zoneName = e.features[0].properties.zone;

      // Change fill color only for the hovered zone
      map.current.setPaintProperty('taxi_zones_fill', 'fill-color', [
        'match',
        ['get', 'objectid'],
        hoveredZone,
        '#00ff00', // Color for the hovered zone
        '#20826c' // Default color for other zones
      ]);

      // Update the name state with the zone name
      setName(zoneName);
    });

    // Add mouseleave event listener to reset zone color when not hovering
    map.current.on('mouseleave', 'taxi_zones_fill', () => {
      map.current.setPaintProperty('taxi_zones_fill', 'fill-color', '#20826c'); // Reset fill color for last zone
      setName(''); // Clear the name state
    });

    map.current.on('click', 'taxi_zones_fill', (e) => {
      const lngLat = {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat
      };
      map.current.flyTo({ center: lngLat, zoom: 14 }); // Zoom in to the clicked point
    });

////////////
///////////
////////////
///THIS IS FOR THE MAP WITH THE BUSYNESS DATA
      // Add mouseenter event listener to change zone opacity on hover
      map.current.on('mousemove', 'taxi_zones_fill_map', (e) => {
        const hoveredZone = e.features[0].properties.objectid; // Get the ID of the hovered zone
        const zoneName = e.features[0].properties.zone;
        const zoneBusyness = e.features[0].properties.crime_rank;
        // Change fill opacity only for the hovered zone
        map.current.setPaintProperty('taxi_zones_fill_map', 'fill-opacity', [
          'match',
          ['get', 'objectid'],
          hoveredZone,
          0.8, // Increase opacity for the hovered zone
          0.5  // Default opacity for other zones
        ]);

        // Update the name state with the zone name and zoneBusyness
        setName(zoneName);
        setBusyness(zoneBusyness);
      });

      // Add mouseleave event listener to reset zone opacity when not hovering
      map.current.on('mouseleave', 'taxi_zones_fill_map', () => {
        map.current.setPaintProperty('taxi_zones_fill_map', 'fill-opacity', 0.5); // Reset fill opacity for last zone
        setName(''); // Clear the name state
        setBusyness(''); // Clear the busyness state
      });

      map.current.on('click', 'taxi_zones_fill_map', (e) => {
        const lngLat = {
          lng: e.lngLat.lng,
          lat: e.lngLat.lat
        };
        map.current.flyTo({ center: lngLat, zoom: 14 }); // Zoom in to the clicked point
      });    
////////////
///////////
////////////
// THIS IS FOR PRICE HEATMAP 
    // Add mouseenter event listener to change zone opacity on hover
    map.current.on('mousemove', 'taxi_zones_price_map', (e) => {
      const hoveredZone = e.features[0].properties.objectid; // Get the ID of the hovered zone
      const zoneName = e.features[0].properties.zone;
      const zoneBusyness = e.features[0].properties.price;
      // Change fill opacity only for the hovered zone
      map.current.setPaintProperty('taxi_zones_price_map', 'fill-opacity', [
        'match',
        ['get', 'objectid'],
        hoveredZone,
        0.8, // Increase opacity for the hovered zone
        0.5  // Default opacity for other zones
      ]);

      // Update the name state with the zone name and zoneBusyness
      setName(zoneName);
      setBusyness(zoneBusyness);
    });

    // Add mouseleave event listener to reset zone opacity when not hovering
    map.current.on('mouseleave', 'taxi_zones_price_map', () => {
      map.current.setPaintProperty('taxi_zones_price_map', 'fill-opacity', 0.5); // Reset fill opacity for last zone
      setName(''); // Clear the name state
      setBusyness(''); // Clear the busyness state
    });

    map.current.on('click', 'taxi_zones_price_map', (e) => {
      const lngLat = {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat
      };
      map.current.flyTo({ center: lngLat, zoom: 14 }); // Zoom in to the clicked point
    });    



    // cafe marker click function

    map.current.on('click', 'cafe_markers', (e) => {
      const cafe_id = e.features[0].properties.id;
      const cafe_url = e.features[0].properties.image_url;
      const cafe_name = e.features[0].properties.name;
      const cafe_rating = e.features[0].properties.rating
      console.log(cafe_id);
      setSelectedCafeId(cafe_id);
      setSelectedImage(cafe_url)
      setSelectedName(cafe_name)
      setSelectedRating(cafe_rating)
      onCafeSelection(cafe_id);
    });


  };
  }, [isLoading, data, lng, lat, zoom, bounds]); //This is the useEffect dependency array
  //When any of the variables or states listed in the dependency array above change, the effect will run again.
  

//Pass in active buttons from FilterNav to affect the layers

// this function will now only handle markers that are currently active
//WE HAVE TO REMOVE HEATMAPS 
  const handleLayerChange = (activeButtons) => {
    setCurrentGeoJSONIndex(activeButtons);
  // Remove existing layers
  map.current.getStyle().layers.forEach((layer) => {
    if (
      layer.id === 'bench_locations_markers' ||
      layer.id === 'subway_markers' ||
      layer.id === 'bus_markers' ||
      layer.id === 'cafe_markers' ||
      layer.id === 'taxi_zones_fill' ||
      layer.id === 'taxi_zones_fill_map' ||
      layer.id === 'taxi_zones_price_map'
    ) {
      map.current.removeLayer(layer.id);
    }
  });
  
  //if 0 (taxi button) then add in taxi zones as an overlay on the map
    if (activeButtons.includes(0)) {
      map.current.getSource('taxi_zones').setData('/filtered_geojson_file.geojson');
      map.current.addLayer({
        id: 'taxi_zones_fill',
        type: 'fill',
        source: 'taxi_zones',
        paint: {
          'fill-color': '#20826c',
          'fill-opacity': 0.5,
          'fill-outline-color': '#000000',
        }
      });
    }
    if (activeButtons.includes(1)) {
      map.current.getSource('bench_locations').setData('/City_Bench_Locations.geojson');
      
      const filterExpression = ['==', ['get', 'borough'], 'Manhattan'];
      map.current.addLayer({
        id: 'bench_locations_markers',
        type: 'symbol',
        source: 'bench_locations',
        layout: {
          'icon-image': 'custom-marker',
          'icon-size': 0.5,
        },
        filter: filterExpression,
      });
    }
  
    if (activeButtons.includes(2)) {
      map.current.addLayer({
        id: 'subway_markers',
        type: 'symbol',
        source: 'subway',
        layout: {
          'icon-image': 'custom-marker-2',
          'icon-size': 0.3,
        },
      });
    }
  
    if (activeButtons.includes(3)) {
      map.current.addLayer({
        id: 'bus_markers',
        type: 'symbol',
        source: 'bus',
        layout: {
          'icon-image': 'custom-marker-3',
          'icon-size': 0.7,
        },
        filter: ['==', 'boro_name', 'Manhattan'],
      });
    }
    if (activeButtons.includes(4)) {
      map.current.addLayer({
        id: 'cafe_markers',
        type: 'symbol',
        source: 'cafes',
        layout: {
          'icon-image': 'custom-marker-4',
          'icon-size': 0.7,
        }
      });
    }
    if (activeButtons.includes(5)) {
      setIsButton5Active(true);
      // addHeatMap();
    } else {
      setIsButton5Active(false);
    }  
    if (activeButtons.includes(6)) {
      // addPriceHeatMap();
    }
  };



//this function will add the heatmap to the map
  const handleHeatMap = (activeMaps) => {

    // save the state of activeMaps on function call
    setActiveMaps(activeMaps);




    //if the current layer is taxi zones, remove it
    if (map.current.getLayer("taxi_zones_fill_map")) {
    map.current.removeLayer("taxi_zones_fill_map");
    }

    if (activeMaps) {
      //if more than one thing in active maps is true
  const activeCount = Object.values(activeMaps).filter(val => val).length;
      
  if (activeCount > 1 && newGeoJson) {
// add heatmap 
    if (mapIsCurrent && newGeoJson) {
      console.log("Adding combined Heatmap")
      createHeatMap(newGeoJson, "current_color");
    }
  }
  else {



    if (activeMaps.busyness) {
      console.log('Busyness is checked');
      // add heatmap 
        if (mapIsCurrent && newGeoJson) {
          createHeatMap(newGeoJson, "busyness_color");
        }
  } else {
      console.log('Busyness is unchecked');
      // Your code when 'busyness' is unchecked
  }

  if (activeMaps.crimeData) {
      console.log('Crime Rate is checked');
      // add heatmap 
      if (mapIsCurrent && rankedGeoJson) {
        createHeatMap(newGeoJson, "crime_color");
      }
} else {
      console.log('Crime Rate is unchecked');
      // Your code when 'crimeRate' is unchecked
  }

  if (activeMaps.prices) {
      console.log('Property Prices is checked');
      // add heatmap 
      if (mapIsCurrent && rankedGeoJson) {
        createHeatMap(newGeoJson, "prices_color");
      }
} else {
      console.log('Property Prices is unchecked');
      // Your code when 'propertyPrices' is unchecked
  }
}
    }
  };


// const handleHeatMap = (activeMaps) => {
//   //if the current layer is taxi zones, remove it
//   if (map.current.getLayer("taxi_zones_fill_map")) {
//     map.current.removeLayer("taxi_zones_fill_map");
//   }


//   let selectedFeatures = [];

//   if (selectedFeatures.length > 0) {
//     let selectedFeatures = [];
//   }

  
//   for (let feature in activeMaps) {
//     if (activeMaps[feature]) {
//       console.log(`${feature} is checked`);
//       selectedFeatures.push(feature);
//     }
//   }

//   createHeatMapGeo(rankedData, selectedFeatures);
// }

useEffect(() => {
  if (newGeoJson) {
    handleHeatMap(activeMaps);
  }
}, [newGeoJson]);
  
  const lnglat =  {lng: -73.9712, lat:40.7831};
  const handleReset = () => {
    map.current.flyTo({ center: lnglat, zoom: 11.75 }); // 
  };

  return (
    <div>
      {/* Render the name element */}
      <Navbar name = {zonename} busyness = {zonebusyness} />
      <button onClick={handleReset}>Reset</button>
      <CafeDrawer cafeId={selectedCafeId} cafe_url = {selectedImage}  cafe_name = {selectedName} cafe_rating = {selectRating}/>
            {/* Map container */}
      <div ref={mapContainer} className="map-container">
      {/* {isButton5Active && (<Legend/>)} Render the legend if the button is active */}
      </div>
      <HeatMapBox handleHeatMap = {handleHeatMap} />
      {/* <div className="filter-nav-container"> */}
      {/* <FilterNav handleLayerChange={handleLayerChange} /> */}
    {/* </div> */}
    </div>
  );
}

export default Map;
