import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, Users, CheckCircle, AlertCircle, ChevronDown, RefreshCw } from "lucide-react";

const BottleneckDetectionDashboard = () => {
  const [expandedConstraint, setExpandedConstraint] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", padding: "2rem" },
    header: { marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap" },
    headerTitle: { fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--text-primary)" },
    headerSubtitle: { color: "var(--text-secondary)", fontSize: "0.95rem" },
    controls: { display: "flex", gap: "1rem", alignItems: "center" },
    select: { padding: "0.5rem 1rem", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer", fontSize: "0.95rem" },
    button: { padding: "0.5rem 1rem", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" },
    alertBanner: { backgroundColor: "rgba(244, 67, 54, 0.15)", border: "1px solid var(--danger-color)", borderRadius: "4px", padding: "1rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "flex-start" },
    alertIcon: { color: "var(--danger-color)", flexShrink: 0, marginTop: "0.25rem" },
    alertTitle: { fontWeight: "600", color: "var(--danger-color)", marginBottom: "0.5rem" },
    alertText: { color: "var(--text-secondary)", fontSize: "0.9rem" },
    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" },
    card: { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "1.5rem", boxShadow: "var(--shadow-md)" },
    cardTitle: { fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" },
  };

  if (loading) {
    return <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "center" }}><div>Loading dashboard...</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Bottleneck Detection & Constraint Radar</h1>
          <p style={styles.headerSubtitle}>Problem #1: Bottlenecks and Long Lead Times</p>
        </div>
        <div style={styles.controls}>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={styles.select}>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={handleRefresh} style={styles.button}><RefreshCw size={16} /></button>
        </div>
      </div>

      <div style={styles.alertBanner}>
        <AlertTriangle size={24} style={styles.alertIcon} />
        <div>
          <h3 style={styles.alertTitle}> Critical Bottleneck Detected</h3>
          <p style={styles.alertText}>Review approval is the #1 constraint. Average wait time: 18.5 hours. This is blocking 34 PRs across 8 repos.</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <MetricTile label="Avg Lead Time" value="28.3 hrs" change="+4.2 hrs" status="critical" icon={<Clock size={20} />} />
        <MetricTile label="PRs Waiting" value="34" change="+8 since yesterday" status="critical" icon={<AlertCircle size={20} />} />
        <MetricTile label="Top Bottleneck" value="Code Review" change="18.5 hrs avg wait" status="critical" icon={<Users size={20} />} />
        <MetricTile label="Fastest Stage" value="Build" change="4.2 mins avg" status="healthy" icon={<CheckCircle size={20} />} />
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Pipeline Stage Times</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <StageBar label="Build & Compile" time="4.2 min" percentage={15} status="healthy" />
          <StageBar label="Unit Tests" time="6.8 min" percentage={24} status="healthy" />
          <StageBar label="E2E Tests" time="12.3 min" percentage={43} status="warning" />
          <StageBar label="Code Review" time="18.5 hrs" percentage={65} status="critical" />
          <StageBar label="Approval Gate" time="8.2 hrs" percentage={29} status="critical" />
          <StageBar label="Deployment" time="2.1 min" percentage={7} status="healthy" />
        </div>
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Total Cycle Time: 28.3 hours</p>
          <div style={{ backgroundColor: "rgba(244, 67, 54, 0.2)", color: "var(--danger-color)", fontSize: "0.85rem", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--danger-color)" }}>
             94% of time is in review + approval stages
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <ConstraintDetail title="Code Review Bottleneck" status="critical" expanded={expandedConstraint === "reviewer"} onToggle={() => setExpandedConstraint(expandedConstraint === "reviewer" ? null : "reviewer")}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Overloaded Reviewers</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <ReviewerLoad name="Alice Chen" load={12} capacity={4} />
                <ReviewerLoad name="Bob Rodriguez" load={10} capacity={4} />
                <ReviewerLoad name="Carol Martinez" load={3} capacity={4} />
              </div>
            </div>
            <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Impact</h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", listStyle: "none", padding: 0 }}>
                <li> 34 PRs blocked waiting for review</li>
                <li> Average wait: 18.5 hours</li>
                <li> 8 repos affected</li>
              </ul>
            </div>
          </div>
        </ConstraintDetail>
      </div>
    </div>
  );
};

const MetricTile = ({ label, value, change, status, icon }) => {
  const isHealthy = status === "healthy";
  const borderColor = isHealthy ? "var(--success-color)" : "var(--danger-color)";
  const textColor = isHealthy ? "var(--success-color)" : "var(--danger-color)";
  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", border: `1px solid ${borderColor}`, borderRadius: "4px", padding: "1rem", boxShadow: "var(--shadow-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: textColor }}>
        {icon}
        <span style={{ fontSize: "0.85rem", fontWeight: "500" }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.25rem" }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{change}</div>
    </div>
  );
};

const StageBar = ({ label, time, percentage, status }) => {
  const statusColor = status === "critical" ? "var(--danger-color)" : status === "warning" ? "var(--warning-color)" : "var(--success-color)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
        <span>{label}</span>
        <span style={{ color: "var(--text-secondary)" }}>{time}</span>
      </div>
      <div style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
        <div style={{ backgroundColor: statusColor, height: "100%", width: `${percentage}%`, transition: "width 0.3s" }} />
      </div>
    </div>
  );
};

const ReviewerLoad = ({ name, load, capacity }) => {
  const percentage = (load / capacity) * 100;
  const isOverloaded = load > capacity;
  return (
    <div style={{ fontSize: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <span>{name}</span>
        <span style={{ color: isOverloaded ? "var(--danger-color)" : "var(--success-color)" }}>{load}/{capacity}</span>
      </div>
      <div style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
        <div style={{ backgroundColor: isOverloaded ? "var(--danger-color)" : "var(--success-color)", height: "100%", width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
};

const ConstraintDetail = ({ title, status, expanded, onToggle, children }) => {
  const borderColor = status === "critical" ? "var(--danger-color)" : "var(--warning-color)";
  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", border: `1px solid ${borderColor}`, borderRadius: "4px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "1rem", backgroundColor: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1rem", fontWeight: "600" }}>
        <span>{title}</span>
        <ChevronDown size={20} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && <div style={{ padding: "1rem", borderTop: `1px solid ${borderColor}`, backgroundColor: "var(--bg-primary)" }}>{children}</div>}
    </div>
  );
};

export default BottleneckDetectionDashboard;
