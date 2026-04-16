import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FeatureForm = {
  featureName: string
  productArea: string
  primaryUser: string
  businessGoal: string
  featureSummary: string
  currentProblem: string
  desiredOutcome: string
  coreCapabilities: string
  constraints: string
  dependencies: string
  assumptions: string
  curamModules: string
  keyEntities: string
}

const initialForm: FeatureForm = {
  featureName: "",
  productArea: "",
  primaryUser: "",
  businessGoal: "",
  featureSummary: "",
  currentProblem: "",
  desiredOutcome: "",
  coreCapabilities: "",
  constraints: "",
  dependencies: "",
  assumptions: "",
  curamModules: "",
  keyEntities: "",
}


function toList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function LoadingWorkflow({
  steps,
  currentStep,
  message,
}: {
  steps: { title: string; description: string }[]
  currentStep: number
  message: string
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-2 text-xl font-semibold text-slate-900">
        Generating output
      </h3>
      <p className="mb-6 text-sm text-slate-600">{message}</p>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isActive = index === currentStep
          const isPending = index > currentStep

          return (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-lg border p-4"
            >
              <div className="mt-0.5">
                {isComplete ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm text-green-700">
                    ✓
                  </div>
                ) : isActive ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">
                    …
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500">
                    ○
                  </div>
                )}
              </div>

              <div>
                <div
                  className={`font-medium ${isActive
                      ? "text-blue-700"
                      : isComplete
                        ? "text-green-700"
                        : "text-slate-500"
                    }`}
                >
                  {step.title}
                </div>
                <div className="text-sm text-slate-600">{step.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState<FeatureForm>(initialForm)
  const [result, setResult] = useState<string>("")

  const payload = useMemo(() => {
    return {
      feature_name: form.featureName,
      product_area: form.productArea,
      primary_user: form.primaryUser,
      business_goal: form.businessGoal,
      feature_summary: form.featureSummary,
      current_problem: form.currentProblem,
      desired_outcome: form.desiredOutcome,
      core_capabilities: toList(form.coreCapabilities),
      constraints: toList(form.constraints),
      dependencies: toList(form.dependencies),
      assumptions: toList(form.assumptions),
      curam_modules: toList(form.curamModules),
      key_entities: toList(form.keyEntities),
    }
  }, [form])

  function updateField<K extends keyof FeatureForm>(
    key: K,
    value: FeatureForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    

    if (
      !form.featureName.trim() ||
      !form.primaryUser.trim() ||
      !form.featureSummary.trim()
    ) {
      setResult(
        "# Missing required fields\n\nPlease fill in Feature Name, Primary User, and Feature Summary before generating output."
      )
      return
    }

    let progressInterval: number | undefined

    try {
      setIsLoading(true)
      setResult("")
      setLoadingStep(0)
      setLoadingMessage(loadingSteps[0].description)

      progressInterval = window.setInterval(() => {
        setLoadingStep((prev) => {
          const next = Math.min(prev + 1, loadingSteps.length - 1)
          setLoadingMessage(loadingSteps[next].description)
          return next
        })
      }, 2500)

      const response = await fetch("http://localhost:3001/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate output")
      }

      setResult(String(data.markdown || ""))
    } catch (error) {
      console.error(error)
      setResult(
        `# Error\n\n${error instanceof Error
          ? error.message
          : "Failed to generate output from the backend."
        }`
      )
    } finally {
      if (progressInterval) {
        window.clearInterval(progressInterval)
      }
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const loadingSteps = [
    {
      title: "Intake + Curam Expert",
      description: "Analyzing the feature request and identifying Curam-specific context.",
    },
    {
      title: "Delivery Designer",
      description: "Generating user stories, acceptance criteria, and test cases.",
    },
    {
      title: "Formatter",
      description: "Formatting the final output for review.",
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>MyCuramBA</CardTitle>
            <CardDescription>
              Enter a product feature and structure it for your Curam BA
              workflow.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="featureName">Feature Name *</Label>
                <Input
                  id="featureName"
                  value={form.featureName}
                  onChange={(e) => updateField("featureName", e.target.value)}
                  placeholder="Submit income evidence"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productArea">Product Area *</Label>
                <Input
                  id="productArea"
                  value={form.productArea}
                  onChange={(e) => updateField("productArea", e.target.value)}
                  placeholder="Evidence Management"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryUser">Primary User *</Label>
                <Input
                  id="primaryUser"
                  value={form.primaryUser}
                  onChange={(e) => updateField("primaryUser", e.target.value)}
                  placeholder="Case Worker"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessGoal">Business Goal</Label>
                <Textarea
                  id="businessGoal"
                  value={form.businessGoal}
                  onChange={(e) => updateField("businessGoal", e.target.value)}
                  placeholder="Allow staff to capture evidence accurately and consistently."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featureSummary">Feature Summary *</Label>
                <Textarea
                  id="featureSummary"
                  value={form.featureSummary}
                  onChange={(e) => updateField("featureSummary", e.target.value)}
                  placeholder="Describe the feature at a high level."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentProblem">Current Problem</Label>
                <Textarea
                  id="currentProblem"
                  value={form.currentProblem}
                  onChange={(e) => updateField("currentProblem", e.target.value)}
                  placeholder="What is broken or missing today?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredOutcome">Desired Outcome</Label>
                <Textarea
                  id="desiredOutcome"
                  value={form.desiredOutcome}
                  onChange={(e) => updateField("desiredOutcome", e.target.value)}
                  placeholder="What should happen after this is built?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coreCapabilities">
                  Core Capabilities (one per line)
                </Label>
                <Textarea
                  id="coreCapabilities"
                  value={form.coreCapabilities}
                  onChange={(e) =>
                    updateField("coreCapabilities", e.target.value)
                  }
                  placeholder={
                    "Capture evidence\nValidate required fields\nTrigger review workflow"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints (one per line)</Label>
                <Textarea
                  id="constraints"
                  value={form.constraints}
                  onChange={(e) => updateField("constraints", e.target.value)}
                  placeholder={
                    "Must follow Curam OOTB where possible\nMust support required validations"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependencies">
                  Dependencies (one per line)
                </Label>
                <Textarea
                  id="dependencies"
                  value={form.dependencies}
                  onChange={(e) => updateField("dependencies", e.target.value)}
                  placeholder={
                    "Evidence entity configuration\nUser role permissions"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assumptions">Assumptions (one per line)</Label>
                <Textarea
                  id="assumptions"
                  value={form.assumptions}
                  onChange={(e) => updateField("assumptions", e.target.value)}
                  placeholder={"Case worker is already authenticated"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curamModules">
                  Relevant Curam Modules (one per line)
                </Label>
                <Textarea
                  id="curamModules"
                  value={form.curamModules}
                  onChange={(e) => updateField("curamModules", e.target.value)}
                  placeholder={"Evidence\nIntegrated Case\nProduct Delivery"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyEntities">Key Entities (one per line)</Label>
                <Textarea
                  id="keyEntities"
                  value={form.keyEntities}
                  onChange={(e) => updateField("keyEntities", e.target.value)}
                  placeholder={"Case\nParticipant\nEvidence Record"}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="outline" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Formatted Output"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setResult("# Test Output\n\n## Hello\n\nThis proves the frontend render works.")
                  }
                >
                  Test Frontend Render
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(initialForm)
                    setResult("")
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Structured Output Preview</CardTitle>
            <CardDescription>
              Before generation, this shows the payload. After generation, it
              shows a formatted document preview.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <LoadingWorkflow
                steps={loadingSteps}
                currentStep={loadingStep}
                message={loadingMessage}
              />
            ) : result && result.trim() ? (
              <div className="max-h-[75vh] overflow-y-auto rounded-lg border bg-white p-6">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 text-3xl font-bold text-slate-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-8 mb-3 border-b pb-2 text-2xl font-semibold text-slate-800">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-6 mb-2 text-xl font-semibold text-slate-800">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-7 text-slate-700">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">
                        {children}
                      </strong>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}