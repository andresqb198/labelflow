import React from "react";

import { Map } from "../map";

import "ol/ol.css";

export default {
  title: "react-openlayers-fiber/OL Examples",
  component: Map,
};

export const TiledWMS = () => {
  return (
    <Map>
      <olView initialCenter={[-10997148, 4569099]} initialZoom={4} />
      <olLayerTile>
        <olSourceOSM />
      </olLayerTile>
      <olLayerTile>
        <olSourceTileWMS
          url="https://ahocevar.com/geoserver/wms"
          params={{ LAYERS: "topp:states", TILED: true }}
          serverType="geoserver"
          transition={0}
        />
      </olLayerTile>
    </Map>
  );
};