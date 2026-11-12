import React from "react";
import TimelineVisualization from "./TimelineVisualization";
import DecisionTreeVisualization from "./DecisionTreeVisualization";
import TransformationDiagram from "./TransformationDiagram";
import ConversionFlowVisualization from "./ConversionFlowVisualization";
import SentenceTreeVisualization from "./SentenceTreeVisualization";
import ComparisonScaleVisualization from "./ComparisonScaleVisualization";
import ModalMatrixVisualization from "./ModalMatrixVisualization";
import WordFamilyTreeVisualization from "./WordFamilyTreeVisualization";

export default function VisualizationRenderer({ type, data, isLight = false }) {
  if (!data) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--ds-text-muted)",
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
    case "sentence-tree":
      return <SentenceTreeVisualization data={data} isLight={isLight} />;
    case "comparison-scale":
      return <ComparisonScaleVisualization data={data} isLight={isLight} />;
    case "modal-matrix":
      return <ModalMatrixVisualization data={data} isLight={isLight} />;
    case "word-family-tree":
      return <WordFamilyTreeVisualization data={data} isLight={isLight} />;
    default:
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--ds-text-muted)",
          }}
        >
          Loại sơ đồ trực quan "{type}" chưa được hỗ trợ.
        </div>
      );
  }
}
