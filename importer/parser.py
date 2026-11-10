"""
Core Markdown Parser and Deterministic ID Generator for the English Grammar Learning Platform.
"""
import hashlib
import re
import uuid
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any, Tuple

# Deterministic namespace UUID for idempotent imports
GRAMMAR_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def make_id(entity_type: str, key: str) -> str:
    """Generate a deterministic UUIDv5 for any entity based on its type and unique source key."""
    normalized = f"mlh-grammar:{entity_type}:{key.strip().lower()}"
    return str(uuid.uuid5(GRAMMAR_NAMESPACE, normalized))


def compute_checksum(text: str) -> str:
    """Compute SHA-256 hex digest for source traceability and change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@dataclass
class SourceRef:
    source_file: str
    start_line: int
    end_line: int
    heading_ref: str
    checksum: str


class MarkdownParser:
    """Low-level lossless Markdown line reader and structural tokenizer."""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_name = "Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md"
        with open(file_path, "r", encoding="utf-8") as f:
            self.raw_text = f.read()
        self.lines = self.raw_text.splitlines()
        self.total_lines = len(self.lines)

    def slice_text(self, start_line: int, end_line: int) -> str:
        """Return raw markdown lines (1-indexed, inclusive)."""
        return "\n".join(self.lines[start_line - 1 : end_line])

    def extract_tables(self, start_line: int, end_line: int) -> List[Dict[str, Any]]:
        """Extract all Markdown pipe tables within a 1-indexed line range."""
        tables = []
        in_table = False
        table_start = 0
        current_rows = []

        for lno in range(start_line, end_line + 1):
            line = self.lines[lno - 1].strip()
            if line.startswith("|") and line.endswith("|"):
                if not in_table:
                    in_table = True
                    table_start = lno
                    current_rows = []
                current_rows.append(line)
            else:
                if in_table:
                    tables.append(self._parse_table_block(table_start, lno - 1, current_rows))
                    in_table = False
                    current_rows = []
        if in_table and current_rows:
            tables.append(self._parse_table_block(table_start, end_line, current_rows))
        return tables

    def _parse_table_block(self, start_line: int, end_line: int, rows: List[str]) -> Dict[str, Any]:
        parsed_rows = []
        for r in rows:
            cells = [c.strip() for c in r.strip("|").split("|")]
            if all(re.match(r"^-+$", c.replace(" ", "")) for c in cells if c):
                continue
            parsed_rows.append(cells)
        raw_md = "\n".join(rows)
        return {
            "id": make_id("table", f"{start_line}-{end_line}"),
            "start_line": start_line,
            "end_line": end_line,
            "row_count": len(parsed_rows),
            "rows": parsed_rows,
            "raw_markdown": raw_md,
        }

    def detect_special_elements(self, start_line: int, end_line: int) -> Dict[str, Any]:
        """Detect base64 images, strikethrough negative examples, and phonetic notations."""
        base64_images = []
        strikethroughs = []
        for lno in range(start_line, end_line + 1):
            line = self.lines[lno - 1]
            if "data:image/" in line:
                count = line.count("data:image/")
                base64_images.append({"line": lno, "count": count})
            if "~~" in line:
                strikethroughs.append({"line": lno, "text": line.strip()})
        return {
            "base64_images": base64_images,
            "strikethroughs": strikethroughs,
        }
