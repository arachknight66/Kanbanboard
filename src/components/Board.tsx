import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { BoardData, Task } from '../types';
import { Column } from './Column';

interface BoardProps {
  boardData: BoardData;
  onDragEnd: (result: DropResult) => void;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function Board({ boardData, onDragEnd, onAddTask, onEditTask, onDeleteTask }: BoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="column">
        {(provided) => (
          <div
            className="flex gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-auto h-full"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {boardData.columnOrder.map((columnId, index) => {
              const column = boardData.columns[columnId];
              const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]);

              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={tasks}
                  index={index}
                  onAddTask={onAddTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
