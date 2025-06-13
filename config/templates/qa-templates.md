# QA Templates - Progressive Complexity

## Level 1: Quick QA Check (Target: 200 tokens)
```markdown
# QA Check: {{title}}

**Component:** {{component}}  
**Status:** {{status}}

**Tests:**
- [ ] {{test1}}
- [ ] {{test2}}
- [ ] {{test3}}

**Issues:** {{issues}}  
**Next:** {{nextAction}}
```

## Level 2: Standard QA Report (Target: 500 tokens)
```markdown
# QA Report: {{title}}

## Overview
{{overview}}

## Test Coverage
| Component | Unit Tests | Integration | Status |
|-----------|------------|-------------|---------|
| {{component1}} | {{unit1}} | {{integration1}} | {{status1}} |
| {{component2}} | {{unit2}} | {{integration2}} | {{status2}} |
| {{component3}} | {{unit3}} | {{integration3}} | {{status3}} |

## Test Results
**Passed:** {{passed}}  
**Failed:** {{failed}}  
**Skipped:** {{skipped}}

## Issues Found
{{issuesFound}}

## Performance Metrics
{{performanceMetrics}}

## Security Check
{{securityCheck}}

## Recommendations
{{recommendations}}

## Sign-off
{{signoff}}
```

## Level 3: Comprehensive QA Analysis (Target: 1000 tokens)
```markdown
# QA Analysis: {{title}}

## Executive Summary
{{executiveSummary}}

## Testing Scope
{{testingScope}}

## Test Strategy
{{testStrategy}}

## Test Environment
{{testEnvironment}}

## Detailed Test Results

### Unit Testing
**Coverage:** {{unitCoverage}}  
**Results:** {{unitResults}}  
**Key Findings:** {{unitFindings}}

### Integration Testing
**Coverage:** {{integrationCoverage}}  
**Results:** {{integrationResults}}  
**Key Findings:** {{integrationFindings}}

### System Testing
**Coverage:** {{systemCoverage}}  
**Results:** {{systemResults}}  
**Key Findings:** {{systemFindings}}

### User Acceptance Testing
**Coverage:** {{uatCoverage}}  
**Results:** {{uatResults}}  
**Key Findings:** {{uatFindings}}

## Performance Analysis
{{performanceAnalysis}}

### Load Testing
{{loadTesting}}

### Stress Testing
{{stressTesting}}

### Volume Testing
{{volumeTesting}}

## Security Assessment
{{securityAssessment}}

### Vulnerability Scan
{{vulnerabilityScan}}

### Penetration Testing
{{penetrationTesting}}

### Code Security Review
{{codeSecurityReview}}

## Compatibility Testing
{{compatibilityTesting}}

## Usability Testing
{{usabilityTesting}}

## Issues & Defects

### Critical Issues
{{criticalIssues}}

### Major Issues
{{majorIssues}}

### Minor Issues
{{minorIssues}}

### Enhancement Requests
{{enhancementRequests}}

## Risk Assessment
{{riskAssessment}}

## Recommendations
{{recommendations}}

### Immediate Actions
{{immediateActions}}

### Future Improvements
{{futureImprovements}}

## Sign-off & Approval
{{signoffApproval}}
```

## Level 4: Expert QA Validation (Target: 2000 tokens)
```markdown
# QA Validation Report: {{title}}

## Document Information
**Date:** {{date}}  
**Version:** {{version}}  
**QA Lead:** {{qaLead}}  
**Stakeholders:** {{stakeholders}}

## Executive Summary
{{executiveSummary}}

## Project Context

### Business Objectives
{{businessObjectives}}

### Technical Requirements
{{technicalRequirements}}

### Quality Standards
{{qualityStandards}}

### Acceptance Criteria
{{acceptanceCriteria}}

## Test Strategy & Approach

### Testing Methodology
{{testingMethodology}}

### Test Types & Coverage
{{testTypesCoverage}}

### Risk-Based Testing Approach
{{riskBasedTesting}}

### Test Data Management
{{testDataManagement}}

### Test Environment Strategy
{{testEnvironmentStrategy}}

## Detailed Test Execution

### Functional Testing
**Test Suite:** {{functionalTestSuite}}  
**Execution Results:** {{functionalResults}}  
**Coverage Analysis:** {{functionalCoverage}}  
**Defect Analysis:** {{functionalDefects}}

### Non-Functional Testing

#### Performance Testing
**Load Testing Results:** {{loadTestingResults}}  
**Stress Testing Results:** {{stressTestingResults}}  
**Volume Testing Results:** {{volumeTestingResults}}  
**Endurance Testing Results:** {{enduranceTestingResults}}  
**Performance Benchmarks:** {{performanceBenchmarks}}

#### Security Testing
**Vulnerability Assessment:** {{vulnerabilityAssessment}}  
**Security Controls Validation:** {{securityControlsValidation}}  
**Data Protection Verification:** {{dataProtectionVerification}}  
**Authentication & Authorization Testing:** {{authTestingResults}}  
**Security Compliance Check:** {{securityComplianceCheck}}

#### Usability Testing
**User Experience Evaluation:** {{usabilityEvaluation}}  
**Accessibility Testing:** {{accessibilityTesting}}  
**User Interface Validation:** {{uiValidation}}  
**User Journey Testing:** {{userJourneyTesting}}

#### Compatibility Testing
**Browser Compatibility:** {{browserCompatibility}}  
**Device Compatibility:** {{deviceCompatibility}}  
**Operating System Compatibility:** {{osCompatibility}}  
**Version Compatibility:** {{versionCompatibility}}

### Integration Testing
**API Testing Results:** {{apiTestingResults}}  
**System Integration Results:** {{systemIntegrationResults}}  
**Database Integration Results:** {{databaseIntegrationResults}}  
**Third-party Integration Results:** {{thirdPartyIntegrationResults}}

### Regression Testing
**Regression Test Suite:** {{regressionTestSuite}}  
**Automated Regression Results:** {{automatedRegressionResults}}  
**Manual Regression Results:** {{manualRegressionResults}}  
**Impact Analysis:** {{impactAnalysis}}

## Test Automation

### Automation Coverage
{{automationCoverage}}

### Automation Results
{{automationResults}}

### Automation ROI Analysis
{{automationROI}}

### Maintenance Strategy
{{automationMaintenance}}

## Quality Metrics & KPIs

### Test Metrics
{{testMetrics}}

### Defect Metrics
{{defectMetrics}}

### Coverage Metrics
{{coverageMetrics}}

### Quality Gates Status
{{qualityGatesStatus}}

## Defect Analysis

### Defect Summary
{{defectSummary}}

### Critical Defects
{{criticalDefects}}

### High Priority Defects
{{highPriorityDefects}}

### Medium Priority Defects
{{mediumPriorityDefects}}

### Low Priority Defects
{{lowPriorityDefects}}

### Defect Root Cause Analysis
{{defectRootCauseAnalysis}}

### Defect Trends
{{defectTrends}}

## Risk Assessment

### Technical Risks
{{technicalRisks}}

### Business Risks
{{businessRisks}}

### Quality Risks
{{qualityRisks}}

### Risk Mitigation Strategies
{{riskMitigationStrategies}}

## Compliance & Standards

### Industry Standards Compliance
{{industryStandardsCompliance}}

### Regulatory Compliance
{{regulatoryCompliance}}

### Internal Standards Compliance
{{internalStandardsCompliance}}

### Audit Findings
{{auditFindings}}

## Recommendations

### Critical Actions Required
{{criticalActions}}

### Quality Improvements
{{qualityImprovements}}

### Process Improvements
{{processImprovements}}

### Technology Recommendations
{{technologyRecommendations}}

### Training Recommendations
{{trainingRecommendations}}

## Release Decision

### Go/No-Go Recommendation
{{goNoGoRecommendation}}

### Release Readiness Assessment
{{releaseReadinessAssessment}}

### Conditional Release Requirements
{{conditionalReleaseRequirements}}

### Post-Release Monitoring Plan
{{postReleaseMonitoringPlan}}

## Approval & Sign-off

### QA Sign-off
{{qaSignoff}}

### Development Team Sign-off
{{devSignoff}}

### Business Stakeholder Sign-off
{{businessSignoff}}

### Release Manager Sign-off
{{releaseManagerSignoff}}

## Appendices

### Test Cases Summary
{{testCasesSummary}}

### Test Data
{{testData}}

### Test Evidence
{{testEvidence}}

### Tools & Environment Details
{{toolsEnvironmentDetails}}

### References
{{references}}
```