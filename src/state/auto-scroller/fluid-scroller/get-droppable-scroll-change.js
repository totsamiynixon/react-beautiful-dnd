// @flow
import type { DroppableScrollChange, Position, Rect } from 'css-box-model';
import type { ScrollableMap, DroppableDimension } from '../../../types';
import getScroll from './get-scroll';
import { canScrollDroppableScrollable } from '../can-scroll';

type Args = {|
  droppable: DroppableDimension,
  subject: Rect,
  center: Position,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

export default ({
  droppable,
  subject,
  center,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): ?DroppableScrollChange => {
  // We know this has a closestScrollable
  const frame: ?ScrollableMap = droppable.frame;

  // this should never happen - just being safe
  if (!frame) {
    return null;
  }

  for (const scrollableId in frame) {
    if (Object.prototype.hasOwnProperty.call(frame, scrollableId)) {
      const scrollable = frame[scrollableId];
      const scroll: ?Position = getScroll({
        dragStartTime,
        container: scrollable.pageMarginBox,
        subject,
        center,
        shouldUseTimeDampening,
      });
      if (scroll && canScrollDroppableScrollable(scrollable, scroll)) {
        return {
          scrollableId,
          scroll,
        };
      }
    }
  }

  // TODO: reafactor that and above
  return null;
};
