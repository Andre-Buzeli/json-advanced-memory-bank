# Creative Decision Templates - Progressive Complexity

## Level 1: Quick Decision (Target: 200 tokens)
```markdown
# {{title}}

**Options:**
- A: {{optionA}}
- B: {{optionB}}

**Decision:** {{decision}}
**Reason:** {{reason}}
```

## Level 2: Standard Analysis (Target: 500 tokens)
```markdown
# {{title}}

## Context
{{context}}

## Options Evaluated
| Option | Pros | Cons | Score |
|--------|------|------|-------|
| {{optionA}} | {{prosA}} | {{consA}} | {{scoreA}} |
| {{optionB}} | {{prosB}} | {{consB}} | {{scoreB}} |

## Decision
**Selected:** {{decision}}  
**Rationale:** {{rationale}}

## Next Steps
{{nextSteps}}
```

## Level 3: Detailed Design (Target: 1000 tokens)
```markdown
# {{title}}

## Background & Requirements
{{background}}

### Functional Requirements
{{functionalReqs}}

### Non-Functional Requirements
{{nonFunctionalReqs}}

## Options Analysis

### Option A: {{optionA}}
**Description:** {{descA}}  
**Pros:** {{prosA}}  
**Cons:** {{consA}}  
**Risk Level:** {{riskA}}  
**Implementation Effort:** {{effortA}}

### Option B: {{optionB}}
**Description:** {{descB}}  
**Pros:** {{prosB}}  
**Cons:** {{consB}}  
**Risk Level:** {{riskB}}  
**Implementation Effort:** {{effortB}}

## Decision Matrix
| Criteria | Weight | Option A | Option B |
|----------|--------|----------|----------|
| {{criteria1}} | {{weight1}} | {{scoreA1}} | {{scoreB1}} |
| {{criteria2}} | {{weight2}} | {{scoreA2}} | {{scoreB2}} |
| {{criteria3}} | {{weight3}} | {{scoreA3}} | {{scoreB3}} |
| **Total** | | {{totalA}} | {{totalB}} |

## Recommendation
**Selected:** {{decision}}  
**Justification:** {{justification}}

## Implementation Plan
{{implementationPlan}}

## Risk Mitigation
{{riskMitigation}}
```

## Level 4: Comprehensive Architecture (Target: 2000 tokens)
```markdown
# {{title}} - Architectural Decision Record

## Status
**Date:** {{date}}  
**Status:** {{status}}  
**Stakeholders:** {{stakeholders}}

## Context & Problem Statement
{{problemStatement}}

### Business Context
{{businessContext}}

### Technical Context
{{technicalContext}}

### Constraints
{{constraints}}

## Decision Drivers
{{decisionDrivers}}

## Considered Options

### Option 1: {{optionA}}
**Architecture Overview:**  
{{architectureA}}

**Technical Details:**  
{{technicalDetailsA}}

**Pros:**
{{prosA}}

**Cons:**
{{consA}}

**Risks:**
{{risksA}}

**Cost Implications:**
{{costA}}

### Option 2: {{optionB}}
**Architecture Overview:**  
{{architectureB}}

**Technical Details:**  
{{technicalDetailsB}}

**Pros:**
{{prosB}}

**Cons:**
{{consB}}

**Risks:**
{{risksB}}

**Cost Implications:**
{{costB}}

### Option 3: {{optionC}}
**Architecture Overview:**  
{{architectureC}}

**Technical Details:**  
{{technicalDetailsC}}

**Pros:**
{{prosC}}

**Cons:**
{{consC}}

**Risks:**
{{risksC}}

**Cost Implications:**
{{costC}}

## Decision Outcome
**Chosen Option:** {{decision}}

### Rationale
{{rationale}}

### Expected Benefits
{{benefits}}

### Accepted Trade-offs
{{tradeoffs}}

## Implementation Strategy

### Phase 1: Foundation
{{phase1}}

### Phase 2: Core Implementation
{{phase2}}

### Phase 3: Integration & Testing
{{phase3}}

### Phase 4: Deployment & Monitoring
{{phase4}}

## Monitoring & Success Metrics
{{successMetrics}}

## Risk Management
{{riskManagement}}

## Future Considerations
{{futureConsiderations}}

## References
{{references}}
```