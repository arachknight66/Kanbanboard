import { useState, useEffect } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Board } from './components/Board';
import { AddTaskDialog } from './components/AddTaskDialog';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { BoardData, Task } from './types';
import { initialData } from './utils/initialData';
import { saveBoardData, loadBoardData, saveTheme, loadTheme } from './utils/storage';
import { getTheme, themes } from './utils/themes';
import { Kanban, Plus } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

export default function App() {
  const [boardData, setBoardData] = useState<BoardData>(() => {
    const saved = loadBoardData();
    return saved || initialData;
  });

  const [themeName, setThemeName] = useState<string>(() => {
    return loadTheme() || themes[0].name;
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const theme = getTheme(themeName);

  // Apply theme CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--background-color', theme.background);
    document.documentElement.style.setProperty('--card-bg', theme.cardBg);
    document.documentElement.style.setProperty('--column-bg', theme.columnBg);
    document.documentElement.style.setProperty('--text-primary', theme.textPrimary);
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
    document.body.style.backgroundColor = theme.background;
  }, [theme]);

  // Save board data whenever it changes
  useEffect(() => {
    saveBoardData(boardData);
  }, [boardData]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === 'column') {
      const newColumnOrder = Array.from(boardData.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      setBoardData({
        ...boardData,
        columnOrder: newColumnOrder,
      });
      return;
    }

    // Handle task reordering
    const startColumn = boardData.columns[source.droppableId];
    const finishColumn = boardData.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      // Moving within the same column
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      setBoardData({
        ...boardData,
        columns: {
          ...boardData.columns,
          [newColumn.id]: newColumn,
        },
      });
    } else {
      // Moving to a different column
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStartColumn = {
        ...startColumn,
        taskIds: startTaskIds,
      };

      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinishColumn = {
        ...finishColumn,
        taskIds: finishTaskIds,
      };

      // Update task's columnId
      const updatedTask = {
        ...boardData.tasks[draggableId],
        columnId: finishColumn.id,
      };

      setBoardData({
        ...boardData,
        tasks: {
          ...boardData.tasks,
          [draggableId]: updatedTask,
        },
        columns: {
          ...boardData.columns,
          [newStartColumn.id]: newStartColumn,
          [newFinishColumn.id]: newFinishColumn,
        },
      });

      toast.success(`Moved to ${finishColumn.title}`);
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedColumnId(null);
    setDialogOpen(true);
  };

  const handleSaveTask = (title: string, description: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    if (editingTask) {
      // Update existing task
      const updatedTask = {
        ...editingTask,
        title,
        description,
        priority,
      };

      setBoardData({
        ...boardData,
        tasks: {
          ...boardData.tasks,
          [editingTask.id]: updatedTask,
        },
      });

      toast.success('Task updated successfully');
    } else if (selectedColumnId) {
      // Create new task
      const newTaskId = `task-${Date.now()}`;
      const newTask: Task = {
        id: newTaskId,
        title,
        description,
        columnId: selectedColumnId,
        createdAt: new Date().toISOString(),
        priority,
      };

      const column = boardData.columns[selectedColumnId];
      const newTaskIds = [...column.taskIds, newTaskId];

      setBoardData({
        ...boardData,
        tasks: {
          ...boardData.tasks,
          [newTaskId]: newTask,
        },
        columns: {
          ...boardData.columns,
          [selectedColumnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      });

      toast.success('Task created successfully');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = boardData.tasks[taskId];
    const column = boardData.columns[task.columnId];
    const newTaskIds = column.taskIds.filter((id) => id !== taskId);

    const newTasks = { ...boardData.tasks };
    delete newTasks[taskId];

    setBoardData({
      ...boardData,
      tasks: newTasks,
      columns: {
        ...boardData.columns,
        [column.id]: {
          ...column,
          taskIds: newTaskIds,
        },
      },
    });

    toast.success('Task deleted successfully');
  };

  const handleThemeChange = (newThemeName: string) => {
    setThemeName(newThemeName);
    saveTheme(newThemeName);
    toast.success(`Theme changed to ${newThemeName}`);
  };

  const handleQuickAdd = () => {
    setSelectedColumnId('column-1');
    setEditingTask(null);
    setDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <header 
        className="border-b px-3 py-3 sm:px-6 sm:py-4 shrink-0"
        style={{ 
          backgroundColor: theme.cardBg,
          borderColor: 'rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div 
              className="p-1.5 sm:p-2 rounded-lg shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              <Kanban className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Kanban Board</h1>
              <p className="text-xs sm:text-sm hidden xs:block truncate" style={{ color: 'var(--text-secondary)' }}>
                Organize your tasks with drag-and-drop
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button 
              onClick={handleQuickAdd}
              style={{ backgroundColor: theme.primary }}
              className="text-white hover:opacity-90 h-8 sm:h-10 px-2 sm:px-4"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
            <ThemeSwitcher currentTheme={themeName} onThemeChange={handleThemeChange} />
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <Board
          boardData={boardData}
          onDragEnd={handleDragEnd}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      {/* Add/Edit Task Dialog */}
      <AddTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTask}
        editTask={editingTask}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
