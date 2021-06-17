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
    return <Board initial={data.medium} />;
  }
}

storiesOf('Troubleshoot example', module).add('debug example', () => <App></App>);
