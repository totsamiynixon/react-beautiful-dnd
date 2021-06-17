// @flow
import { getRect, type Rect, type Spacing, type BoxModel } from 'css-box-model';
import type {
  Axis,
  Scrollable,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../../types';
import executeClip from './clip';
import { offsetByPosition } from '../../spacing';

const scroll = (target: Spacing, frame: ?Scrollable): Spacing => {
  if (!frame) {
    return target;
  }

  return offsetByPosition(target, frame.scroll.diff.displacement);
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

const clip = (target: Spacing, frame: ?Scrollable): ?Rect => {
  if (frame && frame.shouldClipSubject) {
    return executeClip(frame.pageMarginBox, target);
  }
  return getRect(target);
};

type Args = {|
  page: BoxModel,
  withPlaceholder: ?PlaceholderInSubject,
  axis: Axis,
  frame: ?Scrollable,
|};

export default ({
  page,
  withPlaceholder,
  axis,
  frame,
}: Args): DroppableSubject => {
  //calculate here page offset by frame scroll
  //looks like page is dimensions of the container
  //so we are calculating container displacement here
  const scrolled: Spacing = scroll(page.marginBox, frame);
  //add placeholder displacement if placeholder exists
  const increased: Spacing = increase(scrolled, axis, withPlaceholder);
  //calculate here active area position inside frame
  //other words displacement of page in relation to frame
  const clipped: ?Rect = clip(increased, frame);

  return {
    page,
    withPlaceholder,
    active: clipped,
  };
};
