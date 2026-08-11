export type EvidenceType = 'video' | 'photo' | 'document';
export type EvidenceStatus = 'pending' | 'signed_off' | 'rejected';

export type PortfolioEvidence = {
  id: string;
  username: string;
  employeeName: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  fileDataUrl: string;
  fileName: string;
  fileMimeType: string;
  relatedSkill?: string;
  status: EvidenceStatus;
  signedOffByUsername?: string;
  signedOffByName?: string;
  signedOffAt?: string;
  signOffNotes?: string;
  uploadedAt: string;
};
