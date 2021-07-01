// @flow
import { type Position } from 'css-box-model';
import { invariant } from '../../invariant';
import type {
  Axis,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  ScrollableMap,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../types';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { add, patch } from '../position';
import getSubject from './util/get-subject';
import isHomeOf from './is-home-of';
import getDisplacedBy from '../get-displaced-by';

const getRequiredGrowthForPlaceholder = (
  droppable: DroppableDimension,
  placeholderSize: Position,
  draggables: DraggableDimensionMap,
): ?Position => {
  const axis: Axis = droppable.axis;

  // A virtual list will most likely not contain all of the Draggables
  // so counting them does not help.
  if (droppable.descriptor.mode === 'virtual') {
    return patch(axis.line, placeholderSize[axis.line]);
  }

  // TODO: consider margin collapsing?
  // Using contentBox as that is where the Draggables will sit
  const availableSpace: number = droppable.subject.page.contentBox[axis.size];
  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable.descriptor.id,
    draggables,
  );
  const spaceUsed: number = insideDroppable.reduce(
    (sum: number, dimension: DraggableDimension): number =>
      sum + dimension.client.marginBox[axis.size],
    0,
  );
  const requiredSpace: number = spaceUsed + placeholderSize[axis.line];
  const needsToGrowBy: number = requiredSpace - availableSpace;

  // nothing to do here
  if (needsToGrowBy <= 0) {
    return null;
  }

  return patch(axis.line, needsToGrowBy);
};

const withMaxScroll = (frame: Scrollable, max: Position): Scrollable => ({
  ...frame,
  scroll: {
    ...frame.scroll,
    max,
  },
});

export const addPlaceholder = (
  droppable: DroppableDimension,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
): DroppableDimension => {
  const frame: ?ScrollableMap = droppable.frame;

  invariant(
    !isHomeOf(draggable, droppable),
    'Should not add placeholder space to home list',
  );

  invariant(
    !droppable.subject.withPlaceholder,
    'Cannot add placeholder size to a subject when it already has one',
  );

  const placeholderSize: Position = getDisplacedBy(
    droppable.axis,
    draggable.displaceBy,
  ).point;

  const requiredGrowth: ?Position = getRequiredGrowthForPlaceholder(
    droppable,
    placeholderSize,
    draggables,
  );

  const closestFrameScrollableId = Object.keys(droppable.frame)[
    // eslint-disable-next-line es5/no-es6-methods
    Object.keys(droppable.frame).length - 1
  ];

  const closestFrame = droppable.frame[closestFrameScrollableId];
  /*   ? // eslint-disable-next-line es5/no-es6-methods
      Object.values(droppable.frame)[
        // eslint-disable-next-line es5/no-es6-methods
        Object.values(droppable.frame).length - 1
      ]
    : null; // get here scrollable that is parent of a droppable?
 */
  // TODO: refactor that
  const added: PlaceholderInSubject = {
    placeholderSize,
    increasedBy: requiredGrowth,
    oldFrameMaxScroll: closestFrame,
  };

  // TODO: check how it works
  if (!closestFrame) {
    const subject: DroppableSubject = getSubject({
      page: droppable.subject.page,
      withPlaceholder: added,
      axis: droppable.axis,
      frame: droppable.frame,
    });
    return {
      ...droppable,
      subject,
    };
  }

  const maxScroll: Position = requiredGrowth
    ? add(closestFrame.scroll.max, requiredGrowth)
    : closestFrame.scroll.max;

  const newFrame: ScrollableMap = {
    ...frame,
    [closestFrameScrollableId]: withMaxScroll(closestFrame, maxScroll),
  };

  const subject: DroppableSubject = getSubject({
    page: droppable.subject.page,
    withPlaceholder: added,
    axis: droppable.axis,
    frame: newFrame,
  });
  return {
    ...droppable,
    subject,
    frame: newFrame,
  };
};

export const removePlaceholder = (
  droppable: DroppableDimension,
): DroppableDimension => {
  const added: ?PlaceholderInSubject = droppable.subject.withPlaceholder;
  invariant(
    added,
    'Cannot remove placeholder form subject when there was none',
  );

  const frame: ?ScrollableMap = droppable.frame;

  const closestFrameScrollableId = Object.keys(frame)[
    // eslint-disable-next-line es5/no-es6-methods
    Object.keys(frame).length - 1
  ];

  const closestFrame = droppable.frame[closestFrameScrollableId];

  // TODO: check how it works
  if (true) {
    const subject: DroppableSubject = getSubject({
      page: droppable.subject.page,
      axis: droppable.axis,
      frame: null,
      // cleared
      withPlaceholder: null,
    });
    return {
      ...droppable,
      subject,
    };
  }

  const oldMaxScroll: ?Position = added.oldFrameMaxScroll;
  invariant(
    oldMaxScroll,
    'Expected droppable with frame to have old max frame scroll when removing placeholder',
  );

  const newFrame: ScrollableMap = {
    ...frame,
    [closestFrameScrollableId]: withMaxScroll(closestFrame, oldMaxScroll),
  };

  const subject: DroppableSubject = getSubject({
    page: droppable.subject.page,
    axis: droppable.axis,
    frame: newFrame,
    // cleared
    withPlaceholder: null,
  });
  return {
    ...droppable,
    subject,
    frame: newFrame,
  };
};
