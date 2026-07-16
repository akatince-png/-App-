import React from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cardBorder, textMuted } from "./theme";

export function SimpleLineChart({ data, dataKey, stroke, height = 130 }) {
  return (
    <div style={{ width: "100%", height, marginTop: 12 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke={cardBorder} vertical={false} />
          <XAxis dataKey="datum" tick={{ fontSize: 10, fill: textMuted }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: textMuted }} domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NebenwirkungenPie({ data, colors }) {
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
