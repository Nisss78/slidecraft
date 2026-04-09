export { aiProposal } from './ai-proposal.js';
export { webRenewal } from './web-renewal.js';
export { companyIntro } from './company-intro.js';
export { hearingSheet } from './hearing-sheet.js';
export { rfpProposal } from './rfp-proposal.js';
export { quotation } from './quotation.js';
export { nda } from './nda.js';
export { outsourcing } from './outsourcing.js';
export { maintenance } from './maintenance.js';
export { projectPlan } from './project-plan.js';
export { requirements } from './requirements.js';
export { progressReport } from './progress-report.js';
export { roiCalc } from './roi-calc.js';
export { finance } from './finance.js';

import { aiProposal } from './ai-proposal.js';
import { webRenewal } from './web-renewal.js';
import { companyIntro } from './company-intro.js';
import { hearingSheet } from './hearing-sheet.js';
import { rfpProposal } from './rfp-proposal.js';
import { quotation } from './quotation.js';
import { nda } from './nda.js';
import { outsourcing } from './outsourcing.js';
import { maintenance } from './maintenance.js';
import { projectPlan } from './project-plan.js';
import { requirements } from './requirements.js';
import { progressReport } from './progress-report.js';
import { roiCalc } from './roi-calc.js';
import { finance } from './finance.js';
import type { SeedDocument } from './types.js';

export const allDocuments: SeedDocument[] = [
  aiProposal,
  webRenewal,
  companyIntro,
  hearingSheet,
  rfpProposal,
  quotation,
  nda,
  outsourcing,
  maintenance,
  projectPlan,
  requirements,
  progressReport,
  roiCalc,
  finance,
];
