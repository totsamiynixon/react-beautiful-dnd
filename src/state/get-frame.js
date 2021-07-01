// @flow
import { invariant } from '../invariant';

import type { DroppableDimension, ScrollableMap } from '../types';

export default (droppable: DroppableDimension): ScrollableMap => {
  const frame: ?ScrollableMap = droppable.frame;
  invariant(frame, 'Expected Droppable to have a frame');
  return frame;
};
