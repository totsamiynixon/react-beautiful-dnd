// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/multiple-parent-scroll/board';
import { generateQuoteMap } from './src/data';
// import { Draggable, Droppable, DragDropContext } from '../src';

const data = {
  medium: generateQuoteMap(100),
  large: generateQuoteMap(500),
};

class App extends React.Component {
  render() {
      console.log('scroll jump request has new position and droppableId dimensions, jump-scroller checks if we can scroll droppable a little bit - if yes - recalculate viewport?')
      //фрейм должен считаться исходя из позиции внешнего скролл контейнера? - похоже придется считать фреймы для каждого родителя, который может скролиться
      console.log(`по идее если у нас будет несколько скролл контейнеров и при этом не меняется window - 
      нужно пересчитывать scroll по x и y как сумму всех скроллов данного контейнера по этим осям`);
      //похоже, что subject.active отвечает за то, является ли droppable видимым элемент на экране и можно ли дропнуть в него
      //state.current отвечает за позицию draggable элемента на экране
      //самый важный момент - для пересчета видимой зоны достаточно изменения или viewport.frame + viewport.scroll или droppable.frame.scroll
      //таким образом для пересчета видимой зоны при множественных родителях достаточно будет изменения viewport.frame + viewport.scroll (уже работает) и изменения droppable.scrollableContainer.frame.scroll
      //это позволит пересчитать subject.active, а вот как это будет рабоать - пока вопрос открытый
      //subject.active отвечат за hit area - т.е. за положение и размер той зоны, в которую можно дропнуть для данного droppable. если такой зоны нет - subject.active будет равен null

      //потенциальный алгоритм решения проблемы
      //1. записываем в scrollableContainers frame для каждого контейнера, это поможет нам триггерить функцию автоскролла
      //1.1 нужно будет понять, какой scrollableContainer нужно скроллить, т.к. это может быть угол и позиция элемента будет близка к обоим
      //1.2 скроллим внутренний до упора по оси, потом внешний и так по рекурсии
      //1.3 возможно заэкстендить текущую функцию, чтобы она считала позицию в вьюпорте оносительно всех frames
      //2. viewport - это самый верхний контейнер, который скроллится
      //3. current.viewport - это размер + позиция самого верхнего контейнера с учетом скролла
      //4. нужна функция, которая будет считать полную и частичную видимость элемента с учетом всех скроллов относительно viewport.current
    return <Board initial={data.medium} />;
  }
}

storiesOf('Troubleshoot example', module).add('debug example', () => <App></App>);
