// @flow
import { type Position } from 'css-box-model';
import { invariant } from '../../invariant';
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
  invariant(droppable.frame);
  const scrollable: Scrollable = droppable.frame[scrollableId];

  const scrollDiff: Position = subtract(newScroll, scrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  // Position of frame including displacement because of scroll

  const frame = {
    ...droppable.frame,
    [scrollableId]: {
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
    },
  };

  // has active property if droppable is visible in frame (if has) or in viewport
  const subject: DroppableSubject = getSubject({
    page: droppable.subject.page,
    withPlaceholder: droppable.subject.withPlaceholder,
    axis: droppable.axis,
    frame,
  });
  const result: DroppableDimension = {
    ...droppable,
    frame,
    subject,
  };
  return result;
};
