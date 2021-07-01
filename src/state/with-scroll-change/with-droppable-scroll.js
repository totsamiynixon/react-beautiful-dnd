// @flow
import { type Rect } from 'css-box-model';
import type { Scrollable, DroppableDimension } from '../../types';
import { offsetRectByPosition } from '../rect';

export default (droppable: DroppableDimension, area: Rect): Rect => {
  const frame: ScrollableMap = droppable.frame;
  if (Object.keys(frame).length === 0) {
    return area;
  }

  let currentArea = area;

  for (const scrollableId in frame) {
    if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
      const scrollable: Scrollable = frame[scrollableId];
      currentArea = offsetRectByPosition(
        currentArea,
        scrollable.scroll.diff.value,
      );
    }
  }

  return currentArea;
};
