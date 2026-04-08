import React, { useState, useRef, useEffect } from 'react';

export const BarChart = ({ data, title, xLabel, yLabel, showPercentage = true }) => {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée</div>;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 180;
  const barWidth = 40;
  const gap = 20;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 30;
  const svgWidth = Math.max(450, data.length * (barWidth + gap) + paddingLeft + paddingRight);
  const svgHeight = chartHeight + paddingTop + paddingBottom;
  
  const handleMouseEnter = (e, item, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top - containerRect.top;
    
    setTooltip({
      x,
      y,
      label: item.label,
      value: item.value,
      extra: item.extra,
      date: item.date,
      measurementCount: item.measurementCount,
      avgBattery: item.avgBattery
    });
  };
  
  return (
    <div className="simple-chart">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart-container" ref={containerRef} style={{ position: 'relative', overflowX: 'auto', minHeight: svgHeight + 20 }}>
        <svg width={svgWidth} height={svgHeight}>
          {[0, 25, 50, 75, 100].map((pct, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight - (pct / 100) * chartHeight}
                x2={svgWidth - paddingRight}
                y2={paddingTop + chartHeight - (pct / 100) * chartHeight}
                stroke="#e0e0e0"
                strokeDasharray="2,2"
              />
              <text
                x={paddingLeft - 10}
                y={paddingTop + chartHeight - (pct / 100) * chartHeight + 5}
                textAnchor="end"
                fontSize="12"
                fill="#666"
                fontWeight="500"
              >
                {pct}%
              </text>
            </g>
          ))}
          
          {data.map((item, index) => {
            const barHeight = Math.max((item.value / 100) * chartHeight, 4);
            const x = paddingLeft + index * (barWidth + gap);
            const y = paddingTop + chartHeight - barHeight;
            const centerX = x + barWidth / 2;
            const isHovered = tooltip?.label === item.label;
            
            return (
              <g 
                key={index}
                onMouseEnter={(e) => handleMouseEnter(e, item, index)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || '#2196F3'}
                  rx={4}
                  opacity={isHovered ? 0.85 : 1}
                  style={{ transition: 'opacity 0.2s' }}
                />
                <text
                  x={centerX}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                >
                  {item.label}
                </text>
                <text
                  x={centerX}
                  y={y + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#fff"
                  fontWeight="bold"
                >
                  {item.value}%
                </text>
              </g>
            );
          })}
        </svg>
        
        {tooltip && (
          <div 
            className="bar-chart-tooltip"
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: Math.max(10, tooltip.y - 20),
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #333 0%, #222 100%)',
              color: '#fff',
              padding: '14px 18px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              minWidth: '220px',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #555' }}>
              {tooltip.label}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#aaa' }}>Niveau moyen: </span>
              <strong style={{ color: '#4CAF50', fontSize: '1.1rem' }}>{tooltip.value}%</strong>
            </div>
            {tooltip.measurementCount !== undefined && (
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#aaa' }}>Mesures ce jour: </span>
                <strong>{tooltip.measurementCount.toLocaleString()}</strong>
              </div>
            )}
            {tooltip.avgBattery !== undefined && (
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#aaa' }}>Batterie moyenne: </span>
                <strong style={{ color: tooltip.avgBattery < 20 ? '#f44336' : '#2196F3' }}>
                  {Math.round(tooltip.avgBattery)}%
                </strong>
              </div>
            )}
            {tooltip.extra && (
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #444' }}>
                {tooltip.extra}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de jauge circulaire
export const CircularGauge = ({ value, max, label, color = '#4CAF50' }) => {
  const radius = 50;
  const strokeWidth = 8;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (pct) => {
    if (pct >= 80) return '#f44336';
    if (pct >= 60) return '#FF9800';
    if (pct >= 40) return '#FFC107';
    return '#4CAF50';
  };
  
  const gaugeColor = color || getColor(percentage);
  
  return (
    <div className="circular-gauge">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Cercle de fond */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        {/* Cercle de progression */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Texte central */}
        <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#333">
          {Math.round(percentage)}%
        </text>
        <text x="60" y="75" textAnchor="middle" fontSize="10" fill="#666">
          {label}
        </text>
      </svg>
    </div>
  );
};

// Composant de mini tendance (sparkline)
export const Sparkline = ({ data, color = '#2196F3' }) => {
  if (!data || data.length === 0) return null;
  
  const width = 100;
  const height = 30;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Composant de carte thermique simplifiée
export const Heatmap = ({ data, title }) => {
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée</div>;
  
  const getColor = (value) => {
    if (value >= 80) return '#f44336';
    if (value >= 60) return '#FF9800';
    if (value >= 40) return '#FFC107';
    if (value >= 20) return '#8BC34A';
    return '#4CAF50';
  };
  
  return (
    <div className="simple-heatmap">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="heatmap-grid">
        {data.map((item, index) => (
          <div key={index} className="heatmap-cell" title={item.label}>
            <div
              className="heatmap-block"
              style={{ backgroundColor: getColor(item.value) }}
            />
            <span className="heatmap-label">{item.label.substring(0, 8)}</span>
            <span className="heatmap-value">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant de carte de statut pour prédictions
export const PredictionCard = ({ prediction }) => {
  if (!prediction) return <div className="no-data">Aucune prédiction</div>;
  
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FFC107';
    return '#f44336';
  };
  
  const getFillLevelColor = (level) => {
    if (level >= 90) return '#f44336';
    if (level >= 70) return '#FF9800';
    if (level >= 50) return '#FFC107';
    return '#4CAF50';
  };
  
  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <span className="prediction-title">Conteneur #{prediction.containerId}</span>
        <span 
          className="prediction-confidence"
          style={{ color: getConfidenceColor(prediction.confidence) }}
        >
          {prediction.confidence}% confiance
        </span>
      </div>
      
      <div className="prediction-levels">
        <div className="level-item">
          <span className="level-label">Actuel</span>
          <div className="level-bar">
            <div 
              className="level-fill current"
              style={{ 
                width: `${prediction.currentFillLevel}%`,
                backgroundColor: getFillLevelColor(prediction.currentFillLevel)
              }}
            />
          </div>
          <span className="level-value">{prediction.currentFillLevel}%</span>
        </div>
        
        <div className="level-item">
          <span className="level-label">Prédit J+{prediction.daysAhead}</span>
          <div className="level-bar">
            <div 
              className="level-fill predicted"
              style={{ 
                width: `${prediction.predictedFillLevel}%`,
                backgroundColor: getFillLevelColor(prediction.predictedFillLevel)
              }}
            />
          </div>
          <span className="level-value">{prediction.predictedFillLevel}%</span>
        </div>
      </div>
      
      {prediction.weatherAdjusted && (
        <div className="weather-impact">
          <i className="fas fa-cloud-sun"></i>
          <span>Impact météo: {prediction.weatherImpact > 0 ? '+' : ''}{prediction.weatherImpact}%</span>
        </div>
      )}
    </div>
  );
};

// Composant de liste d'anomalies
export const AnomalyList = ({ anomalies, title }) => {
  if (!anomalies || anomalies.length === 0) return <div className="no-data">Aucune anomalie détectée</div>;
  
  const getTypeIcon = (type) => {
    const icons = {
      'sudden_fill': 'fa-arrow-up',
      'sudden_empty': 'fa-arrow-down',
      'low_battery': 'fa-battery-quarter',
      'temperature_extreme': 'fa-thermometer-full',
      'statistical_outlier': 'fa-exclamation'
    };
    return icons[type] || 'fa-exclamation-circle';
  };
  
  const getTypeLabel = (type) => {
    const labels = {
      'sudden_fill': 'Remplissage soudain',
      'sudden_empty': 'Vidage soudain',
      'low_battery': 'Batterie faible',
      'temperature_extreme': 'Température extrême',
      'statistical_outlier': 'Valeur anormale'
    };
    return labels[type] || type;
  };
  
  return (
    <div className="anomaly-list">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="anomaly-items">
        {anomalies.slice(0, 5).map((anomaly, index) => (
          <div key={index} className="anomaly-item">
            <div className="anomaly-icon">
              <i className={`fas ${getTypeIcon(anomaly.type)}`}></i>
            </div>
            <div className="anomaly-info">
              <span className="anomaly-type">{getTypeLabel(anomaly.type)}</span>
              <span className="anomaly-value">{anomaly.fillLevel}%</span>
            </div>
            <span className="anomaly-time">
              {new Date(anomaly.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
