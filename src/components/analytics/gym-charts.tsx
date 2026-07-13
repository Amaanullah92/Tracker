'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { epley1RM, computeVolume } from '@/lib/analytics-utils'
import { weekStartPKT } from '@/lib/pkt-utils'

type SessionWithSets = {
  id: string
  session_date: string
  workout_day_id: string | null
  session_exercises: {
    id: string
    exercise_id: string
    exercise_name?: string | null
    sets: { weight_kg: number; reps: number }[]
  }[]
}

function displayDate(iso: string): string {
  return iso.slice(5)
}

export function GymCharts({
  sessions,
  workoutDayNames = {},
}: {
  sessions: SessionWithSets[]
  workoutDayNames: Record<string, string>
}) {
  // Sort sessions once by full ISO date
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date)),
    [sessions],
  )

  // ── 1RM Progression ──
  const oneRMData = useMemo(() => {
    const byEx: Record<string, { fullDate: string; v: number }[]> = {}
    const names: Record<string, string> = {}

    for (const s of sorted) {
      for (const se of s.session_exercises) {
        if (se.sets.length === 0) continue
        const n = se.exercise_name ?? se.exercise_id
        names[se.exercise_id] = n
        const max1RM = Math.max(...se.sets.map((st) => epley1RM(st.weight_kg, st.reps)))
        if (!byEx[se.exercise_id]) byEx[se.exercise_id] = []
        byEx[se.exercise_id].push({ fullDate: s.session_date, v: max1RM })
      }
    }

    return Object.entries(byEx)
      .filter(([, pts]) => pts.length >= 2)
      .slice(0, 5)
      .map(([id, pts]) => ({
        name: names[id] ?? id.slice(0, 8),
        data: pts
          .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
          .map((p) => ({ date: displayDate(p.fullDate), sortKey: p.fullDate, v: p.v })),
      }))
  }, [sorted])

  // ── Max Weight Progression (actual max lifted) ──
  const maxWeightData = useMemo(() => {
    const byEx: Record<string, { fullDate: string; v: number }[]> = {}
    const names: Record<string, string> = {}

    for (const s of sorted) {
      for (const se of s.session_exercises) {
        if (se.sets.length === 0) continue
        const n = se.exercise_name ?? se.exercise_id
        names[se.exercise_id] = n
        const maxW = Math.max(...se.sets.map((st) => st.weight_kg))
        if (!byEx[se.exercise_id]) byEx[se.exercise_id] = []
        byEx[se.exercise_id].push({ fullDate: s.session_date, v: maxW })
      }
    }

    return Object.entries(byEx)
      .filter(([, pts]) => pts.length >= 2)
      .slice(0, 5)
      .map(([id, pts]) => ({
        name: names[id] ?? id.slice(0, 8),
        data: pts
          .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
          .map((p) => ({ date: displayDate(p.fullDate), sortKey: p.fullDate, v: p.v })),
      }))
  }, [sorted])

  // ── Per-Exercise Volume Progression ──
  const exerciseVolumeData = useMemo(() => {
    const byEx: Record<string, { fullDate: string; v: number }[]> = {}
    const names: Record<string, string> = {}

    for (const s of sorted) {
      for (const se of s.session_exercises) {
        if (se.sets.length === 0) continue
        const n = se.exercise_name ?? se.exercise_id
        names[se.exercise_id] = n
        const vol = se.sets.reduce((sum, st) => sum + computeVolume(st.weight_kg, st.reps), 0)
        if (!byEx[se.exercise_id]) byEx[se.exercise_id] = []
        byEx[se.exercise_id].push({ fullDate: s.session_date, v: vol })
      }
    }

    return Object.entries(byEx)
      .filter(([, pts]) => pts.length >= 2)
      .slice(0, 5)
      .map(([id, pts]) => ({
        name: names[id] ?? id.slice(0, 8),
        data: pts
          .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
          .map((p) => ({ date: displayDate(p.fullDate), sortKey: p.fullDate, v: p.v })),
      }))
  }, [sorted])

  // ── Total Session Volume ──
  const sessionVolumeData = useMemo(() => {
    return sorted
      .filter((s) => s.session_exercises.some((se) => se.sets.length > 0))
      .map((s) => ({
        date: displayDate(s.session_date),
        fullDate: s.session_date,
        volume: s.session_exercises.reduce(
          (sum, se) => sum + se.sets.reduce((s2, st) => s2 + computeVolume(st.weight_kg, st.reps), 0),
          0,
        ),
      }))
  }, [sorted])

  // ── Frequency: sessions per week, broken down by template ──
  const freqData = useMemo(() => {
    const weekly: Record<string, Record<string, number>> = {}
    const weekOrder: string[] = []

    for (const s of sorted) {
      const wk = weekStartPKT(s.session_date)
      if (!weekly[wk]) {
        weekly[wk] = {}
        weekOrder.push(wk)
      }
      const tpl = s.workout_day_id ? (workoutDayNames[s.workout_day_id] ?? 'Ad-hoc') : 'Ad-hoc'
      weekly[wk][tpl] = (weekly[wk][tpl] ?? 0) + 1
    }

    const allTemplates = new Set<string>()
    for (const w of Object.values(weekly)) {
      for (const t of Object.keys(w)) allTemplates.add(t)
    }
    const tplList = Array.from(allTemplates).sort()

    return weekOrder.map((wk) => {
      const row: Record<string, string | number> = { week: displayDate(wk) }
      let total = 0
      for (const t of tplList) {
        row[t] = weekly[wk][t] ?? 0
        total += weekly[wk][t] ?? 0
      }
      row.total = total
      return row
    })
  }, [sorted, workoutDayNames])

  // Colors for template breakdown
  const colors = ['#d97706', '#166534', '#1e40af', '#9d174d', '#6b21a8', '#0f766e', '#a16207', '#be123c']

  const noData = sorted.length === 0

  return (
    <div className="space-y-4">
      {/* 1RM Progression */}
      {oneRMData.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">1RM Progression</h2>
          <div className="space-y-4">
            {oneRMData.map((ex) => (
              <div key={ex.name}>
                <p className="mb-1 text-xs text-text-secondary">{ex.name}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ex.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="v" name="1RM" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Max Weight Progression */}
      {maxWeightData.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Max Weight Progression</h2>
          <div className="space-y-4">
            {maxWeightData.map((ex) => (
              <div key={ex.name}>
                <p className="mb-1 text-xs text-text-secondary">{ex.name}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ex.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="v" name="Max kg" stroke="#1e40af" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-Exercise Volume */}
      {exerciseVolumeData.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Per-Exercise Volume</h2>
          <div className="space-y-4">
            {exerciseVolumeData.map((ex) => (
              <div key={ex.name}>
                <p className="mb-1 text-xs text-text-secondary">{ex.name}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ex.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="v" name="Volume" stroke="#166534" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Total Session Volume */}
      {sessionVolumeData.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Volume per Session</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionVolumeData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="volume" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Workout Frequency by Template */}
      {freqData.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Workout Frequency</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                {Object.keys(freqData[0] ?? {})
                  .filter((k) => k !== 'week' && k !== 'total')
                  .map((tpl, i) => (
                    <Bar key={tpl} dataKey={tpl} name={tpl} fill={colors[i % colors.length]} stackId="a" radius={[0, 0, 0, 0]} />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}