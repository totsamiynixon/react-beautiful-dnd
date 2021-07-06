// @flow
import { type Position } from 'css-box-model';
import { findIndex } from '../../native-with-fallback';
import type {
  DroppableDimension,
  ScrollableId,
  Scrollable,
  DroppableSubject,
} from '../../types';
import { negate, subtract } from '../position';
import getSubject from './util/get-subject';

export default (
  droppable: DroppableDimension,
  scrollableId: ScrollableId,
  newScroll: Position,
): DroppableDimension => {
  const frame: Scrollable[] = droppable.frame;

  const scrollableIndex = findIndex(
    frame,
    (x) => x.scrollableId === scrollableId,
  );

  const scrollable: Scrollable = frame[scrollableIndex];

  const scrollDiff: Position = subtract(newScroll, scrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  // Position of frame including displacement because of scroll

  const newFrame: Scrollable[] = [...frame];

  newFrame[scrollableIndex] = {
    ...scrollable,
    scroll: {
      initial: scrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
      // TODO: rename 'softMax?'
      max: scrollable.scroll.max,
    },
  };

  // has active property if droppable is visible in frame (if has) or in viewport
  const subject: DroppableSubject = getSubject({
    page: droppable.subject.page,
    withPlaceholder: droppable.subject.withPlaceholder,
    axis: droppable.axis,
    frame: newFrame,
  });
  const result: DroppableDimension = {
    ...droppable,
    frame: newFrame,
    subject,
  };
  return result;
};
