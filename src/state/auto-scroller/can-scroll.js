// @flow
import { type Position } from 'css-box-model';
import { add, apply, isEqual, origin } from '../position';
import type {
  DroppableDimension,
  Viewport,
  ScrollableMap,
  DroppableOverlap,
  ScrollableId,
  Scrollable,
  s,
} from '../../types';

type CanPartiallyScrollArgs = {|
  max: Position,
  current: Position,
  change: Position,
|};

const smallestSigned = apply((value: number) => {
  if (value === 0) {
    return 0;
  }
  return value > 0 ? 1 : -1;
});

type GetRemainderArgs = {|
  current: Position,
  max: Position,
  change: Position,
|};

// We need to figure out how much of the movement
// cannot be done with a scroll
export const getOverlap = (() => {
  const getRemainder = (target: number, max: number): number => {
    if (target < 0) {
      return target;
    }
    if (target > max) {
      return target - max;
    }
    return 0;
  };

  return ({ current, max, change }: GetRemainderArgs): ?Position => {
    const targetScroll: Position = add(current, change);

    const overlap: Position = {
      x: getRemainder(targetScroll.x, max.x),
      y: getRemainder(targetScroll.y, max.y),
    };

    if (isEqual(overlap, origin)) {
      return null;
    }

    return overlap;
  };
})();

export const canPartiallyScroll = ({
  max: rawMax,
  current,
  change,
}: CanPartiallyScrollArgs): boolean => {
  // It is possible for the max scroll to be greater than the current scroll
  // when there are scrollbars on the cross axis. We adjust for this by
  // increasing the max scroll point if needed
  // This will allow movements backwards even if the current scroll is greater than the max scroll
  const max: Position = {
    x: Math.max(current.x, rawMax.x),
    y: Math.max(current.y, rawMax.y),
  };

  // Only need to be able to move the smallest amount in the desired direction
  const smallestChange: Position = smallestSigned(change);

  const overlap: ?Position = getOverlap({
    max,
    current,
    change: smallestChange,
  });

  // no overlap at all - we can move there!
  if (!overlap) {
    return true;
  }

  // if there was an x value, but there is no x overlap - then we can scroll on the x!
  if (smallestChange.x !== 0 && overlap.x === 0) {
    return true;
  }

  // if there was an y value, but there is no y overlap - then we can scroll on the y!
  if (smallestChange.y !== 0 && overlap.y === 0) {
    return true;
  }

  return false;
};

export const canScrollWindow = (
  viewport: Viewport,
  change: Position,
): boolean =>
  canPartiallyScroll({
    current: viewport.scroll.current,
    max: viewport.scroll.max,
    change,
  });

export const getWindowOverlap = (
  viewport: Viewport,
  change: Position,
): ?Position => {
  if (!canScrollWindow(viewport, change)) {
    return null;
  }

  const max: Position = viewport.scroll.max;
  const current: Position = viewport.scroll.current;

  return getOverlap({
    current,
    max,
    change,
  });
};

export const canScrollDroppable = (
  droppable: DroppableDimension,
  change: Position,
): boolean => {
  const frame: ?ScrollableMap = droppable.frame;

  // Cannot scroll when there is no any scrollable
  if (!frame) {
    return false;
  }

  // TODO: refactor for more clean solution
  for (const scrollableId in frame) {
    if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
      const scrollable = frame[scrollableId];
      if (
        canPartiallyScroll({
          current: scrollable.scroll.current,
          max: scrollable.scroll.max,
          change,
        })
      ) {
        return true;
      }
    }
  }

  return false;
};

export const canScrollDroppableScrollable = (
  scrollable: Scrollable,
  change: Position,
): boolean => {
  // TODO: refactor for more clean solution
  return canPartiallyScroll({
    current: scrollable.scroll.current,
    max: scrollable.scroll.max,
    change,
  });
};

export const getDroppableOverlap = (
  droppable: DroppableDimension,
  change: Position,
): ?DroppableOverlap => {
  const frame: ?ScrollableMap = droppable.frame;

  if (!frame) {
    return null;
  }

  if (!canScrollDroppable(droppable, change)) {
    return null;
  }

  for (const scrollableId in frame) {
    if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
      const scrollable = frame[scrollableId];
      const overlap = getOverlap({
        current: scrollable.scroll.current,
        max: scrollable.scroll.max,
        change,
      });
      if (overlap) {
        return {
          scrollableId,
          overlap,
        };
      }
    }
  }

  // TODO: invariant negative case that never should happen
  return null;
};
