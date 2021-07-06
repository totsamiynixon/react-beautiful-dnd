// @flow
import { type Position } from 'css-box-model';
import { add } from '../position';
import type { Scrollable, DroppableDimension } from '../../types';

export default (droppable: DroppableDimension, point: Position): Position => {
  const frame: Scrollable[] = droppable.frame;

  let current: Position = point;

  for (const scrollable of frame) {
    current = add(current, scrollable.scroll.diff.displacement);
  }

  return current;
};
