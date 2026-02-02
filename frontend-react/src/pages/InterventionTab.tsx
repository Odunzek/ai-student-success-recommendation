import { useState } from 'react'
import { Sparkles, BookOpen } from 'lucide-react'
import { InterventionForm } from '../components/intervention/InterventionForm'
import { InterventionCard } from '../components/intervention/InterventionCard'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/Spinner'
import { useIntervention } from '../api/hooks/useIntervention'
import { useAppStore } from '../store/useAppStore'
import type { InterventionInput, InterventionResult } from '../types/intervention'

export function InterventionTab() {
  const [result, setResult] = useState<InterventionResult | null>(null)
  const intervention = useIntervention()
  const { useLlm, setUseLlm } = useAppStore()

  const handleSubmit = async (data: InterventionInput) => {
    const result = await intervention.mutateAsync(data)
    setResult(result)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <InterventionForm
          onSubmit={handleSubmit}
          isLoading={intervention.isPending}
          useLlm={useLlm}
          onToggleLlm={setUseLlm}
        />

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended Interventions</CardTitle>
              {result && (
                <Badge variant={result.generated_by === 'llm' ? 'primary' : 'default'}>
                  {result.generated_by === 'llm' ? (
                    <><Sparkles className="h-3 w-3 mr-1" /> AI Generated</>
                  ) : (
                    <><BookOpen className="h-3 w-3 mr-1" /> Rule-Based</>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>

          {intervention.isPending && <LoadingState message="Generating interventions..." />}

          {intervention.isError && (
            <Alert variant="error" title="Generation Failed">
              {intervention.error?.message || 'An error occurred while generating interventions.'}
            </Alert>
          )}

          {!intervention.isPending && !result && !intervention.isError && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select risk factors and generate interventions to see recommendations.</p>
            </div>
          )}

          {result && !intervention.isPending && (
            <div className="space-y-4">
              {result.summary && (
                <Alert variant="info">
                  {result.summary}
                </Alert>
              )}

              {result.interventions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No interventions generated for the selected criteria.
                </p>
              ) : (
                <div className="space-y-3">
                  {result.interventions.map((item) => (
                    <InterventionCard key={item.id} intervention={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
