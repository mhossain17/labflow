import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { NewLabClient } from './NewLabClient'

export default async function NewLabPage() {
  const aiEnabled = await checkFeatureFlag('ai_lab_generation')

  return <NewLabClient aiEnabled={aiEnabled} />
}
