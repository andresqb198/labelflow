import { ApolloClient, useApolloClient } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import gql from "graphql-tag";
import { Collection, Feature } from "ol";
import { Geometry } from "ol/geom";
import { TranslateEvent } from "ol/interaction/Translate";

import { Effect, useUndoStore } from "../../../../connectors/undo-store";

const updateLabelMutation = gql`
  mutation updateLabel(
    $id: ID!
    $x: Float
    $y: Float
    $width: Float
    $height: Float
    $labelClassId: ID
  ) {
    updateLabel(
      where: { id: $id }
      data: {
        x: $x
        y: $y
        width: $width
        height: $height
        labelClassId: $labelClassId
      }
    ) {
      id
    }
  }
`;

const getLabelQuery = gql`
  query getLabel($id: ID!) {
    label(where: { id: $id }) {
      x
      y
      width
      height
    }
  }
`;

const updateLabelEffect = (
  {
    labelId,
    x,
    y,
    width,
    height,
  }: {
    labelId: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
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
    const originalGeometry = labelData?.label;
    await client.mutate({
      mutation: updateLabelMutation,
      variables: {
        id: labelId,
        x,
        y,
        width,
        height,
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
    originalGeometry: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }): Promise<string> => {
    await client.mutate({
      mutation: updateLabelMutation,
      variables: {
        id: labelId,
        x: originalGeometry.x,
        y: originalGeometry.y,
        width: originalGeometry.width,
        height: originalGeometry.height,
      },
      refetchQueries: ["getImageLabels"],
    });
    return id;
  },
});

export const TranslateFeature = ({
  selectedFeature,
}: {
  selectedFeature: Feature<Geometry> | null;
}) => {
  const client = useApolloClient();
  const { perform } = useUndoStore();
  const toast = useToast();

  return selectedFeature != null ? (
    <olInteractionTranslate
      args={{ features: new Collection([selectedFeature]) }}
      onTranslateend={async (event: TranslateEvent) => {
        const feature = event.features.getArray()[0];
        const [x, y, destinationX, destinationY] = feature
          .getGeometry()
          .getExtent();
        const width = destinationX - x;
        const height = destinationY - y;
        const { id: labelId } = feature.getProperties();
        try {
          await perform(
            updateLabelEffect({ labelId, x, y, width, height }, { client })
          );
        } catch (error) {
          toast({
            title: "Error creating bounding box",
            description: error?.message,
            isClosable: true,
            status: "error",
            position: "bottom-right",
            duration: 10000,
          });
        }
      }}
    />
  ) : null;
};
