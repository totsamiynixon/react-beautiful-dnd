// @flow
import type { Position, Rect } from 'css-box-model';
import type {
  ScrollableId,
  Scrollable,
  DroppableDimension,
  DroppableScrollChange,
} from '../../../types';
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
  // check if we are able to scroll parent first
  const reversedFrame: Scrollable[] = [...droppable.frame].reverse();

  for (const scrollable of reversedFrame) {
    const scrollableId: ScrollableId = scrollable.scrollableId;
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

  return null;
};
