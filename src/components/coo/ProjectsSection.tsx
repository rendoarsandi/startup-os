import * as api from '../../lib/server-functions'
import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
  dueDate: string | null;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assignedEmployeeId: string | null;
  status: 'todo' | 'in_progress' | 'done';
  hoursLogged: number;
}

export const ProjectsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjId, setSelectedProjId] = useState('');
  const [isProjOpen, setIsProjOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDue, setProjDue] = useState('');

  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logTaskId, setLogTaskId] = useState('');
  const [logHours, setLogHours] = useState('');

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ['employees'], queryFn: () => api.listEmployees() });

  const { data: projects = [], isLoading: _projLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.listProjects();

      const data = await res;
      if (data.length > 0 && !selectedProjId) {
        setSelectedProjId(data[0].id);
      }
      return data;
    }
  });

  const { data: tasks = [] } = useQuery<ProjectTask[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.listTasks();

      return res;
    }
  });

  const createProjMutation = useMutation({
    mutationFn: async (projData: any) => {
      const res = await api.createProject({ data: projData });

      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (data.id) setSelectedProjId(data.id);
      setIsProjOpen(false);
      setProjName('');
      setProjDesc('');
      setProjDue('');
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await api.createTask({ data: taskData });

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsTaskOpen(false);
      setTaskTitle('');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'todo' | 'in_progress' | 'done' }) => {
      const res = await api.updateTaskStatus({ data: { id: id, payload: { status } } });

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const logHoursMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) => {
      const res = await api.logTaskHours({ data: { id: id, payload: { hours } } });

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsLogOpen(false);
      setLogHours('');
    }
  });

  const getEmpName = (id: string | null) => {
    if (!id) return "Unassigned";
    return employees.find(e => e.id === id)?.name || "Unassigned";
  };

  const handleProjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    createProjMutation.mutate({
      name: projName,
      description: projDesc,
      dueDate: projDue || null
    });
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProjId) return;
    createTaskMutation.mutate({
      projectId: selectedProjId,
      title: taskTitle,
      assignedEmployeeId: taskAssignee || null
    });
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTaskId || !logHours) return;
    logHoursMutation.mutate({
      id: logTaskId,
      hours: parseFloat(logHours)
    });
  };

  const filteredTasks = tasks.filter(t => t.projectId === selectedProjId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Select value={selectedProjId} onValueChange={setSelectedProjId}>
            <SelectTrigger className="w-[260px] bg-card">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsProjOpen(true)} variant="outline" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Project
          </Button>
        </div>
        <Button onClick={() => setIsTaskOpen(true)} disabled={!selectedProjId} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['todo', 'in_progress', 'completed'] as const).map(colStatus => (
          <Card key={colStatus} className="p-4 border border-border/50 bg-card rounded-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h4 className="font-semibold text-xs capitalize text-muted-foreground tracking-wider">
                {colStatus === 'todo' ? 'To Do' : colStatus === 'in_progress' ? 'In Progress' : 'Completed'}
              </h4>
              <Badge variant="secondary" className="text-xs font-mono">
                {filteredTasks.filter(t => t.status === colStatus).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.status === colStatus).map(t => (
                <div key={t.id} className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-2">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getEmpName(t.assignedEmployeeId)}</span>
                    <div className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{t.hoursLogged}h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-indigo-500 hover:text-indigo-600 px-1"
                      onClick={() => { setLogTaskId(t.id); setIsLogOpen(true); }}
                    >
                      Log Hours
                    </Button>
                    <Select value={t.status} onValueChange={status => { if (status === 'todo' || status === 'in_progress' || status === 'done') updateTaskMutation.mutate({ id: t.id, status }) }}>
                      <SelectTrigger className="h-6 text-[10px] w-[110px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* New Project Dialog */}
      <Dialog open={isProjOpen} onOpenChange={setIsProjOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
          <form onSubmit={handleProjSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Project Name *</label>
              <Input placeholder="Website Redesign Q3" value={projName} onChange={e => setProjName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Input placeholder="Deliverables and overview..." value={projDesc} onChange={e => setProjDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Due Date</label>
              <Input type="date" value={projDue} onChange={e => setProjDue(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Create Project</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Project Task</DialogTitle></DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Task Title *</label>
              <Input placeholder="Create Figma Design System" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assigned Employee</label>
              <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Add Task</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Hours Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Work Hours</DialogTitle></DialogHeader>
          <form onSubmit={handleLogSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Hours Spent *</label>
              <Input type="number" step="0.5" placeholder="3.5" value={logHours} onChange={e => setLogHours(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Hours</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
