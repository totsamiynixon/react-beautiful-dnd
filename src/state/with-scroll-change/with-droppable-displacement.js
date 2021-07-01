// @flow
import { type Position } from 'css-box-model';
import { add } from '../position';
import type { Scrollable, DroppableDimension } from '../../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const frame: ?Scrollable = droppable.frame;
  if (!frame) {
    return point;
  }

  let current = point;

  for (const scrollableId in frame) {
    if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
      const scrollable: Scrollable = frame[scrollableId];
      current = add(current, scrollable.scroll.diff.displacement);
    }
  }

  return current;
};
