import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column as ColumnType, Task } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  index: number;
}

export function Column({ column, tasks, onAddTask, onEditTask, onDeleteTask, index }: ColumnProps) {
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex flex-col w-72 sm:w-80 md:w-[350px] shrink-0"
        >
          <div
            className="rounded-lg p-3 sm:p-4 flex flex-col h-full"
            style={{ backgroundColor: 'var(--column-bg)' }}
          >
            <div {...provided.dragHandleProps} className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl" style={{ color: 'var(--text-primary)' }}>{column.title}</h2>
                <span 
                  className="px-2 py-0.5 sm:py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: 'var(--primary-color)',
                    color: 'white'
                  }}
                >
                  {tasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(column.id)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-black/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Droppable droppableId={column.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[150px] sm:min-h-[200px] transition-colors duration-200 rounded-md p-1 sm:p-2 ${
                    snapshot.isDraggingOver ? 'bg-black/5' : ''
                  }`}
                >
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskCard
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
}
