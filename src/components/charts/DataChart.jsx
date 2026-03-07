import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color, fontWeight: 700 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DataChart = ({ data, dataKey, name, color, maxLimit, showLimit = false }) => {
  return (
    <div className="chart-container" style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
            
            {showLimit && (
              <linearGradient id="color-limit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => Math.round(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            name={name}
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#color-${dataKey})`} 
            isAnimationActive={false}
          />
          
          {showLimit && maxLimit && (
             <Area 
               type="step" 
               dataKey={() => maxLimit} 
               name="Safe Limit"
               stroke="var(--danger)" 
               strokeDasharray="5 5"
               strokeWidth={2}
               fillOpacity={1} 
               fill="url(#color-limit)" 
               isAnimationActive={false}
             />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DataChart;
