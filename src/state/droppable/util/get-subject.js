// @flow
import { getRect, type Rect, type Spacing, type BoxModel } from 'css-box-model';
import type {
  Axis,
  Scrollable,
  ScrollableMap,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../../types';
// import executeClip from './clip';
import { offsetByPosition } from '../../spacing';

const scroll = (target: Spacing, frame: ?ScrollableMap): Spacing => {
  if (!frame) {
    return target;
  }

  // TODO: refactor that
  // eslint-disable-next-line es5/no-es6-methods
  const displacement = Object.values(frame).reduce(
    (current, scrollable: Scrollable) => {
      current.x = scrollable.scroll.diff.displacement.x;
      current.y = scrollable.scroll.diff.displacement.y;

      return current;
    },
    {},
  );

  return offsetByPosition(target, displacement);
};

const increase = (
  target: Spacing,
  axis: Axis,
  withPlaceholder: ?PlaceholderInSubject,
): Spacing => {
  if (withPlaceholder && withPlaceholder.increasedBy) {
    return {
      ...target,
      [axis.end]: target[axis.end] + withPlaceholder.increasedBy[axis.line],
    };
  }
  return target;
};

const clip = (target: Spacing, frame: ?ScrollableMap): ?Rect => {
  // TODO: check what it is for
  // looks like it is done to clip if frame has more width or height that pageMarginBox; not sure how it could happen
  /* if (frame && frame.shouldClipSubject) {
    return executeClip(frame.pageMarginBox, target);
  } */

  if (!frame) {
    return null;
  }

  return getRect(target);
};

type Args = {|
  page: BoxModel,
  withPlaceholder: ?PlaceholderInSubject,
  axis: Axis,
  frame: ?ScrollableMap,
|};

export default ({
  page,
  withPlaceholder,
  axis,
  frame,
}: Args): DroppableSubject => {
  // calculate here page offset by frame scroll
  // looks like page is dimensions of the container
  // so we are calculating frame displacement here in comparsion to page
  const scrolled: Spacing = scroll(page.marginBox, frame);
  // add placeholder to frame size if placeholder exists
  const increased: Spacing = increase(scrolled, axis, withPlaceholder);
  // calculate here active area position inside frame
  // other words displacement of page in relation to frame
  // in case if droppable is not visible on the page - active will be null
  const clipped: ?Rect = clip(increased, frame);

  return {
    page,
    withPlaceholder,
    active: clipped,
  };
};
