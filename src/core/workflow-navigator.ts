/**
 * Workflow Navigator v4.0.0 - Workflow management and navigation
 */

import { MemoryManager } from './memory-manager.js';
import { WorkflowResult, Workflow, WorkflowStep } from '../types/index.js';

export class WorkflowNavigator {
  private readonly version = '4.0.0';
  private readonly memoryManager: MemoryManager;
  private readonly currentWorkflows: Map<string, Workflow> = new Map();

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * Navigate workflow based on action
   */
  async navigate(
    action: string,
    workflowName?: string,
    stepNumber?: number,
    stepContent?: string
  ): Promise<WorkflowResult> {
    try {
      switch (action) {
        case 'create':
          return await this.createWorkflow(workflowName || 'default', stepContent);
        case 'next':
          return await this.nextStep(workflowName || 'default', stepContent);
        case 'previous':
          return await this.previousStep(workflowName || 'default');
        case 'jump':
          return await this.jumpToStep(workflowName || 'default', stepNumber || 1);
        case 'complete':
          return await this.completeWorkflow(workflowName || 'default');
        case 'status':
          return await this.getWorkflowStatus(workflowName || 'default');
        default:
          throw new Error(`Unknown workflow action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Workflow navigation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Create a new workflow
   */
  private async createWorkflow(name: string, initialStep?: string): Promise<WorkflowResult> {
    const workflow: Workflow = {
      id: this.generateWorkflowId(),
      name,
      steps: [],
      currentStep: 0,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (initialStep) {
      const step: WorkflowStep = {
        id: this.generateStepId(),
        stepNumber: 1,
        content: initialStep,
        completed: false,
        timestamp: Date.now(),
      };
      workflow.steps.push(step);
      workflow.currentStep = 1;
    }

    this.currentWorkflows.set(name, workflow);

    // Store in memory
    await this.memoryManager.storeMemory(
      `Workflow created: ${name}${initialStep ? ` with initial step: ${initialStep}` : ''}`,
      ['workflow', 'creation', name],
      6
    );

    return {
      success: true,
      message: `Workflow '${name}' created successfully${workflow.steps.length ? ' with initial step' : ''}`,
      workflow,
    };
  }

  /**
   * Move to next step
   */
  private async nextStep(workflowName: string, stepContent?: string): Promise<WorkflowResult> {
    const workflow = this.currentWorkflows.get(workflowName);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found`,
      };
    }

    // Mark current step as completed
    if (workflow.currentStep > 0) {
      const currentStep = workflow.steps[workflow.currentStep - 1];
      if (currentStep) {
        currentStep.completed = true;
      }
    }

    // Create new step if content provided
    if (stepContent) {
      const newStep: WorkflowStep = {
        id: this.generateStepId(),
        stepNumber: workflow.steps.length + 1,
        content: stepContent,
        completed: false,
        timestamp: Date.now(),
      };
      workflow.steps.push(newStep);
      workflow.currentStep = newStep.stepNumber;
    } else {
      // Move to next existing step
      if (workflow.currentStep < workflow.steps.length) {
        workflow.currentStep++;
      }
    }

    workflow.updatedAt = Date.now();

    // Store progress in memory
    await this.memoryManager.storeMemory(
      `Workflow '${workflowName}' advanced to step ${workflow.currentStep}${stepContent ? `: ${stepContent}` : ''}`,
      ['workflow', 'progress', workflowName],
      5
    );

    return {
      success: true,
      message: `Advanced to step ${workflow.currentStep}`,
      workflow,
      currentStep: workflow.steps[workflow.currentStep - 1] || workflow.steps[0],
    };
  }

  /**
   * Move to previous step
   */
  private async previousStep(workflowName: string): Promise<WorkflowResult> {
    const workflow = this.currentWorkflows.get(workflowName);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found`,
      };
    }

    if (workflow.currentStep > 1) {
      workflow.currentStep--;
      workflow.updatedAt = Date.now();

      return {
        success: true,
        message: `Moved back to step ${workflow.currentStep}`,
        workflow,
        currentStep: workflow.steps[workflow.currentStep - 1],
      };
    }

    return {
      success: false,
      message: 'Already at the first step',
    };
  }

  /**
   * Jump to specific step
   */
  private async jumpToStep(workflowName: string, stepNumber: number): Promise<WorkflowResult> {
    const workflow = this.currentWorkflows.get(workflowName);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found`,
      };
    }

    if (stepNumber < 1 || stepNumber > workflow.steps.length) {
      return {
        success: false,
        message: `Step ${stepNumber} does not exist. Workflow has ${workflow.steps.length} steps.`,
      };
    }

    workflow.currentStep = stepNumber;
    workflow.updatedAt = Date.now();

    return {
      success: true,
      message: `Jumped to step ${stepNumber}`,
      workflow,
      currentStep: workflow.steps[stepNumber - 1],
    };
  }

  /**
   * Complete workflow
   */
  private async completeWorkflow(workflowName: string): Promise<WorkflowResult> {
    const workflow = this.currentWorkflows.get(workflowName);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found`,
      };
    }

    workflow.completed = true;
    workflow.updatedAt = Date.now();

    // Mark all steps as completed
    workflow.steps.forEach(step => {
      step.completed = true;
    });

    // Store completion in memory
    await this.memoryManager.storeMemory(
      `Workflow '${workflowName}' completed with ${workflow.steps.length} steps`,
      ['workflow', 'completion', workflowName],
      7
    );

    return {
      success: true,
      message: `Workflow '${workflowName}' completed successfully`,
      workflow,
    };
  }

  /**
   * Get workflow status
   */
  private async getWorkflowStatus(workflowName: string): Promise<WorkflowResult> {
    const workflow = this.currentWorkflows.get(workflowName);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found`,
      };
    }

    const completedSteps = workflow.steps.filter(step => step.completed).length;
    const totalSteps = workflow.steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      success: true,
      message: `Workflow '${workflowName}' - Step ${workflow.currentStep}/${totalSteps} (${progress.toFixed(1)}% complete)`,
      workflow,
      currentStep: workflow.steps[workflow.currentStep - 1],
    };
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique step ID
   */
  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
