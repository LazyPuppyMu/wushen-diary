export interface EvidenceRange {
  quote: string;
  start: number;
  end: number;
}

export function matchesEvidence(content: string, evidence: EvidenceRange): boolean {
  return (
    evidence.start >= 0 &&
    evidence.end > evidence.start &&
    evidence.end <= content.length &&
    content.slice(evidence.start, evidence.end) === evidence.quote
  );
}
