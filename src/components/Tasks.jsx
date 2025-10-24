import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

const Tasks = () => {
  const { session } = UserAuth();
  const userId = session?.user?.id;

  const [tasks, setTasks] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [tTitle, setTTitle] = useState('');
  const [sTitle, setSTitle] = useState('');
  const [targetTask, setTargetTask] = useState('');

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

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [userId]);

  const subsByTask = useMemo(() => {
    const m = new Map();
    subs.forEach(s => {
      if (!m.has(s.task_id)) m.set(s.task_id, []);
      m.get(s.task_id).push(s);
    });
    return m;
  }, [subs]);

  const activeTasks = useMemo(() => tasks.filter(t => !t.completed_at), [tasks]);
  const inactiveTasks = useMemo(() => tasks.filter(t => !!t.completed_at).sort(
    (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
  ), [tasks]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    const { error } = await supabase.from('tasks').insert({ user_id: userId, title: tTitle.trim() });
    if (error) return alert(error.message);
    setTTitle('');
    loadAll();
  };

  const addSubtask = async (e) => {
    e.preventDefault();
    if (!sTitle.trim() || !targetTask) return;
    const { error } = await supabase.from('subtasks').insert({
      user_id: userId, task_id: targetTask, title: sTitle.trim(),
    });
    if (error) return alert(error.message);
    setSTitle('');
    setTargetTask('');
    loadAll();
  };

  // Optional toggles to reopen or complete a single subtask/task:
  const toggleSubtaskDone = async (sub) => {
    const next = sub.completed_at ? null : new Date().toISOString();
    const { error } = await supabase.from('subtasks')
      .update({ completed_at: next })
      .eq('id', sub.id)
      .eq('user_id', userId);
    if (error) return alert(error.message);
    loadAll(); // trigger will resync the parent task status
  };

  const toggleTaskDoneNoSubs = async (task) => {
    // Only meaningful for tasks with NO subtasks; tasks with subtasks are governed by their subtasks
    const hasSubs = (subsByTask.get(task.id) || []).length > 0;
    if (hasSubs) return;
    const next = task.completed_at ? null : new Date().toISOString();
    const { error } = await supabase.from('tasks')
      .update({ completed_at: next })
      .eq('id', task.id)
      .eq('user_id', userId);
    if (error) return alert(error.message);
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
          <button className="px-4 py-2 border rounded-lg hover:border-[var(--border)]">
            add task
          </button>
        </form>
      </section>

      {/* Create Subtask */}
      <section className="border rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2">add a subtask</h2>
        <form onSubmit={addSubtask} className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <input
            className="bg-transparent border rounded-lg p-3"
            placeholder="Subtask title"
            value={sTitle}
            onChange={(e) => setSTitle(e.target.value)}
          />
          <select
            className="bg-[var(--bg)] text-[var(--fg)] border rounded-lg p-3"
            value={targetTask}
            onChange={(e) => setTargetTask(e.target.value)}
          >
            <option value="" disabled>select task…</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <button className="px-4 py-2 border rounded-lg hover:border-[var(--border)] sm:col-span-2">
            add subtask
          </button>
        </form>
      </section>

      {/* Active tasks */}
      <section className="border rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">active tasks</h2>
        {!activeTasks.length && <p className="opacity-80 text-sm">no active tasks.</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {activeTasks.map((t) => {
            const list = subsByTask.get(t.id) || [];
            const hasSubs = list.length > 0;
            return (
              <div key={t.id} className="p-4 border rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{t.title}</div>
                    {hasSubs ? (
                      <ul className="mt-2 space-y-1">
                        {list.map(s => (
                          <li key={s.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!s.completed_at}
                              onChange={() => toggleSubtaskDone(s)}
                            />
                            <span className={s.completed_at ? 'opacity-70 line-through' : ''}>
                              {s.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm opacity-70">no subtasks</p>
                    )}
                  </div>
                  {!hasSubs && (
                    <button
                      className="px-3 py-1.5 border rounded-lg hover:border-[var(--border)]"
                      onClick={() => toggleTaskDoneNoSubs(t)}
                    >
                      {t.completed_at ? 'Reopen' : 'mark done'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Inactive tasks */}
      <section className="border rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">inactive tasks</h2>
        {!inactiveTasks.length && <p className="opacity-80 text-sm">no inactive tasks.</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {inactiveTasks.map((t) => {
            const finished = t.completed_at ? new Date(t.completed_at) : null;
            const list = subsByTask.get(t.id) || [];
            return (
              <div key={t.id} className="p-4 border rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {t.title}
                      {finished && (
                        <span className="ml-2 text-xs opacity-70">
                          (completed {finished.toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    {!!list.length && (
                      <ul className="mt-2 list-disc list-inside opacity-90">
                        {list.map(s => (
                          <li key={s.id}>
                            {s.title} {s.completed_at ? '' : <span className="opacity-60">(reopened)</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Quick reopen button for whole task (sets parent to active and all subtasks to active) */}
                  <button
                    className="px-3 py-1.5 border rounded-lg hover:border-[var(--border)]"
                    onClick={async () => {
                      // reopen task and all its subtasks
                      const sids = (subsByTask.get(t.id) || []).map(s => s.id);
                      if (sids.length) {
                        await supabase.from('subtasks')
                          .update({ completed_at: null })
                          .in('id', sids)
                          .eq('user_id', userId);
                      }
                      await supabase.from('tasks')
                        .update({ completed_at: null })
                        .eq('id', t.id)
                        .eq('user_id', userId);
                      loadAll();
                    }}
                  >
                    Reopen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Tasks;
