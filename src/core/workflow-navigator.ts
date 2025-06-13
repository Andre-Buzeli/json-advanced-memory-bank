/**
 * Workflow Navigator - Navigate through enhanced development workflow with visual guidance
 */

export interface NavigationRequest {
  currentMode: WorkflowMode;
  targetMode: WorkflowMode;
  projectName: string;
  complexityLevel?: number;
}

export type WorkflowMode = 'VAN' | 'PLAN' | 'CREATIVE' | 'IMPLEMENT' | 'QA';

export interface NavigationResult {
  transition: string;
  guidance: string;
  visualMap: string;
  nextSteps: string[];
}

export class WorkflowNavigator {
  
  /**
   * Navigate from current mode to target mode
   * @param request - Navigation request
   * @returns Navigation guidance
   */
  async navigate(request: NavigationRequest): Promise<string> {
    const { currentMode, targetMode, projectName, complexityLevel = 2 } = request;
    
    const transition = this.getTransitionGuidance(currentMode, targetMode, complexityLevel);
    const visualMap = this.generateVisualWorkflowMap(currentMode, targetMode, complexityLevel);
    const nextSteps = this.getNextSteps(currentMode, targetMode, complexityLevel);
    
    let navigation = `# 🧭 Workflow Navigator\n\n`;
    navigation += `**Project:** ${projectName}\n`;
    navigation += `**Transition:** ${currentMode} → ${targetMode}\n`;
    navigation += `**Complexity Level:** ${complexityLevel}/4\n\n`;
    
    navigation += `## 🗺️ Visual Workflow Map\n\n${visualMap}\n\n`;
    navigation += `## 🎯 Transition Guidance\n\n${transition}\n\n`;
    navigation += `## 📋 Next Steps\n\n${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n`;
    navigation += `## 📊 Mode Descriptions\n\n${this.getModeDescriptions()}\n`;
    
    return navigation;
  }

  /**
   * Get transition guidance between modes
   * @param currentMode - Current workflow mode
   * @param targetMode - Target workflow mode  
   * @param complexityLevel - Project complexity level
   * @returns Transition guidance
   */
  private getTransitionGuidance(currentMode: WorkflowMode, targetMode: WorkflowMode, complexityLevel: number): string {
    const key = `${currentMode}-${targetMode}`;
    
    const transitions: { [key: string]: (level: number) => string } = {
      'VAN-PLAN': (level) => `
🔍 **VAN → PLAN Transition**

**Prerequisites Verification:**
- ✅ Project structure analyzed and documented
- ✅ Requirements clearly understood  
- ✅ Complexity level ${level} determined
- ✅ Initial scope defined

**Transition Focus:**
Moving from project verification and analysis into structured planning phase. Ensure all foundational understanding is solid before creating detailed implementation plans.

**Key Activities:**
- Document project scope and boundaries
- Identify major components and dependencies
- Create initial timeline estimates
- Define success criteria`,

      'PLAN-CREATIVE': (level) => `
📋 **PLAN → CREATIVE Transition**

**Prerequisites Verification:**
- ✅ Detailed implementation plan created
- ✅ Components and modules identified
- ✅ Dependencies mapped out
- ✅ Resource requirements estimated

**Transition Focus:**
Moving from structured planning into creative design and architecture phase. Use the plan as foundation for exploring design alternatives.

**Key Activities:**
- Design system architecture
- Evaluate technology choices
- Create design prototypes
- Analyze trade-offs between options`,

      'CREATIVE-IMPLEMENT': (level) => `
🎨 **CREATIVE → IMPLEMENT Transition**

**Prerequisites Verification:**
- ✅ Design decisions documented with rationales
- ✅ Architecture patterns selected
- ✅ Technology stack finalized
- ✅ Trade-off analysis completed

**Transition Focus:**
Moving from design exploration into systematic implementation. Design decisions should guide implementation approach.

**Key Activities:**
- Set up development environment
- Implement core components first
- Follow coding standards and patterns
- Document code as you build`,

      'IMPLEMENT-QA': (level) => `
⚙️ **IMPLEMENT → QA Transition**

**Prerequisites Verification:**
- ✅ Core functionality implemented
- ✅ Code follows established patterns
- ✅ Basic error handling in place
- ✅ Documentation updated

**Transition Focus:**
Moving from implementation into quality assurance and validation phase. Systematic testing and refinement of built components.

**Key Activities:**
- Create comprehensive test suite
- Validate against requirements
- Performance testing and optimization
- User acceptance testing`,

      'QA-VAN': (level) => `
✅ **QA → VAN Transition (New Iteration)**

**Prerequisites Verification:**
- ✅ All tests passing successfully
- ✅ Performance requirements met
- ✅ Documentation complete and accurate
- ✅ Code reviewed and approved

**Transition Focus:**
Completing current iteration and preparing for next cycle. Document lessons learned and plan improvements.

**Key Activities:**
- Conduct retrospective analysis
- Document lessons learned
- Plan next iteration features
- Update project roadmap`
    };
    
    const transitionFunc = transitions[key];
    if (transitionFunc) {
      return transitionFunc(complexityLevel);
    }
    
    // Handle non-sequential transitions
    return `
🔄 **${currentMode} → ${targetMode} Custom Transition**

**Note:** This is a non-sequential transition that may require special consideration.

**Recommended Approach:**
1. Evaluate current state completeness
2. Identify any missing prerequisites for target mode
3. Create bridging tasks if needed
4. Proceed with caution and additional validation

**Complexity Considerations (Level ${complexityLevel}):**
${this.getComplexityGuidance(complexityLevel)}`;
  }

  /**
   * Get complexity-specific guidance
   * @param complexityLevel - Project complexity level
   * @returns Complexity guidance
   */
  private getComplexityGuidance(complexityLevel: number): string {
    const guidance: { [key: number]: string } = {
      1: '- Simple project: Fast transitions possible\n- Minimal documentation required\n- Quick validation cycles',
      2: '- Standard project: Normal transition pace\n- Standard documentation practices\n- Regular validation checkpoints',
      3: '- Complex project: Careful transition planning\n- Comprehensive documentation required\n- Thorough validation at each stage',
      4: '- Enterprise project: Detailed transition protocols\n- Full documentation and approval processes\n- Extensive validation and testing required'
    };
    
    return guidance[complexityLevel] || guidance[2];
  }

  /**
   * Generate visual workflow map with current position
   * @param currentMode - Current workflow mode
   * @param targetMode - Target workflow mode
   * @param complexityLevel - Complexity level
   * @returns Mermaid diagram markup
   */
  private generateVisualWorkflowMap(currentMode: WorkflowMode, targetMode: WorkflowMode, complexityLevel: number): string {
    return `\`\`\`mermaid
graph TD
    VAN[🔍 VAN Mode<br/>Verify & Analyze<br/>Initialize project] 
    PLAN[📋 PLAN Mode<br/>Plan & Structure<br/>Create roadmap]
    CREATIVE[🎨 CREATIVE Mode<br/>Design & Explore<br/>Make decisions]
    IMPLEMENT[⚙️ IMPLEMENT Mode<br/>Build & Code<br/>Systematic development]
    QA[✅ QA Mode<br/>Test & Validate<br/>Quality assurance]
    
    VAN -->|Level ${complexityLevel}| PLAN
    PLAN -->|Components Ready| CREATIVE
    CREATIVE -->|Decisions Made| IMPLEMENT
    IMPLEMENT -->|Complete| QA
    QA -->|Validated| VAN
    
    style ${currentMode} fill:#ff6b6b,stroke:#d63031,color:white
    style ${targetMode} fill:#00b894,stroke:#00a085,color:white
    
    classDef current fill:#ff6b6b,stroke:#d63031,color:white
    classDef target fill:#00b894,stroke:#00a085,color:white
    classDef normal fill:#74b9ff,stroke:#0984e3,color:white
    
    class ${currentMode} current
    class ${targetMode} target
\`\`\``;
  }

  /**
   * Get next steps for the transition
   * @param currentMode - Current workflow mode
   * @param targetMode - Target workflow mode
   * @param complexityLevel - Complexity level
   * @returns Array of next steps
   */
  private getNextSteps(currentMode: WorkflowMode, targetMode: WorkflowMode, complexityLevel: number): string[] {
    const stepMap: { [key: string]: string[] } = {
      'VAN-PLAN': [
        'Complete current mode validation checklist',
        'Document project scope and requirements',
        'Create initial component breakdown',
        'Transition to PLAN mode and begin detailed planning'
      ],
      'PLAN-CREATIVE': [
        'Finalize implementation plan documentation',
        'Review and approve component architecture',
        'Prepare design exploration framework',
        'Transition to CREATIVE mode for design decisions'
      ],
      'CREATIVE-IMPLEMENT': [
        'Document all design decisions and rationales',
        'Set up development environment and tools',
        'Create implementation timeline',
        'Begin IMPLEMENT mode with core components'
      ],
      'IMPLEMENT-QA': [
        'Complete current implementation milestone',
        'Prepare comprehensive test plan',
        'Document implemented features',
        'Transition to QA mode for validation'
      ],
      'QA-VAN': [
        'Complete all test suites and validation',
        'Document lessons learned and improvements',
        'Plan next iteration scope',
        'Begin new VAN cycle for next features'
      ]
    };
    
    const key = `${currentMode}-${targetMode}`;
    const defaultSteps = [
      `Complete current ${currentMode} mode activities`,
      `Review transition prerequisites`,
      `Prepare materials for ${targetMode} mode`,
      `Execute transition with appropriate validation`
    ];
    
    return stepMap[key] || defaultSteps;
  }

  /**
   * Get descriptions for all workflow modes
   * @returns Mode descriptions
   */
  private getModeDescriptions(): string {
    return `
### 🔍 VAN Mode (Verify & Analyze)
- **Purpose**: Project initialization and verification
- **Activities**: Analyze structure, understand requirements, determine complexity
- **Output**: Project scope, initial understanding, complexity assessment

### 📋 PLAN Mode (Plan & Structure)  
- **Purpose**: Create detailed implementation roadmap
- **Activities**: Component identification, dependency mapping, timeline creation
- **Output**: Implementation plan, component breakdown, resource estimates

### 🎨 CREATIVE Mode (Design & Explore)
- **Purpose**: Design decisions and architecture exploration
- **Activities**: Design alternatives, trade-off analysis, technology selection
- **Output**: System design, architecture patterns, technology choices

### ⚙️ IMPLEMENT Mode (Build & Code)
- **Purpose**: Systematic implementation of planned components
- **Activities**: Coding, testing, documentation, iterative development
- **Output**: Working code, unit tests, technical documentation

### ✅ QA Mode (Test & Validate)
- **Purpose**: Quality assurance and comprehensive validation
- **Activities**: Integration testing, performance validation, user acceptance
- **Output**: Validated system, test results, quality metrics`;
  }
}