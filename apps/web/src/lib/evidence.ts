export interface EvidenceRange {
  quote: string;
  start: number;
  end: number;
}

export interface Utf16Range {
  start: number;
  end: number;
}

export function matchesEvidence(content: string, evidence: EvidenceRange): boolean {
  const codePoints = Array.from(content);
  return (
    Number.isInteger(evidence.start) &&
    Number.isInteger(evidence.end) &&
    evidence.start >= 0 &&
    evidence.end > evidence.start &&
    evidence.end <= codePoints.length &&
    codePoints.slice(evidence.start, evidence.end).join("") === evidence.quote
  );
}

export function toUtf16Range(content: string, start: number, end: number): Utf16Range {
  const codePoints = Array.from(content);
  return {
    start: codePoints.slice(0, start).join("").length,
    end: codePoints.slice(0, end).join("").length
  };
}
