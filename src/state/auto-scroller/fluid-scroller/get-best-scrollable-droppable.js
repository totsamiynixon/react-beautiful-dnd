// @flow
import memoizeOne from 'memoize-one';
import { type Position } from 'css-box-model';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../../../types';
import { invariant } from '../../../invariant';
import isPositionInFrame from '../../visibility/is-position-in-frame';
import { toDroppableList } from '../../dimension-structures';
import { find } from '../../../native-with-fallback';

const getScrollableDroppables = memoizeOne(
  (droppables: DroppableDimensionMap): DroppableDimension[] =>
    toDroppableList(droppables).filter(
      (droppable: DroppableDimension): boolean => {
        // exclude disabled droppables
        if (!droppable.isEnabled) {
          return false;
        }

        // only want droppables that are scrollable
        if (!droppable.frame) {
          return false;
        }

        return true;
      },
    ),
);

const getScrollableDroppableOver = (
  target: Position,
  droppables: DroppableDimensionMap,
): ?DroppableDimension => {
  const maybe: ?DroppableDimension = find(
    getScrollableDroppables(droppables),
    (droppable: DroppableDimension): boolean => {
      const frame = droppable.frame;
      invariant(frame, 'Invalid result');
      // perhaps here we could do enumaration through array of frames per each scrollable parent
      // perhaps we need to go there from the higher parent to the lower child
      for (const scrollableId in frame) {
        if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
          const scrollable = frame[scrollableId];
          if (isPositionInFrame(scrollable.pageMarginBox)(target)) {
            return true;
          }
        }
      }

      // TODO: check how to refactor that
      return false;
    },
  );

  return maybe;
};

type Api = {|
  center: Position,
  destination: ?DroppableId,
  droppables: DroppableDimensionMap,
|};

export default ({
  center,
  destination,
  droppables,
}: Api): ?DroppableDimension => {
  // We need to scroll the best droppable frame we can so that the
  // placeholder buffer logic works correctly

  if (destination) {
    const dimension: DroppableDimension = droppables[destination];
    if (!dimension.frame) {
      return null;
    }
    return dimension;
  }

  // 2. If we are not over a droppable - are we over a droppable frame?
  const dimension: ?DroppableDimension = getScrollableDroppableOver(
    center,
    droppables,
  );

  return dimension;
};
