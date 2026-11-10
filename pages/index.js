import { useState } from "react";
import previewData from "../data/ui/preview_data.json";

export default function Home() {
  const [selectedChapter, setSelectedChapter] = useState(previewData.chapters[0]);
  const [selectedLesson, setSelectedLesson] = useState(previewData.chapters[0]?.lessons[0] || null);
  const [activeTab, setActiveTab] = useState("theory"); // 'theory' | 'exercises'

  const handleSelectChapter = (ch) => {
    setSelectedChapter(ch);
    setSelectedLesson(ch.lessons[0] || null);
    setActiveTab("theory");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1e293b", color: "#fff", padding: "1rem 2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📚</span> English Grammar Platform
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>
              Dựa trên giáo trình <em>Ngữ pháp tiếng Anh</em> — Mai Lan Hương & Hà Thanh Uyên
            </p>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
            <div><strong style={{ color: "#38bdf8" }}>12</strong> Chương</div>
            <div><strong style={{ color: "#38bdf8" }}>53</strong> Bài học</div>
            <div><strong style={{ color: "#38bdf8" }}>982</strong> Quy tắc</div>
            <div><strong style={{ color: "#38bdf8" }}>2,939</strong> Câu hỏi</div>
            <span style={{ backgroundColor: "#0284c7", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" }}>
              Phase 1 Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ maxWidth: "1280px", margin: "2rem auto", padding: "0 1rem", display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem" }}>
        
        {/* Sidebar - Chapters & Lessons */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Chapter Selector */}
          <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600" }}>
              Danh mục chương (Preview)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {previewData.chapters.map((ch) => {
                const isActive = selectedChapter?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChapter(ch)}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: isActive ? "#eff6ff" : "transparent",
                      borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                      color: isActive ? "#1e40af" : "#334155",
                      fontWeight: isActive ? "600" : "500",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: isActive ? "#3b82f6" : "#94a3b8" }}>
                      Chương {ch.number}
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>{ch.title_vi}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{ch.title_en}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons List of Selected Chapter */}
          {selectedChapter && (
            <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600" }}>
                Bài học trong chương ({selectedChapter.lessons.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "400px", overflowY: "auto" }}>
                {selectedChapter.lessons.map((les, idx) => {
                  const isLesActive = selectedLesson?.id === les.id;
                  return (
                    <button
                      key={les.id}
                      onClick={() => { setSelectedLesson(les); setActiveTab("theory"); }}
                      style={{
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isLesActive ? "#f1f5f9" : "transparent",
                        color: isLesActive ? "#0f172a" : "#475569",
                        fontWeight: isLesActive ? "600" : "400",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem", minWidth: "1.5rem" }}>{idx + 1}.</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{les.title_vi}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Breadcrumb & Navigation Tabs */}
          <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>
                  Chương {selectedChapter?.number}: {selectedChapter?.title_vi}
                </span>
                <h2 style={{ margin: "0.25rem 0 0 0", fontSize: "1.4rem", color: "#0f172a" }}>
                  {selectedLesson ? selectedLesson.title_vi : selectedChapter?.title_vi}
                </h2>
                <p style={{ margin: "0.15rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                  {selectedLesson?.title_en}
                </p>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "8px" }}>
                <button
                  onClick={() => setActiveTab("theory")}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    backgroundColor: activeTab === "theory" ? "#fff" : "transparent",
                    color: activeTab === "theory" ? "#0f172a" : "#64748b",
                    boxShadow: activeTab === "theory" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  📖 Lý thuyết & Công thức
                </button>
                <button
                  onClick={() => setActiveTab("exercises")}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    backgroundColor: activeTab === "exercises" ? "#fff" : "transparent",
                    color: activeTab === "exercises" ? "#0f172a" : "#64748b",
                    boxShadow: activeTab === "exercises" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  ✏️ Bài tập thực hành ({selectedChapter?.exercises.length || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content: Theory */}
          {activeTab === "theory" && selectedLesson && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Rules List */}
              <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🔬</span> Quy tắc ngữ pháp & Cấu trúc ({selectedLesson.rules.length})
                </h3>

                {selectedLesson.rules.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa có cấu trúc chi tiết cho mục này.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {selectedLesson.rules.map((rule, idx) => (
                      <div key={idx} style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.4rem" }}>
                          {rule.title}
                        </div>
                        {rule.formula && (
                          <div style={{ backgroundColor: "#e2e8f0", padding: "0.4rem 0.8rem", borderRadius: "4px", fontFamily: "monospace", fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.4rem", display: "inline-block" }}>
                            {rule.formula}
                          </div>
                        )}
                        {rule.explanation_vi && (
                          <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.5" }}>
                            {rule.explanation_vi}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Examples List */}
              <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>💡</span> Ví dụ minh họa song ngữ ({selectedLesson.examples.length})
                </h3>

                {selectedLesson.examples.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa có ví dụ mẫu.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                    {selectedLesson.examples.map((ex, idx) => (
                      <div key={idx} style={{ padding: "0.85rem", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontWeight: "600", color: "#166534", fontSize: "0.95rem" }}>
                          👉 {ex.en}
                        </div>
                        {ex.vi && (
                          <div style={{ color: "#15803d", fontSize: "0.85rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                            {ex.vi}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Exercises */}
          {activeTab === "exercises" && selectedChapter && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>
                  Bài tập thuộc Chương {selectedChapter.number}: {selectedChapter.title_vi}
                </h3>

                {selectedChapter.exercises.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa có bài tập mẫu trong chương này.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {selectedChapter.exercises.map((ex) => (
                      <div key={ex.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", backgroundColor: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                          <span style={{ fontWeight: "700", color: "#1e40af", fontSize: "1rem" }}>
                            Exercise {ex.roman}: {ex.title}
                          </span>
                          <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {ex.type}
                          </span>
                        </div>

                        {/* Questions list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {ex.questions.map((q) => (
                            <div key={q.num} style={{ padding: "0.6rem 0.8rem", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "0.9rem", color: "#334155" }}>
                              <strong style={{ color: "#2563eb", marginRight: "0.5rem" }}>{q.num}.</strong>
                              <span>{q.stem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", marginTop: "4rem", padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
        English Grammar Learning Platform &copy; 2026. Built with Next.js 14 & Prisma.
      </footer>
    </div>
  );
}
