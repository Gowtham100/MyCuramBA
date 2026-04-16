import { Agent, type AgentInputItem, Runner, withTrace } from "@openai/agents";

const intakeCuramAgent = new Agent({
  name: "Intake + Curam Expert",
  instructions: `ROLE:
You are a senior Business Analyst and Curam SPM expert.

TASK:
Transform a raw feature request into a structured feature definition enriched with Curam-specific context.

INSTRUCTIONS:
- Identify feature name, goal, primary user, and business value
- Break the feature into logical widgets/modules
- Use Curam terminology such as case, evidence, participant, and product delivery
- Prefer Curam out-of-the-box capabilities over custom solutions
- Use uploaded Curam documentation where relevant that is in storage
- Do NOT hallucinate unsupported functionality
- Keep output structured and concise

OUTPUT FORMAT (JSON ONLY):
{
  "feature_name": "",
  "goal": "",
  "primary_user": "",
  "business_value": "",
  "core_capabilities": [],
  "constraints": [],
  "dependencies": [],
  "assumptions": [],
  "curam_context": {
    "relevant_modules": [],
    "ootb_capabilities": [],
    "key_entities": [],
    "constraints": [],
    "assumptions": []
  },
  "widgets": [
    {
      "widget_id": "",
      "widget_name": "",
      "purpose": "",
      "included_functionality": []
    }
  ]
}`,
  model: "gpt-5.4-mini",
  modelSettings: {
    reasoning: {
      effort: "medium",
      summary: "auto",
    },
    store: true,
  },
});

const deliveryAgent = new Agent({
  name: "Delivery Designer",
  instructions: `ROLE:
You are a Business Analyst and QA designer responsible for creating Azure DevOps User Stories and Test Cases.

TASK:
Generate Azure DevOps-ready User Stories and Test Cases with strict traceability.

CRITICAL RULES:
- Every User Story MUST include acceptance criteria in Given/When/Then format
- Test Cases MUST be derived ONLY from User Story acceptance criteria
- Do NOT invent new business requirements
- Ensure full traceability between stories and tests
- If requirements are unclear, flag them in review findings

USER STORY REQUIREMENTS:
- Must include business requirements
- Must include acceptance criteria using Given/When/Then
- Must be implementation-ready

TEST CASE REQUIREMENTS:
- Must reference a related_story_id
- Must map directly to acceptance criteria
- Must include positive, negative, and edge cases where applicable

INSTRUCTIONS:
- Use curam_context to shape logic and workflows
- Align with Curam processes such as case, evidence, eligibility, and product delivery
- Ensure test coverage for all acceptance criteria
- If coverage is missing, explicitly flag it

OUTPUT FORMAT (JSON ONLY):
{
  "user_stories": [
    {
      "story_id": "",
      "title": "",
      "description": "",
      "business_requirements": [],
      "acceptance_criteria": [
        "Given ... When ... Then ..."
      ],
      "business_value": "",
      "dependencies": [],
      "assumptions": []
    }
  ],
  "test_cases": [
    {
      "test_case_id": "",
      "related_story_id": "",
      "derived_from_acceptance_criteria": [
        "Given ... When ... Then ..."
      ],
      "title": "",
      "preconditions": [],
      "steps": [
        {
          "step_number": "",
          "action": "",
          "expected_result": ""
        }
      ],
      "test_type": ""
    }
  ],
  "review_findings": {
    "missing_coverage": [],
    "duplicates": [],
    "ambiguities": [],
    "recommendations": []
  }
}`,
  model: "gpt-5.4-mini",
  modelSettings: {
    reasoning: {
      effort: "medium",
      summary: "auto",
    },
    store: true,
  },
});

const formatterAgent = new Agent({
  name: "Formatter",
  instructions: `ROLE:
You format Business Analysis output into clean, readable Azure DevOps-ready structure.

TASK:
Convert structured JSON into a concise markdown output.

INSTRUCTIONS:
- Keep output clean and easy to scan
- Avoid unnecessary verbosity
- Maintain strict structure
- Ensure readability for BA, Dev, and QA stakeholders

FORMAT:

# Feature: <name>

## Summary
- Goal
- Primary User
- Business Value

## Widgets
- List of widgets

## User Stories
For each:
- Title
- Description
- Business Requirements
- Acceptance Criteria (Given/When/Then)

## Test Cases
For each:
- Title
- Related User Story
- Derived Acceptance Criteria
- Preconditions
- Steps (Action + Expected Result)
- Test Type

## Review Findings
- Missing Coverage
- Duplicates
- Ambiguities
- Recommendations

OUTPUT:
Return clean markdown only.`,
  model: "gpt-5.4-mini",
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto",
    },
    store: true,
  },
});

export type WorkflowInput = {
  input_as_text: string;
};

export type WorkflowResult = {
  intake: string;
  delivery: string;
  formatted: string;
};

export const runWorkflow = async (
  workflow: WorkflowInput
): Promise<WorkflowResult> => {
  return await withTrace("BA_Agent_Flow", async () => {
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: workflow.input_as_text }],
      },
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
      },
    });

    const intakeResultTemp = await runner.run(intakeCuramAgent, [
      ...conversationHistory,
    ]);

    conversationHistory.push(
      ...intakeResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!intakeResultTemp.finalOutput) {
      throw new Error("Intake + Curam Expert result is undefined");
    }

    const intakeResult = {
      output_text: intakeResultTemp.finalOutput ?? "",
    };

    const deliveryResultTemp = await runner.run(deliveryAgent, [
      ...conversationHistory,
    ]);

    conversationHistory.push(
      ...deliveryResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!deliveryResultTemp.finalOutput) {
      throw new Error("Delivery Designer result is undefined");
    }

    const deliveryResult = {
      output_text: deliveryResultTemp.finalOutput ?? "",
    };

    const formatterResultTemp = await runner.run(formatterAgent, [
      ...conversationHistory,
    ]);

    conversationHistory.push(
      ...formatterResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!formatterResultTemp.finalOutput) {
      throw new Error("Formatter result is undefined");
    }

    const formatterResult = {
      output_text: formatterResultTemp.finalOutput ?? "",
    };

    return {
      intake: intakeResult.output_text,
      delivery: deliveryResult.output_text,
      formatted: formatterResult.output_text,
    };
  });
};