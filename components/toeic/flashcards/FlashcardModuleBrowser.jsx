import React, { useMemo, useRef, useState } from "react";
import { KitIcon } from "../../ui-2026/KitIcon";
import { ToeicBadge } from "../ui";
import { FREE_FLASHCARD_MODULE_IDS } from "../../../lib/toeic/flashcard-client-store";

export default function FlashcardModuleBrowser({
  modules = [],
  topics = [],
  slimIndex = [],
  srsMap = new Map(),
  activeModuleId = "M01",
  activeTopicId = null,
  isVip = false,
  onSelectTopicDeck,
  onSelectModuleDeck,
  onSelectBandDeck,
  onSelectCardInDeck,
  onOpenPaywall,
}) {
  const [selectedModuleId, setSelectedModuleId] = useState(activeModuleId || "M01");
  const [selectedTopicId, setSelectedTopicId] = useState(activeTopicId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bandFilter, setBandFilter] = useState("ALL");
  const topicsSectionRef = useRef(null);

  const moduleTopics = useMemo(() => {
    return topics.filter((t) => t.module_id === selectedModuleId);
  }, [topics, selectedModuleId]);

  const bandFilteredGlobal = useMemo(() => {
    if (bandFilter === "ALL") return slimIndex;
    return slimIndex.filter((w) => w.toeic_score_band === bandFilter);
  }, [slimIndex, bandFilter]);

  const moduleStats = useMemo(() => {
    const stats = new Map();
    for (const m of modules) {
      stats.set(m.module_id, { learned: 0, total: m.word_count || 100, inBand: 0 });
    }
    for (const item of slimIndex) {
      const cur = stats.get(item.module_id);
      if (!cur) continue;
      if (bandFilter === "ALL" || item.toeic_score_band === bandFilter) {
        cur.inBand += 1;
      }
      const rec = srsMap.get(Number(item.id));
      if (rec && rec.srs_state !== "NEW") {
        cur.learned += 1;
      }
    }
    return stats;
  }, [modules, slimIndex, srsMap, bandFilter]);

  const topicBandCounts = useMemo(() => {
    const counts = new Map();
    for (const item of slimIndex) {
      if (bandFilter !== "ALL" && item.toeic_score_band !== bandFilter) continue;
      const tid = Number(item.topic_id);
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
    return counts;
  }, [slimIndex, bandFilter]);

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = bandFilteredGlobal;
    if (!q) {
      if (bandFilter === "ALL") {
        list = list.filter((w) => w.module_id === selectedModuleId);
        if (selectedTopicId) {
          list = list.filter((w) => Number(w.topic_id) === Number(selectedTopicId));
        }
      }
    } else {
      list = list.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.meaning_vi.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q)
      );
    }

    return list.slice(0, 80);
  }, [bandFilteredGlobal, searchQuery, selectedModuleId, selectedTopicId, bandFilter]);

  const isSelectedModuleFree = FREE_FLASHCARD_MODULE_IDS.has(selectedModuleId);
  const selectedModuleObj = modules.find((m) => m.module_id === selectedModuleId);

  const handleClickModule = (modId) => {
    setSelectedModuleId(modId);
    setSelectedTopicId(null);
    if (typeof window !== "undefined" && topicsSectionRef.current) {
      setTimeout(() => {
        topicsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
      {/* Search + Band Filter Bar */}
      <div
        className="toeic-card"
        style={{
          padding: "0.95rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 0 }}>
            <span
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ds-text-muted)",
                pointerEvents: "none",
                display: "inline-flex",
              }}
            >
              <KitIcon name="tool-search" size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong 1,000 từ TOEIC (Anh hoặc nghĩa Việt)..."
              style={{
                width: "100%",
                height: "42px",
                padding: "0 0.85rem 0 2.25rem",
                borderRadius: "0.7rem",
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-bg-elevated)",
                color: "var(--ds-text)",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {["ALL", "300-450", "450-600", "600-750", "750-990"].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBandFilter(b)}
                className={`toeic-target-chip ${bandFilter === b ? "active" : ""}`}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
              >
                {b === "ALL" ? "Mọi Band" : b}
              </button>
            ))}
          </div>
        </div>

        {/* Active Band Filter Action Strip */}
        {bandFilter !== "ALL" && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--ds-accent-bg)",
              border: "1px solid var(--ds-accent-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.55rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--ds-text)" }}>
              <KitIcon name="target" size={15} color="var(--ds-accent)" />
              <span>
                Đang lọc Band <strong>{bandFilter}</strong>: tìm thấy <strong>{bandFilteredGlobal.length}</strong> thẻ từ vựng phù hợp
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setBandFilter("ALL")}
                style={{
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-card)",
                  color: "var(--ds-text-secondary)",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Xóa lọc
              </button>
              {onSelectBandDeck && (
                <button
                  type="button"
                  onClick={() => onSelectBandDeck(bandFilter)}
                  className="toeic-btn toeic-btn-primary"
                  style={{ padding: "0.4rem 0.9rem", fontSize: "0.78rem" }}
                >
                  Học ngay bộ Band {bandFilter} &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filtered Words Panel shown immediately at top when Searching or Band Filtering */}
      {(searchQuery.trim() || bandFilter !== "ALL") && (
        <WordPreviewGrid
          title={
            searchQuery.trim()
              ? `Kết quả tìm kiếm (${filteredWords.length}${bandFilter !== "ALL" ? ` · Band ${bandFilter}` : ""})`
              : `Từ vựng thuộc Band ${bandFilter} (hiển thị ${filteredWords.length}/${bandFilteredGlobal.length})`
          }
          words={filteredWords}
          srsMap={srsMap}
          isVip={isVip}
          onSelectCard={(item) => onSelectCardInDeck && onSelectCardInDeck(item, bandFilter)}
          onOpenPaywall={onOpenPaywall}
        />
      )}

      {/* 10 Modules Grid */}
      {!searchQuery.trim() && (
        <>
          <div>
            <div className="toeic-flex-between" style={{ marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.4rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
                10 Học Phần New TOEIC (Bấm chọn Module để xem 5 Chủ đề &amp; Học ngay)
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                Miễn phí M01–M02 (200 từ) · VIP mở trọn 10 Modules
              </span>
            </div>

            <div className="toeic-fc-module-grid">
              {modules.map((mod) => {
                const isActive = mod.module_id === selectedModuleId;
                const isFree = FREE_FLASHCARD_MODULE_IDS.has(mod.module_id);
                const locked = !isVip && !isFree;
                const st = moduleStats.get(mod.module_id) || { learned: 0, total: 100, inBand: 100 };
                return (
                  <div
                    key={mod.module_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClickModule(mod.module_id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClickModule(mod.module_id);
                      }
                    }}
                    style={{
                      textAlign: "left",
                      padding: "0.9rem 1rem",
                      borderRadius: "0.95rem",
                      border: isActive ? "1.5px solid var(--ds-accent)" : "1px solid var(--ds-border)",
                      backgroundColor: isActive ? "var(--ds-accent-bg)" : "var(--ds-card)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                      opacity: bandFilter !== "ALL" && st.inBand === 0 ? 0.5 : 1,
                    }}
                  >
                    <div className="toeic-flex-between" style={{ width: "100%" }}>
                      <span
                        style={{
                          padding: "0.18rem 0.5rem",
                          borderRadius: "0.4rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "var(--ds-text-on-accent)",
                          backgroundColor: mod.color_hex || "var(--ds-accent)",
                        }}
                      >
                        {mod.module_id}
                      </span>
                      {bandFilter !== "ALL" ? (
                        <ToeicBadge variant={st.inBand > 0 ? "primary" : "muted"}>
                          {st.inBand} từ Band {bandFilter}
                        </ToeicBadge>
                      ) : locked ? (
                        <ToeicBadge variant="warning" icon="lock">
                          Dùng thử 3 từ/chủ đề
                        </ToeicBadge>
                      ) : (
                        <ToeicBadge variant="success">
                          {st.learned}/{st.total} từ
                        </ToeicBadge>
                      )}
                    </div>

                    <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--ds-text-heading)", lineHeight: 1.3 }}>
                      {mod.module_name_vi}
                    </div>

                    <div className="toeic-flex-between" style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)", marginTop: "0.1rem", gap: "0.5rem" }}>
                      <span>{mod.module_name_en} · {mod.topic_count} chủ đề</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectModuleDeck) onSelectModuleDeck(mod.module_id, bandFilter);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--ds-accent)",
                          fontWeight: 800,
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          padding: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Học ngay &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Topics in Selected Module */}
          <div ref={topicsSectionRef}>
            <div className="toeic-flex-between" style={{ marginBottom: "0.65rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.94rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
                  5 Chủ Đề trong {selectedModuleId}: {selectedModuleObj?.module_name_vi || ""}
                </h4>
                <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                  Chọn 1 chủ đề để mở bộ thẻ 3D hoặc bấm Học cả Module
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                {onSelectModuleDeck && (
                  <button
                    type="button"
                    onClick={() => onSelectModuleDeck(selectedModuleId, bandFilter)}
                    className="toeic-btn toeic-btn-primary"
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
                  >
                    Học cả {selectedModuleId} &rarr;
                  </button>
                )}
                {!isVip && !isSelectedModuleFree && onOpenPaywall && (
                  <button
                    type="button"
                    onClick={() => onOpenPaywall()}
                    style={{
                      border: "none",
                      borderRadius: "0.55rem",
                      padding: "0.42rem 0.75rem",
                      backgroundColor: "var(--ds-btn-warning)",
                      color: "var(--ds-text-on-accent)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Mở khóa VIP
                  </button>
                )}
              </div>
            </div>

            <div className="toeic-fc-topic-grid">
              {moduleTopics.map((topic) => {
                const isSelectedTopic = Number(selectedTopicId) === Number(topic.topic_id);
                const bandCount = topicBandCounts.get(Number(topic.topic_id)) || 0;
                return (
                  <button
                    key={topic.topic_id}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(topic.topic_id);
                      if (onSelectTopicDeck) onSelectTopicDeck(selectedModuleId, topic.topic_id, bandFilter);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "0.85rem",
                      border: isSelectedTopic ? "1.5px solid var(--ds-accent)" : "1px solid var(--ds-border)",
                      backgroundColor: isSelectedTopic ? "var(--ds-accent-bg)" : "var(--ds-bg-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      opacity: bandFilter !== "ALL" && bandCount === 0 ? 0.5 : 1,
                    }}
                  >
                    <div className="toeic-flex-between" style={{ width: "100%" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ds-accent)" }}>
                        Topic {String(topic.topic_id).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)" }}>
                        {bandFilter !== "ALL" ? `${bandCount} từ` : `${topic.word_count} từ`} &rarr;
                      </span>
                    </div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
                      {topic.topic_name_vi}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ds-text-secondary)" }}>
                      {topic.topic_name_en}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {bandFilter === "ALL" && (
            <WordPreviewGrid
              title={`Danh sách từ vựng ${selectedModuleId}${selectedTopicId ? ` · Topic ${selectedTopicId}` : ""}`}
              words={filteredWords}
              srsMap={srsMap}
              isVip={isVip}
              onSelectCard={(item) => onSelectCardInDeck && onSelectCardInDeck(item, bandFilter)}
              onOpenPaywall={onOpenPaywall}
            />
          )}
        </>
      )}
    </div>
  );
}

function WordPreviewGrid({ title, words, srsMap, isVip, onSelectCard, onOpenPaywall }) {
  return (
    <div>
      <div className="toeic-flex-between" style={{ marginBottom: "0.55rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
          {title}
        </h4>
      </div>

      {words.length === 0 ? (
        <div className="toeic-card" style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.84rem", color: "var(--ds-text-muted)" }}>
          Không có từ vựng nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="toeic-fc-word-list">
          {words.map((item) => {
            const rec = srsMap.get(Number(item.id));
            const isFree = FREE_FLASHCARD_MODULE_IDS.has(item.module_id);
            const topicOrderInMod = ((Number(item.id) - 1) % 20) + 1;
            const lockedPreview = !isVip && !isFree && topicOrderInMod > 3;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (lockedPreview) {
                    if (onOpenPaywall) onOpenPaywall();
                    return;
                  }
                  if (onSelectCard) onSelectCard(item);
                }}
                style={{
                  textAlign: "left",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-card)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.6rem",
                  opacity: lockedPreview ? 0.72 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <strong style={{ fontSize: "0.92rem", color: "var(--ds-text-heading)" }}>
                      {item.word}
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "var(--ds-accent)", fontWeight: 700 }}>
                      {item.part_of_speech}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--ds-text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "210px",
                    }}
                  >
                    {item.meaning_vi}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem", flexShrink: 0 }}>
                  {lockedPreview ? (
                    <KitIcon name="lock" size={14} color="var(--ds-warning)" />
                  ) : (
                    <ToeicBadge variant={rec?.srs_state === "REVIEW" ? "success" : rec ? "warning" : "muted"}>
                      {rec ? rec.srs_state : item.cefr_level}
                    </ToeicBadge>
                  )}
                  <span style={{ fontSize: "0.68rem", color: "var(--ds-text-muted)" }}>
                    {item.toeic_score_band}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
