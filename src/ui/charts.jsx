import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aufgeloesteFarbe, cardBorder, textMuted } from "./theme";

export function SimpleLineChart({ data, dataKey, stroke, height = 130 }) {
  return (
    <div style={{ width: "100%", height, marginTop: 12 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke={cardBorder} vertical={false} />
          <XAxis dataKey="datum" tick={{ fontSize: 10, fill: textMuted }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: textMuted }} domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={aufgeloesteFarbe(stroke)} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Balkendiagramm "geplant vs. erledigt in %" je Kategorie, eine Instanz pro
// Woche (siehe WochenuebersichtView.jsx, PDF-Export "Wochenverlauf") — jede
// Kategorie bekommt ihre eigene, bereits an anderer Stelle etablierte Farbe
// (KATEGORIE_META.dot), damit sich ein Balken über mehrere Wochen-Diagramme
// hinweg wiedererkennen lässt.
export function WochenComplianceChart({ data = [], height = 140 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid stroke={cardBorder} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: textMuted }} interval={0} angle={-25} textAnchor="end" height={40} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: textMuted }} unit="%" />
          <Tooltip formatter={(value, _name, entry) => [`${value}% (${entry.payload.erledigt}/${entry.payload.geplant})`, entry.payload.label]} />
          <Bar dataKey="prozent" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.dot} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NebenwirkungenPie({ data = [], colors }) {
  return (
    <div style={{ width: 120, height: 120, flexShrink: 0 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={55}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
