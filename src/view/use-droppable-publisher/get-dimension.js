// @flow
import {
  getBox,
  withScroll,
  createBox,
  expand,
  type BoxModel,
  type Position,
  type Spacing,
} from 'css-box-model';
import getDroppableDimension, {
  type Closest,
  type ClosestScrollableMap,
} from '../../state/droppable/get-droppable';
import type { Env } from './get-env';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollSize,
} from '../../types';
import getScroll from './get-scroll';

const getClient = (
  targetRef: HTMLElement,
  closestScrollable: ?Element,
): BoxModel => {
  const base: BoxModel = getBox(targetRef);

  // Droppable has no scroll parent
  if (!closestScrollable) {
    return base;
  }

  // Droppable is not the same as the closest scrollable
  if (targetRef !== closestScrollable) {
    return base;
  }

  // Droppable is scrollable

  // Element.getBoundingClient() returns a clipped padding box:
  // When not scrollable: the full size of the element
  // When scrollable: the visible size of the element
  // (which is not the full width of its scrollable content)
  // So we recalculate the borderBox of a scrollable droppable to give
  // it its full dimensions. This will be cut to the correct size by the frame

  // Creating the paddingBox based on scrollWidth / scrollTop
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight

  //looks like here offsetOf
  const top: number = base.paddingBox.top - closestScrollable.scrollTop;
  const left: number = base.paddingBox.left - closestScrollable.scrollLeft;
  const bottom: number = top + closestScrollable.scrollHeight;
  const right: number = left + closestScrollable.scrollWidth;

  // unclipped padding box
  const paddingBox: Spacing = {
    top,
    right,
    bottom,
    left,
  };

  // Creating the borderBox by adding the borders to the paddingBox
  const borderBox: Spacing = expand(paddingBox, base.border);

  // We are not accounting for scrollbars
  // Adjusting for scrollbars is hard because:
  // - they are different between browsers
  // - scrollbars can be activated and removed during a drag
  // We instead account for this slightly in our auto scroller

  const client: BoxModel = createBox({
    borderBox,
    margin: base.margin,
    border: base.border,
    padding: base.padding,
  });
  return client;
};

type Args = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  windowScroll: Position,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  shouldClipSubject: boolean,
|};

export default ({
  ref,
  descriptor,
  env,
  windowScroll,
  direction,
  isDropDisabled,
  isCombineEnabled,
  shouldClipSubject,
}: Args): DroppableDimension => {
  // looks like here dimensions recalculared
  // what if i will run this function to recalculate dimension for each scrollable
  // then i need to run function that calculate subject for all
  // then i need to rewrite visibility algorythms to calculate visibility of element in every single scroll container
  const closestScrollable: ?Element = Object.values(env.scrollables)[
    Object.values(env.scrollables).length - 1
  ];
  const client: BoxModel = getClient(ref, closestScrollable);
  const page: BoxModel = withScroll(client, windowScroll);

  const closest: ?Closest = (scrollable: Element) => {
    const frameClient: BoxModel = getBox(scrollable);
    const scrollSize: ScrollSize = {
      scrollHeight: scrollable.scrollHeight,
      scrollWidth: scrollable.scrollWidth,
    };

    return {
      client: frameClient,
      page: withScroll(frameClient, windowScroll),
      scroll: getScroll(scrollable),
      scrollSize,
      shouldClipSubject,
    };
  };

  const closestMap: ClosestScrollableMap = {};

  for (const scrollableId in env.scrollables) {
    if (Object.prototype.hasOwnProperty.call(env.scrollables, scrollableId)) {
      const scrollable = env.scrollables[scrollableId];
      closestMap[scrollableId] = closest(scrollable);
    }
  }

  const dimension: DroppableDimension = getDroppableDimension({
    descriptor,
    isEnabled: !isDropDisabled,
    isCombineEnabled,
    isFixedOnPage: env.isFixedOnPage,
    direction,
    client,
    page,
    closestMap,
  });

  return dimension;
};
