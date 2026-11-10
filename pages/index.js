export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>English Grammar Learning Platform</h1>
      <p style={{ color: "#666" }}>Next.js 14 + Prisma + PostgreSQL (Supabase)</p>
      
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #eaeaea", borderRadius: "8px" }}>
        <h2>Core Platform Stats</h2>
        <ul>
          <li><strong>12 Chapters:</strong> Tenses, Clauses, Parts of Speech, Sentence Patterns...</li>
          <li><strong>53 Lessons:</strong> Theoretical modules & grammar structures</li>
          <li><strong>982 Grammar Rules:</strong> Syntactic formulas & usage rules</li>
          <li><strong>1,026 Examples:</strong> Bilingual English-Vietnamese sentences</li>
          <li><strong>2,939 Questions:</strong> Across 134 exercises</li>
          <li><strong>2,956 Verified Answers:</strong> With detailed answer key explanations</li>
        </ul>
      </div>

      <div style={{ marginTop: "1.5rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
        <h3>API & Service Status</h3>
        <p>Phase 1 data migration and schema validation: <strong>100% Passed</strong></p>
      </div>
    </main>
  );
}
