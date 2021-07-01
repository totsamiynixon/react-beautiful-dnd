// @flow
import getClosestScrollable from './get-closest-scrollable';

export type EnvScrollalbeIdElementMap = { [key: ScrollableId]: Element };

export type Env = {|
  scrollables: EnvScrollalbeIdElementMap,
  isFixedOnPage: boolean,
|};

// TODO: do this check at the same time as the closest scrollable
// in order to avoid double calling getComputedStyle
// Do this when we move to multiple scroll containers
const getIsFixed = (el: ?Element): boolean => {
  if (!el) {
    return false;
  }
  const style: CSSStyleDeclaration = window.getComputedStyle(el);
  if (style.position === 'fixed') {
    return true;
  }
  return getIsFixed(el.parentElement);
};

const generateUniqueId = () =>
  `scrollable_${Math.random().toString(36).substr(2, 9)}`;

export default (start: Element): Env => {
  const scrollables: EnvScrollalbeIdElementMap = {};
  const closestCrollables = (element: Element) => {
    const closestScrollable: ?Element = getClosestScrollable(element);
    if (!closestScrollable) {
      return;
    }
    const uniqueId = generateUniqueId();
    scrollables[uniqueId] = closestScrollable;
    if (closestScrollable && closestScrollable.parentElement) {
      closestCrollables(closestScrollable.parentElement);
    }
  };
  closestCrollables(start);
  const isFixedOnPage: boolean =
    // eslint-disable-next-line es5/no-es6-methods
    Object.values(scrollables).filter((e) => getIsFixed(e)).length > 0;

  return {
    scrollables,
    isFixedOnPage,
  };
};
