import React, { useState, useEffect, useRef } from 'react';
import LineChart from './LineChart';
function Drawer ({getMap, rightSidebar, setRightSidebar, dayData, weekData, yearData, objectID, name, busynessRank, crimeRank, propertyRank, transitRank, combinedRank}) {
    const sidebarRef = useRef(null);


    useEffect(() => {
        const map = getMap();
        // Now you have the latest value of the map
        console.log("Map test", map);
    
        if (!map) {
            return;
        }
    
        if (rightSidebar) {
            const padding = { right: 300 };
            map.easeTo({
                padding: padding,
                duration: 1000
            });
        } else {
            const padding = { right: 0 };
            map.easeTo({
                padding: padding,
                duration: 1000
            });
        }
    }, [rightSidebar, getMap]);
    
    const toggleSidebar = (side) => {
        if (side === 'right') {
            setRightSidebar(!rightSidebar);
        }
    };

    return (
        <div ref={sidebarRef} id="right" className={`sidebar flex-center right ${rightSidebar ? '' : 'collapsed'}`}>
          <div className="sidebar-content rounded-rect flex-center">
            <h1 className="sidebar-header">{name}</h1>
            <div className="sidebar-toggle rounded-rect right" onClick={() => toggleSidebar('right')}>
              &rarr;
            </div>
            <p className="rank-info">
              Busyness Rank: {busynessRank}<br/>
              Crime Rank: {crimeRank}<br/>
              Property Rank: {propertyRank}<br/>
              Transit Rank: {transitRank}<br/>
              Combined Rank: {combinedRank}
            </p>
            <LineChart dayData={dayData} weekData={weekData} yearData={yearData} objectID={objectID} sidebarIsOpen={rightSidebar}/>
          </div>
        </div>
      )
    }      

export default Drawer;
