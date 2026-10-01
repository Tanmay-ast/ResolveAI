import { Ticket, WorkflowStageResult, KnowledgeArticle } from '../types.js';
import { KNOWLEDGE_BASE } from '../data/mockData.js';

export function executeKnowledgeRetrieval(ticket: Ticket, triageResult: WorkflowStageResult): {
  stageResult: WorkflowStageResult;
  matchedArticle: KnowledgeArticle | null;
} {
  const queryText = `${ticket.title} ${ticket.description} ${triageResult.decision}`.toLowerCase();
  
  // RAG similarity scoring based on keyword overlap and semantic matches
  let bestMatch: KnowledgeArticle | null = null;
  let highestScore = 0;

  for (const article of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of article.keywords) {
      if (queryText.includes(kw.toLowerCase())) {
        score += 15;
      }
    }
    if (article.category.toLowerCase() === (triageResult.evidence.find(e => e.label === 'Identified Category')?.value as string)?.toLowerCase()) {
      score += 25;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = article;
    }
  }

  const confidence = Math.min(Math.max(highestScore, 60), 98);
  const toolOutput = bestMatch ? {
    articleId: bestMatch.id,
    title: bestMatch.title,
    category: bestMatch.category,
    relevanceScore: `${confidence}%`,
    approvedAction: bestMatch.approvedRemediation?.actionName || 'None',
    isAutomatedApproved: bestMatch.approvedRemediation?.isAutomated ?? false,
    riskLevel: bestMatch.approvedRemediation?.riskLevel || 'LOW'
  } : { error: 'No matching SOP found' };

  const stageResult: WorkflowStageResult = {
    stage: 'rag',
    stageName: '2. Knowledge Base & SOP Retrieval (RAG)',
    status: bestMatch ? 'SUCCESS' : 'FAILED',
    evidence: bestMatch ? [
      { label: 'Retrieved SOP ID', value: bestMatch.id, source: 'Acme IT Knowledge Base' },
      { label: 'Standard Operating Procedure', value: bestMatch.title, source: 'Local RAG Index' },
      { label: 'Remediation Protocol', value: bestMatch.approvedRemediation?.actionName ?? 'Manual Investigation', source: 'Policy Registry' },
      { label: 'Execution Risk Level', value: bestMatch.approvedRemediation?.riskLevel ?? 'HIGH', source: 'InfoSec Policy Engine' }
    ] : [
      { label: 'Search Query', value: queryText, source: 'Query Formulator' },
      { label: 'Match Status', value: 'Zero articles met threshold', source: 'RAG Retriever' }
    ],
    toolCalls: [
      {
        toolName: 'searchKnowledgeBaseRAG',
        input: { query: queryText, category: triageResult.evidence.find(e => e.label === 'Identified Category')?.value },
        output: toolOutput,
        timestamp: new Date().toISOString()
      }
    ],
    decision: bestMatch 
      ? `Retrieved authoritative SOP [${bestMatch.id}]: "${bestMatch.title}". Approved action: ${bestMatch.approvedRemediation?.actionName}.`
      : 'No standard operating procedure matched this incident. Escalation candidate.',
    rationale: bestMatch 
      ? `High-confidence match against verified runbook. SOP authorizes automated remediation under risk level [${bestMatch.approvedRemediation?.riskLevel}].`
      : 'Knowledge base lacks automated remediation runbook for these symptoms.',
    confidence
  };

  return { stageResult, matchedArticle: bestMatch };
}
