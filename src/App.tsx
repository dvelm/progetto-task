import React, { useEffect, useState } from 'react';
import { Plus, Folder, CheckSquare, Tag as TagIcon, Trash2 } from 'lucide-react';

// --- Interfacce TypeScript ---
// Definiscono la struttura dei dati che ci aspettiamo dal backend
interface Project {
  id: number;
  name: string;
  budget: number;
  description: string;
  hours_used: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  tags: { id: number; name: string }[];
  projects: Project[];
}

export default function App() {
  // --- Stati del Componente ---
  const [projects, setProjects] = useState<Project[]>([]); // Lista dei progetti
  const [tasks, setTasks] = useState<Task[]>([]); // Lista dei task
  const [loading, setLoading] = useState(true); // Stato di caricamento iniziale
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects'); // Tab attiva (Progetti o Task)
  const [tagFilter, setTagFilter] = useState(''); // Filtro per i tag dei task

  // Effetto eseguito al primo caricamento del componente per recuperare i dati
  useEffect(() => {
    fetchData();
  }, []);

  // Effetto eseguito ogni volta che cambia il filtro dei tag o si passa alla tab dei task
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks(tagFilter);
    }
  }, [tagFilter, activeTab]);

  // --- Funzioni di Fetching ---
  // Recupera sia i progetti che i task in parallelo
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);
      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Errore nel recupero dei dati:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recupera i task, applicando eventualmente il filtro per tag
  const fetchTasks = async (tag: string) => {
    try {
      const url = tag ? `/api/tasks?tag=${encodeURIComponent(tag)}` : '/api/tasks';
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Errore nel recupero dei task:', error);
    }
  };

  // --- Funzioni di Creazione ---
  // Gestisce l'invio del form per creare un nuovo progetto
  const createProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita il ricaricamento della pagina
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      budget: Number(formData.get('budget')),
      description: formData.get('description'),
    };

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchData(); // Ricarica i dati dopo la creazione
      (e.target as HTMLFormElement).reset(); // Svuota il form
    } catch (error) {
      console.error('Errore nella creazione del progetto:', error);
    }
  };

  // Gestisce l'invio del form per creare un nuovo task
  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Converte la stringa dei tag separati da virgola in un array pulito
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    // Converte la stringa degli ID progetto in un array di numeri
    const projectIdsString = formData.get('projectIds') as string;
    const projectIds = projectIdsString ? projectIdsString.split(',').map(id => Number(id.trim())).filter(Boolean) : [];

    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      tags,
      projectIds,
    };

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Errore nella creazione del task:', error);
    }
  };

  // --- Funzioni di Eliminazione ---
  const deleteProject = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo progetto?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Errore nell\'eliminazione del progetto:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Errore nell\'eliminazione del task:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Caricamento...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project & Task Manager</h1>
          <p className="text-gray-500 mt-2">Gestione progetti e task per programmi europei</p>
        </header>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'projects' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Folder className="inline-block w-5 h-5 mr-2" />
            Progetti
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="inline-block w-5 h-5 mr-2" />
            Task
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'projects' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">I tuoi Progetti</h2>
                {projects.length === 0 ? (
                  <p className="text-gray-500 italic">Nessun progetto trovato.</p>
                ) : (
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div key={project.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{project.name} <span className="text-sm font-normal text-gray-500 ml-2">#ID: {project.id}</span></h3>
                            <p className="text-gray-600 mt-1">{project.description}</p>
                            <div className="mt-3 flex space-x-4 text-sm text-gray-500">
                              <span>Budget: €{project.budget}</span>
                              <span>Ore usate: {project.hours_used}h</span>
                            </div>
                          </div>
                          <button onClick={() => deleteProject(project.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">I tuoi Task</h2>
                  <div className="flex items-center space-x-2">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filtra per tag..."
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-gray-500 italic">Nessun task trovato.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                            <p className="text-gray-600 mt-1">{task.description}</p>
                            
                            {task.projects?.length > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                <strong>Progetti:</strong> {task.projects.map(p => p.name).join(', ')}
                              </div>
                            )}

                            {task.tags?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {task.tags.map(tag => (
                                  <span key={tag.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Forms */}
          <div className="space-y-6">
            {activeTab === 'projects' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Nuovo Progetto
                </h2>
                <form onSubmit={createProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input required name="name" type="text" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
                    <input required name="budget" type="number" step="0.01" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                    <textarea name="description" rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition-colors">
                    Crea Progetto
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Nuovo Task
                </h2>
                <form onSubmit={createTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                    <input required name="title" type="text" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                    <textarea name="description" rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separati da virgola)</label>
                    <input name="tags" type="text" placeholder="es. frontend, bug" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Progetti (separati da virgola)</label>
                    <input name="projectIds" type="text" placeholder="es. 1, 2" className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition-colors">
                    Crea Task
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
