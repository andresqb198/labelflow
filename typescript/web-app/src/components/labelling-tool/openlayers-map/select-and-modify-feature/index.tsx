import { MutableRefObject, useEffect, useState, useCallback } from "react";
import { Feature, Map as OlMap } from "ol";
import { Geometry, Polygon } from "ol/geom";
import { Vector as OlSourceVector } from "ol/source";
import { extend } from "@labelflow/react-openlayers-fiber";
import gql from "graphql-tag";
import { ApolloClient, useApolloClient } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { SelectInteraction } from "./select-interaction";
import { useLabellingStore } from "../../../../connectors/labelling-state";
import { ResizeAndTranslateBox } from "./resize-and-translate-box-interaction";
import { Effect, useUndoStore } from "../../../../connectors/undo-store";
import { GeometryInput } from "../../../../graphql-types.generated";

// Extend react-openlayers-catalogue to include resize and translate interaction
extend({
  ResizeAndTranslateBox: { object: ResizeAndTranslateBox, kind: "Interaction" },
});

const updateLabelMutation = gql`
  mutation updateLabel($id: ID!, $geometry: GeometryInput, $labelClassId: ID) {
    updateLabel(
      where: { id: $id }
      data: { geometry: $geometry, labelClassId: $labelClassId }
    ) {
      id
    }
  }
`;

const getLabelQuery = gql`
  query getLabel($id: ID!) {
    label(where: { id: $id }) {
      geometry {
        type
        coordinates
      }
    }
  }
`;

const updateLabelEffect = (
  {
    labelId,
    geometry,
  }: {
    labelId: string;
    geometry?: GeometryInput;
  },
  {
    client,
  }: {
    client: ApolloClient<object>;
  }
): Effect => ({
  do: async () => {
    const { data: labelData } = await client.query({
      query: getLabelQuery,
      variables: { id: labelId },
    });
    const originalGeometry = labelData?.label.geometry;
    await client.mutate({
      mutation: updateLabelMutation,
      variables: {
        id: labelId,
        geometry,
      },
      refetchQueries: ["getImageLabels"],
    });

    return { id: labelId, originalGeometry };
  },
  undo: async ({
    id,
    originalGeometry,
  }: {
    id: string;
    originalGeometry: GeometryInput;
  }): Promise<string> => {
    await client.mutate({
      mutation: updateLabelMutation,
      variables: {
        id: labelId,
        geometry: {
          type: originalGeometry.type,
          coordinates: originalGeometry.coordinates,
        },
      },
      refetchQueries: ["getImageLabels"],
    });
    return id;
  },
});

export const SelectAndModifyFeature = (props: {
  sourceVectorLabelsRef: MutableRefObject<OlSourceVector<Geometry> | null>;
  map: OlMap | null;
  setIsContextMenuOpen?: (state: boolean) => void;
  editClassOverlayRef?: MutableRefObject<HTMLDivElement | null>;
}) => {
  const { sourceVectorLabelsRef } = props;
  // We need to have this state in order to store the selected feature in the addfeature listener below
  const [selectedFeature, setSelectedFeature] =
    useState<Feature<Geometry> | null>(null);
  const selectedLabelId = useLabellingStore((state) => state.selectedLabelId);

  const getSelectedFeature = useCallback(() => {
    if (selectedFeature?.getProperties()?.id !== selectedLabelId) {
      if (selectedLabelId == null) {
        setSelectedFeature(null);
      } else {
        const featureFromSource = sourceVectorLabelsRef.current
          ?.getFeatures()
          ?.filter(
            (feature) => feature.getProperties().id === selectedLabelId
          )?.[0];
        if (featureFromSource != null) {
          setSelectedFeature(featureFromSource);
        }
      }
    }
  }, [selectedLabelId, sourceVectorLabelsRef.current]);

  // This is needed to make sure that each time a new feature is added to OL we check if it's the selected feature (for instance when we reload the page and we have a selected label but labels haven't been added to OL yet)
  useEffect(() => {
    sourceVectorLabelsRef.current?.on("addfeature", getSelectedFeature);
    return () =>
      sourceVectorLabelsRef.current?.un("addfeature", getSelectedFeature);
  }, [sourceVectorLabelsRef.current]);

  useEffect(() => {
    getSelectedFeature();
  }, [selectedLabelId]);

  const client = useApolloClient();
  const { perform } = useUndoStore();
  const toast = useToast();

  return (
    <>
      <SelectInteraction {...props} />
      {/* @ts-ignore - We need to add this because resizeAndTranslateBox is not included in the react-openalyers-fiber original catalogue */}
      <resizeAndTranslateBox
        args={{ selectedFeature }}
        onInteractionEnd={async (feature: Feature<Polygon> | null) => {
          if (feature != null) {
            const coordinates = feature.getGeometry().getCoordinates();
            const geometry = { type: "Polygon", coordinates };
            const { id: labelId } = feature.getProperties();
            try {
              await perform(
                updateLabelEffect({ labelId, geometry }, { client })
              );
            } catch (error) {
              toast({
                title: "Error updating bounding box",
                description: error?.message,
                isClosable: true,
                status: "error",
                position: "bottom-right",
                duration: 10000,
              });
            }
          }
        }}
      />
    </>
  );
};
