import React from "react";
import TimelineVisualization from "./TimelineVisualization";
import DecisionTreeVisualization from "./DecisionTreeVisualization";
import TransformationDiagram from "./TransformationDiagram";
import ConversionFlowVisualization from "./ConversionFlowVisualization";

export default function VisualizationRenderer({ type, data, isLight = false }) {
  if (!data) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: isLight ? "#64748b" : "#71717a",
          fontSize: "0.9rem",
        }}
      >
        Không tìm thấy mô hình trực quan hoá phù hợp cho chuyên đề này.
      </div>
    );
  }

  switch (type) {
    case "timeline":
      return <TimelineVisualization data={data} isLight={isLight} />;
    case "decision-tree":
      return <DecisionTreeVisualization data={data} isLight={isLight} />;
    case "transformation":
      return <TransformationDiagram data={data} isLight={isLight} />;
    case "conversion-flow":
      return <ConversionFlowVisualization data={data} isLight={isLight} />;
    default:
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: isLight ? "#64748b" : "#71717a",
          }}
        >
          Loại sơ đồ trực quan "{type}" chưa được hỗ trợ.
        </div>
      );
  }
}
