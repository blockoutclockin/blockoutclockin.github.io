import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

/** Task card:
 *  - add multiple subtasks inline (no dropdown)
 *  - edit subtasks inline (no delete)
 *  - checkbox to complete subtasks
 *  - mark-done for tasks with no subtasks
 *  - reopen button for inactive tasks
 *  - fully responsive (no overflow on small screens)
 */
const TaskCard = ({
  task,
  subs,
  isInactive = false,
  onAddSubtask,
  onToggleSubtaskDone,
  onUpdateSubtaskTitle,
  onToggleTaskDoneNoSubs,
  onReopenTask,
}) => {
  const [newSub, setNewSub] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const hasSubs = subs.length > 0;

  const startEdit = (sub) => {
    setEditingId(sub.id);
    setEditValue(sub.title);
  };

  const saveEdit = async (sub) => {
    const v = editValue.trim();
    if (!v || v === sub.title) {
      setEditingId(null);
      return;
    }
    await onUpdateSubtaskTitle(sub, v);
    setEditingId(null);
  };

  return (
    <div className="p-4 border rounded-2xl">
      {/* Stack on mobile; split on sm+; prevent overflow with min-w-0/shrink-0 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left: content */}
        <div className="min-w-0 flex-1">
          <div className="font-semibold break-words">{task.title}</div>

          {/* Subtasks list */}
          {hasSubs ? (
            <ul className="mt-2 space-y-1">
              {subs.map((s) => {
                const isEditing = editingId === s.id;
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-2">
                    {/* checkbox */}
                    <input
                      type="checkbox"
                      checked={!!s.completed_at}
                      onChange={() => onToggleSubtaskDone(s)}
                      className="shrink-0"
                    />

                    {/* title or editor */}
                    {isEditing ? (
                      <input
                        autoFocus
                        className="flex-1 min-w-0 bg-transparent border rounded-lg p-1 px-2"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(s);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span
                        className={`flex-1 min-w-0 break-words ${s.completed_at ? 'opacity-70 line-through' : ''}`}
                        title={s.title}
                      >
                        {s.title}
                      </span>
                    )}

                    {/* controls (wrap on small) */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="px-2 py-1 border rounded-md hover:border-[var(--border)]"
                          onClick={() => saveEdit(s)}
                        >
                          save
                        </button>
                        <button
                          className="px-2 py-1 border rounded-md hover:border-[var(--border)]"
                          onClick={() => setEditingId(null)}
                        >
                          cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="px-2 py-1 border rounded-md hover:border-[var(--border)]"
                          onClick={() => startEdit(s)}
                        >
                          edit
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm opacity-70">no subtasks</p>
          )}

          {/* Add subtask (active tasks only) */}
          {!isInactive && (
            <form
              className="mt-3 flex flex-col sm:flex-row gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const v = newSub.trim();
                if (!v) return;
                await onAddSubtask(task, v);
                setNewSub('');
              }}
            >
              <input
                className="flex-1 bg-transparent border rounded-lg p-2"
                placeholder="add a subtask…"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
              />
              <button className="px-3 py-2 border rounded-lg hover:border-[var(--border)] w-full sm:w-auto">
                add
              </button>
            </form>
          )}
        </div>

        {/* Right: actions (stays right on sm+, stacks below on mobile) */}
        {!hasSubs && !isInactive && (
          <div className="sm:self-start shrink-0">
            <button
              className="px-3 py-1.5 border rounded-lg hover:border-[var(--border)] w-full sm:w-auto"
              onClick={() => onToggleTaskDoneNoSubs(task)}
            >
              {task.completed_at ? 'Reopen' : 'mark done'}
            </button>
          </div>
        )}

        {isInactive && (
          <div className="sm:self-start shrink-0">
            <button
              className="px-3 py-1.5 border rounded-lg hover:border-[var(--border)] w-full sm:w-auto"
              onClick={() => onReopenTask(task)}
            >
              Reopen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Tasks = () => {
  const { session } = UserAuth();
  const userId = session?.user?.id;

  const [tasks, setTasks] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [tTitle, setTTitle] = useState('');

  const loadAll = async () => {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    const [{ data: t, error: te }, { data: s, error: se }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('subtasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    ]);
    if (te || se) setErr(te?.message || se?.message);
    setTasks(t || []);
    setSubs(s || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-line */ }, [userId]);

  const subsByTask = useMemo(() => {
    const m = new Map();
    subs.forEach((s) => {
      if (!m.has(s.task_id)) m.set(s.task_id, []);
      m.get(s.task_id).push(s);
    });
    return m;
  }, [subs]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed_at),
    [tasks]
  );

  const inactiveTasks = useMemo(
    () =>
      tasks
        .filter((t) => !!t.completed_at)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)),
    [tasks]
  );

  // --- Mutations ---

  const addTask = async (e) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    const { error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, title: tTitle.trim() });
    if (error) return alert(error.message);
    setTTitle('');
    loadAll();
  };

  const addSubtaskToTask = async (task, title) => {
    const { error } = await supabase
      .from('subtasks')
      .insert({ user_id: userId, task_id: task.id, title });
    if (error) return alert(error.message);
    loadAll();
  };

  const toggleSubtaskDone = async (sub) => {
    const next = sub.completed_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('subtasks')
      .update({ completed_at: next })
      .eq('id', sub.id)
      .eq('user_id', userId);
    if (error) return alert(error.message);
    loadAll(); // trigger should update parent task if all subs complete
  };

  const updateSubtaskTitle = async (sub, title) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ title })
      .eq('id', sub.id)
      .eq('user_id', userId);
    if (error) return alert(error.message);
    loadAll();
  };

  const toggleTaskDoneNoSubs = async (task) => {
    const hasSubs = (subsByTask.get(task.id) || []).length > 0;
    if (hasSubs) return;
    const next = task.completed_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('tasks')
      .update({ completed_at: next })
      .eq('id', task.id)
      .eq('user_id', userId);
    if (error) return alert(error.message);
    loadAll();
  };

  const reopenTask = async (task) => {
    // Reopen task & all its subtasks
    const sids = (subsByTask.get(task.id) || []).map((s) => s.id);
    if (sids.length) {
      const { error: se } = await supabase
        .from('subtasks')
        .update({ completed_at: null })
        .in('id', sids)
        .eq('user_id', userId);
      if (se) return alert(se.message);
    }
    const { error: te } = await supabase
      .from('tasks')
      .update({ completed_at: null })
      .eq('id', task.id)
      .eq('user_id', userId);
    if (te) return alert(te.message);
    loadAll();
  };

  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">tasks</h1>
      {loading && <p>loading…</p>}
      {err && <p className="text-red-500">error: {err}</p>}

      {/* Create Task */}
      <section className="border rounded-3xl p-6">
        <h2 className="text-lg font-semibold mb-2">add a task</h2>
        <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 bg-transparent border rounded-lg p-3"
            placeholder="Task title"
            value={tTitle}
            onChange={(e) => setTTitle(e.target.value)}
          />
          <button className="px-4 py-2 border rounded-lg hover:border-[var(--border)] w-full sm:w-auto">
            add task
          </button>
        </form>
      </section>

      {/* Active tasks */}
      <section className="border rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">active tasks</h2>
        {!activeTasks.length && (
          <p className="opacity-80 text-sm">no active tasks.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {activeTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              subs={subsByTask.get(t.id) || []}
              isInactive={false}
              onAddSubtask={addSubtaskToTask}
              onToggleSubtaskDone={toggleSubtaskDone}
              onUpdateSubtaskTitle={updateSubtaskTitle}
              onToggleTaskDoneNoSubs={toggleTaskDoneNoSubs}
            />
          ))}
        </div>
      </section>

      {/* Inactive tasks */}
      <section className="border rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">inactive tasks</h2>
        {!inactiveTasks.length && (
          <p className="opacity-80 text-sm">no inactive tasks.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {inactiveTasks.map((t) => {
            const finished = t.completed_at ? new Date(t.completed_at) : null;
            return (
              <div key={t.id}>
                <div className="mb-2 text-xs opacity-70">
                  {finished && <>completed {finished.toLocaleDateString()}</>}
                </div>
                <TaskCard
                  task={t}
                  subs={subsByTask.get(t.id) || []}
                  isInactive={true}
                  onAddSubtask={() => {}}
                  onToggleSubtaskDone={toggleSubtaskDone}
                  onUpdateSubtaskTitle={updateSubtaskTitle}
                  onToggleTaskDoneNoSubs={toggleTaskDoneNoSubs}
                  onReopenTask={reopenTask}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Tasks;
