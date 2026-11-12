import {
  KNOWLEDGE_GRAPH,
  validateAcyclicGraph,
  findPrerequisites,
  getDependentConcepts,
} from "../../../lib/knowledge/knowledge-graph";
import { attachCorrelationId, sendSafeServerError } from "../../lib/api/security-guard";

/**
 * Milestone 2.5.7: Grammar Knowledge Graph (DAG) API
 * GET ?conceptId=CLAUSE_CONDITION
 * Returns topological acyclic validation, prerequisite chain (< 5ms), and dependent lessons.
 */
export default function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  const startTime = Date.now();
  const { conceptId, includeNodes = "false" } = req.query || {};

  try {
    const graphStats = validateAcyclicGraph();
    const node = conceptId ? KNOWLEDGE_GRAPH.nodes[conceptId] || null : null;
    const prerequisites = conceptId
      ? findPrerequisites(conceptId, { includeIndirect: true, maxDepth: 4 })
      : [];
    const dependents = conceptId ? getDependentConcepts(conceptId) : [];
    const queryDurationMs = Math.max(0, Date.now() - startTime);

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      success: true,
      graphStats: {
        isAcyclic: graphStats.isAcyclic,
        nodeCount: graphStats.nodeCount,
        edgeCount: graphStats.edgeCount,
        cycleNodes: graphStats.cycleNodes,
      },
      node,
      prerequisites,
      dependents,
      nodes: includeNodes === "true" ? KNOWLEDGE_GRAPH.nodeList : undefined,
      queryDurationMs,
    });
  } catch (err) {
    return sendSafeServerError(res, { correlationId: typeof correlationId !== "undefined" ? correlationId : null, route: "/api/learning/knowledge-graph", err: err.message || "Knowledge Graph lookup failed." });
  }
}
