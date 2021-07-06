// @flow
import { useRef } from 'react';
import { type Position } from 'css-box-model';
import rafSchedule from 'raf-schd';
import { useMemo, useCallback } from 'use-memo-one';
import memoizeOne from 'memoize-one';
import { find } from '../../native-with-fallback';
import { invariant } from '../../invariant';
import checkForNestedScrollContainers from './check-for-nested-scroll-container';
import * as dataAttr from '../data-attributes';
import { origin } from '../../state/position';
import getScroll from './get-scroll';
import type {
  DroppableEntry,
  DroppableCallbacks,
} from '../../state/registry/registry-types';
import getEnv, { type Env, type EnvScrollable } from './get-env';
import type {
  Id,
  DroppableId,
  ScrollableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollOptions,
  DroppableMode,
} from '../../types';
import getDimension from './get-dimension';
import AppContext, { type AppContextValue } from '../context/app-context';
import { warning } from '../../dev-warning';
import getListenerOptions from './get-listener-options';
import useRequiredContext from '../use-required-context';
import usePreviousRef from '../use-previous-ref';
import useLayoutEffect from '../use-isomorphic-layout-effect';
import useUniqueId from '../use-unique-id';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  mode: DroppableMode,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  ignoreContainerClipping: boolean,
  getDroppableRef: () => ?HTMLElement,
|};

type WhileDragging = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  scrollOptions: ScrollOptions,
|};

const getScrollableFromDragById = (
  dragging: ?WhileDragging,
  scrollableId: ScrollableId,
): ?EnvScrollable =>
  dragging &&
  (find(
    dragging.env.scrollables,
    (scrollable) => scrollable.scrollableId === scrollableId,
  ) ||
    null);

export default function useDroppablePublisher(args: Props) {
  const whileDraggingRef = useRef<?WhileDragging>(null);
  const envRef = useRef<?Env>(null);
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const uniqueId: Id = useUniqueId('droppable');
  const { registry, marshal } = appContext;
  const previousRef = usePreviousRef(args);
  const scrollableScrollListenersRef = useRef({});

  const descriptor = useMemo<DroppableDescriptor>(
    () => ({
      id: args.droppableId,
      type: args.type,
      mode: args.mode,
    }),
    [args.droppableId, args.mode, args.type],
  );
  const publishedDescriptorRef = useRef<DroppableDescriptor>(descriptor);

  const memoizedUpdateScroll = useMemo(
    () =>
      memoizeOne((scrollableId: ScrollableId, x: number, y: number) => {
        invariant(
          whileDraggingRef.current,
          'Can only update scroll when dragging',
        );
        const scroll: Position = { x, y };
        marshal.updateDroppableScroll(descriptor.id, scrollableId, scroll);
      }),
    [descriptor.id, marshal],
  );

  const getScrollableScroll = useCallback(
    (scrollableId: ScrollableId): Position => {
      const dragging: ?WhileDragging = whileDraggingRef.current;
      if (!dragging) {
        return origin;
      }
      const scrollable = getScrollableFromDragById(dragging, scrollableId);
      invariant(
        scrollable,
        'Cannot get scroll for a scrollable when there is no associated item in env',
      );
      const closest: Element = scrollable.element;
      return getScroll(closest);
    },
    [],
  );

  const updateScroll = useCallback(
    (scrollableId: ScrollableId) => {
      // reading scroll value when called so value will be the latest
      const scroll: Position = getScrollableScroll(scrollableId);
      memoizedUpdateScroll(scrollableId, scroll.x, scroll.y);
    },
    [getScrollableScroll, memoizedUpdateScroll],
  );

  const scheduleScrollUpdate = useMemo(() => rafSchedule(updateScroll), [
    updateScroll,
  ]);

  const onScrollableScroll = useCallback(
    (scrollableId: ScrollableId) => () => {
      const dragging: ?WhileDragging = whileDraggingRef.current;
      const scrollable: Element = getScrollableFromDragById(
        dragging,
        scrollableId,
      );

      invariant(
        dragging && scrollable,
        'Could not find scroll options while scrolling',
      );
      const options: ScrollOptions = dragging.scrollOptions;
      if (options.shouldPublishImmediately) {
        updateScroll(scrollableId);
        return;
      }
      scheduleScrollUpdate(scrollableId);
    },
    [updateScroll, scheduleScrollUpdate],
  );

  const getDimensionAndWatchScroll = useCallback(
    (windowScroll: Position, options: ScrollOptions) => {
      invariant(
        !whileDraggingRef.current,
        'Cannot collect a droppable while a drag is occurring',
      );
      const previous: Props = previousRef.current;
      const ref: ?HTMLElement = previous.getDroppableRef();
      invariant(ref, 'Cannot collect without a droppable ref');
      const env: Env = getEnv(ref);

      // side effect
      envRef.current = env;

      const dragging: WhileDragging = {
        ref,
        descriptor,
        env,
        scrollOptions: options,
      };

      // side effect
      whileDraggingRef.current = dragging;

      const dimension: DroppableDimension = getDimension({
        ref,
        descriptor,
        env,
        windowScroll,
        direction: previous.direction,
        isDropDisabled: previous.isDropDisabled,
        isCombineEnabled: previous.isCombineEnabled,
        shouldClipSubject: !previous.ignoreContainerClipping,
      });

      const scrollables: EnvScrollable[] = env.scrollables;

      for (const scrollable of scrollables) {
        const scrollableId: ScrollableId = scrollable.scrollableId;

        scrollable.element.setAttribute(
          dataAttr.scrollContainer.contextId,
          appContext.contextId,
        );

        // bind scroll listener
        scrollableScrollListenersRef.current[scrollableId] = onScrollableScroll(
          scrollableId,
        );
        scrollable.element.addEventListener(
          'scroll',
          scrollableScrollListenersRef.current[scrollableId],
          getListenerOptions(dragging.scrollOptions),
        );
        // print a debug warning if using an unsupported nested scroll container setup
        if (process.env.NODE_ENV !== 'production') {
          checkForNestedScrollContainers(scrollable);
        }
      }

      return dimension;
    },
    [appContext.contextId, descriptor, previousRef, onScrollableScroll],
  );

  const getScrollWhileDragging = useCallback((): Position => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    const scrollable: ?EnvScrollable = getScrollableFromDragById(dragging);
    invariant(
      dragging && scrollable,
      'Can only recollect Droppable client for Droppables that have a scroll container',
    );

    return getScroll(scrollable.element);
  }, []);

  const dragStopped = useCallback(() => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    invariant(dragging, 'Cannot stop drag when no active drag');

    const env: ?Env = envRef.current;
    // that should never happen
    invariant(dragging, 'Cannot stop drag when no env drag');

    const scrollables: EnvScrollable[] = env.scrollables;

    for (const scrollable of scrollables) {
      const scrollableId: ScrollableId = scrollable.scrollableId;

      scrollable.element.removeAttribute(dataAttr.scrollContainer.contextId);
      scrollable.element.removeEventListener(
        'scroll',
        scrollableScrollListenersRef.current[scrollableId],
        getListenerOptions(dragging.scrollOptions),
      );
    }

    // goodbye old friend
    whileDraggingRef.current = null;
    // unwatch scroll
    scheduleScrollUpdate.cancel();
    // clear scroll event listeners
    scrollableScrollListenersRef.current = {};
  }, [scrollableScrollListenersRef, scheduleScrollUpdate]);

  const scroll = useCallback((change: Position, scrollableId: ScrollableId) => {
    // arrange
    const dragging: ?WhileDragging = whileDraggingRef.current;
    invariant(dragging, 'Cannot scroll when there is no drag');
    const scrollable: ?EnvScrollable = getScrollableFromDragById(
      dragging,
      scrollableId,
    );
    invariant(
      scrollable,
      'Cannot scroll a droppable when there is no associated item in env',
    );
    const closest: Element = scrollable.element;

    // act
    closest.scrollTop += change.y;
    closest.scrollLeft += change.x;
  }, []);

  const callbacks: DroppableCallbacks = useMemo(() => {
    return {
      getDimensionAndWatchScroll,
      getScrollWhileDragging,
      dragStopped,
      scroll,
    };
  }, [dragStopped, getDimensionAndWatchScroll, getScrollWhileDragging, scroll]);

  const entry: DroppableEntry = useMemo(
    () => ({
      uniqueId,
      descriptor,
      callbacks,
    }),
    [callbacks, descriptor, uniqueId],
  );

  // Register with the marshal and let it know of:
  // - any descriptor changes
  // - when it unmounts
  useLayoutEffect(() => {
    publishedDescriptorRef.current = entry.descriptor;
    registry.droppable.register(entry);

    return () => {
      if (whileDraggingRef.current) {
        warning(
          'Unsupported: changing the droppableId or type of a Droppable during a drag',
        );
        dragStopped();
      }

      registry.droppable.unregister(entry);
    };
  }, [callbacks, descriptor, dragStopped, entry, marshal, registry.droppable]);

  // update is enabled with the marshal
  // only need to update when there is a drag
  useLayoutEffect(() => {
    if (!whileDraggingRef.current) {
      return;
    }
    marshal.updateDroppableIsEnabled(
      publishedDescriptorRef.current.id,
      !args.isDropDisabled,
    );
  }, [args.isDropDisabled, marshal]);

  // update is combine enabled with the marshal
  // only need to update when there is a drag
  useLayoutEffect(() => {
    if (!whileDraggingRef.current) {
      return;
    }
    marshal.updateDroppableIsCombineEnabled(
      publishedDescriptorRef.current.id,
      args.isCombineEnabled,
    );
  }, [args.isCombineEnabled, marshal]);
}
