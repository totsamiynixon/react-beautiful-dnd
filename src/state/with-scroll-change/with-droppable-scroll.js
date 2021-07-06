// @flow
import { type Rect } from 'css-box-model';
import type { Scrollable, DroppableDimension } from '../../types';
import { offsetRectByPosition } from '../rect';

export default (droppable: DroppableDimension, area: Rect): Rect => {
  const frame: Scrollable[] = droppable.frame;
  if (frame.length === 0) {
    return area;
  }

  let currentArea = area;

  for (const scrollable of frame) {
    currentArea = offsetRectByPosition(
      currentArea,
      scrollable.scroll.diff.value,
    );
  }

  return currentArea;
};
