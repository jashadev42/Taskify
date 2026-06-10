'use client'

import { useEffect, useState } from 'react'
import { getTemplates, addTemplate, updateTemplate, deleteTemplate, importTemplates } from '@/actions/plan'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const EMPTY_FORM = {
  day_of_week: 0,
  title: '',
  description: '',
  time_block: '',
  type: 'priority',
  sort_order: 0,
  active: true,
}

export default function PlanEditorView() {
  const [templates, setTemplates]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [activeDay, setActiveDay]     = useState(new Date().getDay())
  const [showForm, setShowForm]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState(null)
  const [showImport, setShowImport]   = useState(false)
  const [importJson, setImportJson]   = useState('')
  const [importError, setImportError] = useState(null)
  const [importing, setImporting]     = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setTemplates(await getTemplates())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ ...EMPTY_FORM, day_of_week: activeDay })
    setEditTarget(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(tpl) {
    setForm({
      day_of_week: tpl.day_of_week,
      title: tpl.title,
      description: tpl.description || '',
      time_block: tpl.time_block || '',
      type: tpl.type,
      sort_order: tpl.sort_order,
      active: tpl.active,
    })
    setEditTarget(tpl.id)
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editTarget) {
        await updateTemplate(editTarget, form)
      } else {
        await addTemplate(form)
      }
      setShowForm(false)
      load()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this template?\n\nAlready-generated tasks for today and past days are NOT affected — only future generation changes.')) return
    try {
      await deleteTemplate(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleImport() {
    setImportError(null)
    let parsed
    try {
      parsed = JSON.parse(importJson)
    } catch {
      setImportError('Invalid JSON — check your syntax and try again.')
      return
    }
    if (!Array.isArray(parsed?.templates)) {
      setImportError('Expected shape: { "templates": [...] }')
      return
    }
    const rows = parsed.templates.map(t => ({
      day_of_week: Number(t.day_of_week ?? 0),
      title: String(t.title ?? ''),
      description: t.description ?? null,
      time_block: t.time_block ?? null,
      type: ['priority','extra'].includes(t.type) ? t.type : 'priority',
      sort_order: Number(t.sort_order ?? 0),
    })).filter(r => r.title)

    if (rows.length === 0) { setImportError('No valid templates found in the JSON.'); return }
    setImporting(true)
    try {
      await importTemplates(rows)
      setShowImport(false)
      setImportJson('')
      load()
    } catch (e) {
      setImportError(e.message)
    } finally {
      setImporting(false)
    }
  }

  const dayTemplates = templates.filter(t => t.day_of_week === activeDay)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900 pb-24">
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest mb-1">Plan</p>
          <h1 className="text-white text-2xl font-bold">Weekly Schedule</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); setImportError(null) }}
            className="text-xs bg-white/10 hover:bg-white/20 text-white/70 px-3 py-2 rounded-lg border border-white/20 transition-colors">
            Import JSON
          </button>
          <button onClick={openAdd}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg transition-colors font-medium">
            + Add Task
          </button>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3">
        <p className="text-amber-200/70 text-xs">
          Editing or deleting a template only affects <strong>future</strong> day generation — today's and past tasks are unchanged.
        </p>
      </div>

      {/* Day-of-week tabs */}
      <div className="px-4 mb-4 flex gap-1 overflow-x-auto pb-1">
        {DAYS.map((name, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
              activeDay === i ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}>
            {name.slice(0, 3)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="mx-4 rounded-xl bg-red-500/20 border border-red-400/30 p-4 text-red-200 text-sm">
          {error} <button onClick={load} className="ml-2 underline">retry</button>
        </div>
      )}

      {!loading && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-semibold">{DAYS[activeDay]}</h2>
            <span className="text-white/40 text-sm">{dayTemplates.length} task{dayTemplates.length !== 1 ? 's' : ''}</span>
          </div>

          {dayTemplates.length === 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-white/50 text-sm">No tasks for {DAYS[activeDay]}.</p>
              <button onClick={openAdd} className="mt-3 text-violet-300 text-sm underline">Add one</button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {dayTemplates.map(t => (
              <div key={t.id} className={`rounded-xl border p-4 ${t.active ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        t.type === 'priority'
                          ? 'bg-violet-500/20 text-violet-300 border-violet-400/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      }`}>{t.type}</span>
                      {!t.active && <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">inactive</span>}
                    </div>
                    {t.time_block && <p className="text-white/40 text-xs mt-1">{t.time_block}</p>}
                    {t.description && <p className="text-white/40 text-xs mt-1">{t.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(t)} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-white/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-md p-6">
            <h3 className="text-white font-bold text-lg mb-4">{editTarget ? 'Edit Task' : 'Add Task'}</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Day of week</label>
                <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                  {DAYS.map((d, i) => <option key={i} value={i} className="bg-slate-800">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. LeetCode block: 3 easies"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 resize-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-white/60 text-xs mb-1 block">Time block</label>
                  <input value={form.time_block} onChange={e => setForm(f => ({ ...f, time_block: e.target.value }))}
                    placeholder="10:30–11:00"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30" />
                </div>
                <div className="flex-1">
                  <label className="text-white/60 text-xs mb-1 block">Sort order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-white/60 text-xs mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="priority" className="bg-slate-800">Priority</option>
                    <option value="extra" className="bg-slate-800">Extra</option>
                  </select>
                </div>
                <div className="flex-1 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 accent-violet-500" />
                    <span className="text-white/60 text-sm">Active</span>
                  </label>
                </div>
              </div>
            </div>
            {formError && <p className="text-red-300 text-sm mt-3">{formError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-md p-6">
            <h3 className="text-white font-bold text-lg mb-2">Import Plan from JSON</h3>
            <p className="text-white/50 text-xs mb-4">
              Paste JSON with a <code className="bg-white/10 px-1 rounded">"templates"</code> array.
              Each item: <code className="bg-white/10 px-1 rounded">day_of_week</code>, <code className="bg-white/10 px-1 rounded">title</code>,{' '}
              <code className="bg-white/10 px-1 rounded">type</code>, and optionally{' '}
              <code className="bg-white/10 px-1 rounded">description</code>, <code className="bg-white/10 px-1 rounded">time_block</code>, <code className="bg-white/10 px-1 rounded">sort_order</code>.
            </p>
            <textarea value={importJson} onChange={e => setImportJson(e.target.value)} rows={8}
              placeholder={'{\n  "templates": [\n    {\n      "day_of_week": 1,\n      "title": "Morning workout",\n      "type": "priority"\n    }\n  ]\n}'}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs font-mono placeholder:text-white/20 resize-none" />
            {importError && <p className="text-red-300 text-xs mt-2">{importError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowImport(false); setImportJson('') }} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors">Cancel</button>
              <button onClick={handleImport} disabled={importing} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
