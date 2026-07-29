import { SearchComponent, useController, useRenderData } from '@anocca/sequence-viewer-react-shared';
import {
  bindValue,
  drawCircular,
  getCircleProperties,
  getRadiusTargetForViewRange,
  increase
} from '@anocca/sequence-viewer-render-circular';
import {
  Annotations,
  CircularSelection,
  SelectionRange,
  SequenceControllerRef
} from '@anocca/sequence-viewer-utils';
import React from 'react';

export const useCircularController = ({
  isProtein,
  ref,
  width,
  height,
  sequence,
  allAnnotations,
  codons,
  Search,
  openAnnotationDialog
}: {
  ref: React.ForwardedRef<SequenceControllerRef>;
  width: number;
  height: number;
  sequence: string;
  allAnnotations: Annotations;
  codons: { [k: string]: string };
  Search?: SearchComponent;
  openAnnotationDialog?: (annotationId: string) => void;
  isProtein: boolean;
}) => {
  const len = sequence.length;
  const iLen = len - 1;
  const renderData = useRenderData(width, sequence, isProtein);
  const [circularSelection, _setCircularSelection] = React.useState<CircularSelection[]>([
    {
      state: 'selected',
      start: 0,
      end: 0,
      antiClockwise: undefined
    }
  ]);

  const [clickedAnnotation, setClickedAnnotation] = React.useState<undefined | string>(undefined);
  const setCircularSelection = (annotationId: undefined | string, cc: CircularSelection[]) => {
    setClickedAnnotation(annotationId);
    _setCircularSelection(cc);
  };

  const resetAngularScroll = () => {
    if (!renderData.current) {
      return;
    }

    const { angleOffset } = getCircleProperties({
      data: renderData.current,
      sequence,
      w: width,
      h: height,
      circularSelection
    });

    renderData.current.circluarCamera.value.angle = 0;
    renderData.current.circluarCamera.angleOffset = angleOffset;
    if (angleOffset > Math.PI) {
      renderData.current.circluarCamera.angleOffset = -(Math.PI * 2 - angleOffset);
    }
    renderData.current.circluarCamera.scrollOffsetZooming = 0;
    renderData.current.circluarCamera.scrollOffsetZoomed = 0;
  };

  const zoomToSearchResult = (nextViewRange: SelectionRange, zoom: boolean) => {
    if (renderData.current) {
      resetAngularScroll();

      renderData.current.circluarCamera.value = {
        zoom: zoom ? 1 : renderData.current.circluarCamera.value.zoom,
        angle: 1,
        radius: zoom
          ? getRadiusTargetForViewRange(width, height, len, 1, nextViewRange)
          : renderData.current.circluarCamera.value.radius
      };
      bindValue(renderData.current.circluarCamera.value, renderData.current.circluarCamera.target);
    }
  };

  const circularScroll = (
    deltaX: number,
    deltaY: number,
    mouseX: number,
    mouseY: number,
    shift: boolean,
    alt: boolean
  ) => {
    if (!renderData.current) {
      return;
    }

    // Under a held modifier the OS may report the scroll on either axis
    // (wheel mice report deltaX under shift; trackpads report deltaY).
    const modifierDelta = deltaX + deltaY;
    const scrollHorizontally = shift || Math.abs(deltaX) > Math.abs(deltaY);
    const scrollWheelDelta = shift ? modifierDelta : deltaX;
    const zoomDelta = scrollHorizontally ? 0 : -deltaY / 7500;
    const scrollDelta = scrollHorizontally ? -scrollWheelDelta / 1000 : 0;
    increase(zoomDelta, renderData.current.circluarCamera.value, renderData.current.circluarCamera.target);

    const { radius } = getCircleProperties({
      data: renderData.current,
      sequence,
      w: width,
      h: height,
      circularSelection
    });

    const horizontalScrollSpeed = 300;

    const scrollFactor = scrollDelta * (horizontalScrollSpeed / radius);

    if (renderData.current.circluarCamera.value.angle === 1) {
      renderData.current.circluarCamera.scrollOffsetZoomed += scrollFactor;
    } else {
      renderData.current.circluarCamera.scrollOffsetZooming += scrollFactor;
    }
    renderData.current.circluarCamera.angleOffset =
      (Math.PI * 2 + renderData.current.circluarCamera.angleOffset) % (2 * Math.PI);
  };

  const updateScroll = (
    deltaX: number,
    deltaY: number,
    mouseX: number,
    mouseY: number,
    shift: boolean,
    alt: boolean
  ) => {
    circularScroll(deltaX, deltaY, mouseX, mouseY, shift, alt);
  };

  const getCaretPosition = () => {
    if (!renderData.current) {
      return 0;
    }
    const { hoveringCaretPosition } = getCircleProperties({
      data: renderData.current,
      sequence,
      w: width,
      h: height,
      circularSelection
    });
    return hoveringCaretPosition;
  };

  return useController({
    resetAngularScroll,
    circularSelection,
    setCircularSelection,
    clickedAnnotation,
    renderData,
    getCaretPosition,
    updateScroll,
    draw: drawCircular,
    zoomToSearchResult,
    ref,
    width,
    height,
    sequence,
    allAnnotations,
    codons,
    Search,
    openAnnotationDialog,
    isProtein,
    isCircularView: true
  });
};
