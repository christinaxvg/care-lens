import {
  atom,
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Code,
  EmptyState,
  Heading,
  Progress,
  Row,
  Select,
  Separator,
  Stack,
  Text,
  Textarea,
  read,
  set,
  update,
} from 'orca'

type Lens = 'Accessibility' | 'Clarity' | 'Sensory load' | 'Choice and control' | 'Privacy and sensitivity'
type Priority = 'Consider' | 'Review' | 'High priority'
type FindingState = 'open' | 'intentional' | 'dismissed'
type Stage = 'empty' | 'reviewing' | 'complete'

type Finding = {
  id: string
  lens: Lens
  priority: Priority
  title: string
  area: string
  barrier: string
  suggestions: string[]
  state: FindingState
}

const lenses: readonly Lens[] = [
  'Accessibility',
  'Clarity',
  'Sensory load',
  'Choice and control',
  'Privacy and sensitivity',
]

const stageAtom = atom<Stage>('empty')
const descriptionAtom = atom('')
const findingsAtom = atom<Finding[]>([])
const priorityFilterAtom = atom('all')
const lensFilterAtom = atom('all')
const validationAtom = atom(false)
const copyIdAtom = atom<string | null>(null)

const priorityTone: Record<Priority, 'neutral' | 'warning' | 'danger'> = {
  Consider: 'neutral',
  Review: 'warning',
  'High priority': 'danger',
}

const lensTone: Record<Lens, 'accent' | 'success' | 'warning' | 'neutral'> = {
  Accessibility: 'accent',
  Clarity: 'success',
  'Sensory load': 'warning',
  'Choice and control': 'accent',
  'Privacy and sensitivity': 'neutral',
}

function tidy(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function makeFindings(description: string): Finding[] {
  const text = description.toLowerCase()
  const mentionsForm = /form|field|input|checkout|payment|plan|sign up|login/.test(text)
  const mentionsMotion = /motion|animation|video|carousel|auto/.test(text)
  const mentionsSensitive = /health|payment|card|address|phone|email|identity|personal|location/.test(text)
  const mentionsError = /error|invalid|required|failed|warning/.test(text)

  return [
    {
      id: 'accessible-controls',
      lens: 'Accessibility',
      priority: 'High priority',
      title: 'Confirm labels and target size',
      area: mentionsForm ? 'Form fields, option controls, and primary action' : 'Interactive controls and primary action',
      barrier: 'The description does not confirm persistent labels, keyboard order, or comfortable touch targets. These details cannot be verified without inspecting the rendered screen.',
      suggestions: [
        'Use visible labels and programmatic names for every control.',
        'Check a logical focus order and targets of at least 44 × 44 px.',
      ],
      state: 'open',
    },
    {
      id: 'language',
      lens: 'Clarity',
      priority: mentionsError ? 'High priority' : 'Review',
      title: mentionsError ? 'Make recovery language specific' : 'Clarify the next action',
      area: mentionsError ? 'Error message and the control it refers to' : 'Primary instruction and call to action',
      barrier: mentionsError
        ? 'A generic or blaming error can make recovery harder because it does not explain what happened or how to continue.'
        : 'The next step may be difficult to predict if the action label describes the interface instead of the outcome.',
      suggestions: mentionsError
        ? ['Name the issue in neutral language and place the message near the relevant control.', 'Describe one concrete recovery action.']
        : ['Use an outcome-based action label.', 'Add one sentence explaining what will happen next when the consequence is not obvious.'],
      state: 'open',
    },
    {
      id: 'sensory-hierarchy',
      lens: 'Sensory load',
      priority: mentionsMotion ? 'High priority' : 'Consider',
      title: mentionsMotion ? 'Provide control over motion' : 'Check competing emphasis',
      area: mentionsMotion ? 'Animated, auto-advancing, or moving content' : 'Header, cards, badges, and primary action',
      barrier: mentionsMotion
        ? 'Motion that starts or advances without user control may interrupt reading or make the interface harder to follow.'
        : 'Several strongly emphasized elements can make it harder to identify the main task, especially in a dense screen.',
      suggestions: mentionsMotion
        ? ['Respect reduced-motion preferences.', 'Provide pause controls and avoid auto-advancing essential content.']
        : ['Reserve the strongest emphasis for one primary action.', 'Group secondary information and reduce unnecessary borders or badges.'],
      state: 'open',
    },
    {
      id: 'control-exit',
      lens: 'Choice and control',
      priority: /payment|plan|checkout|delete|submit|confirm/.test(text) ? 'High priority' : 'Review',
      title: 'Keep a clear way back',
      area: 'Primary task, confirmation, and exit path',
      barrier: 'The description does not confirm whether someone can go back, cancel, revise a choice, or understand when an action becomes final.',
      suggestions: ['Keep Back or Cancel available before commitment.', 'Explain consequences and offer undo when the action is reversible.'],
      state: 'open',
    },
    {
      id: 'privacy-context',
      lens: 'Privacy and sensitivity',
      priority: mentionsSensitive ? 'High priority' : 'Consider',
      title: mentionsSensitive ? 'Explain why sensitive details are needed' : 'Confirm data expectations',
      area: mentionsSensitive ? 'Personal, health, location, or payment information' : 'Any requested or displayed personal information',
      barrier: mentionsSensitive
        ? 'Sensitive information may be requested or shown without enough context for an informed choice.'
        : 'The description does not make data collection or visibility clear, so this needs designer confirmation rather than an automated conclusion.',
      suggestions: ['Explain purpose, visibility, and retention near the request.', 'Collect only what is needed and provide a meaningful choice when possible.'],
      state: 'open',
    },
  ]
}

function loadExample() {
  set(
    descriptionAtom,
    'Mobile subscription plan screen with Monthly and Annual options, Premium and Family plan cards, a Try for free button, automatic renewal copy, and links to terms and privacy.',
  )
  set(validationAtom, false)
}

function reviewSelection() {
  const description = tidy(read(descriptionAtom))
  if (!description) {
    set(validationAtom, true)
    return
  }
  set(validationAtom, false)
  set(findingsAtom, makeFindings(description))
  set(priorityFilterAtom, 'all')
  set(lensFilterAtom, 'all')
  set(copyIdAtom, null)
  set(stageAtom, 'reviewing')
}

function resetReview() {
  set(stageAtom, 'empty')
  set(descriptionAtom, '')
  set(findingsAtom, [])
  set(priorityFilterAtom, 'all')
  set(lensFilterAtom, 'all')
  set(validationAtom, false)
  set(copyIdAtom, null)
}

function FindingCard({ finding }: { finding: Finding }) {
  const copied = read(copyIdAtom) === finding.id
  return (
    <Card title={finding.title} description={finding.area}>
      <Stack gap="sm">
        <Row gap="xs" wrap>
          <Badge tone={lensTone[finding.lens]}>{finding.lens}</Badge>
          <Badge tone={priorityTone[finding.priority]}>{finding.priority}</Badge>
          {finding.state === 'intentional' ? <Badge tone="success">Marked intentional</Badge> : null}
        </Row>
        <Stack gap="xs">
          <Text weight="semibold">Potential barrier</Text>
          <Text size="sm">{finding.barrier}</Text>
        </Stack>
        <Stack gap="xs">
          <Text weight="semibold">Practical suggestions</Text>
          {finding.suggestions.map((suggestion) => <Text key={suggestion} size="sm">• {suggestion}</Text>)}
        </Stack>
        {copied ? (
          <Callout tone="success" title="Suggested fix ready" icon="copy">
            Use the copy control on the text block below.
          </Callout>
        ) : null}
        {copied ? <Code block>{finding.suggestions.join('\n')}</Code> : null}
        <Row gap="xs" wrap>
          <Button size="sm" icon="copy" onPress={() => set(copyIdAtom, finding.id)}>Copy suggested fix</Button>
          <Button
            size="sm"
            variant="outline"
            icon="check"
            disabled={finding.state === 'intentional'}
            onPress={() => update(findingsAtom, (items) => items.map((item) => item.id === finding.id ? { ...item, state: 'intentional' } : item))}
          >
            Mark intentional
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="close"
            onPress={() => update(findingsAtom, (items) => items.map((item) => item.id === finding.id ? { ...item, state: 'dismissed' } : item))}
          >
            Dismiss
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}

function ReviewInput() {
  const description = read(descriptionAtom)
  const invalid = read(validationAtom)
  return (
    <Stack gap="lg">
      <Box background="muted" radius="lg" padding="md">
        <Stack gap="xs">
          <Heading level={2}>Review one screen with care</Heading>
          <Text size="sm">Select a screen in your design tool, then describe what is visible and what the user is trying to do.</Text>
        </Stack>
      </Box>
      <Textarea
        label="Selected screen or flow"
        rows={6}
        maxLength={1200}
        value={description}
        invalid={invalid}
        placeholder="Example: A subscription screen with two plan choices, a free-trial button, renewal details, and a close control."
        onChange={(value) => {
          set(descriptionAtom, value)
          if (value.trim()) set(validationAtom, false)
        }}
        onSubmit={reviewSelection}
      />
      {invalid ? (
        <Callout tone="danger" title="Describe the selection first" icon="info">
          Care Lens needs visible screen details to support its findings.
        </Callout>
      ) : null}
      <Row gap="xs" wrap>
        <Button tone="accent" icon="search" onPress={reviewSelection}>Review selection</Button>
        <Button variant="outline" onPress={loadExample}>Use example screen</Button>
      </Row>
      <EmptyState
        title="No review yet"
        description="Care Lens checks five lenses and returns specific prompts for your judgment. It does not change the design or certify accessibility or safety."
        icon="layers"
      />
    </Stack>
  )
}

function Results() {
  const allFindings = read(findingsAtom)
  const priorityFilter = read(priorityFilterAtom)
  const lensFilter = read(lensFilterAtom)
  const visible = allFindings.filter((finding) =>
    finding.state !== 'dismissed' &&
    (priorityFilter === 'all' || finding.priority === priorityFilter) &&
    (lensFilter === 'all' || finding.lens === lensFilter),
  )
  const active = allFindings.filter((finding) => finding.state !== 'dismissed')
  const intentional = allFindings.filter((finding) => finding.state === 'intentional').length

  return (
    <Stack gap="lg">
      <Progress label="Five-lens review complete" value={100} />
      <Callout tone="success" title={`${active.length} findings to consider`} icon="check">
        This is a completion summary, not a score. {intentional > 0 ? `${intentional} marked intentional. ` : ''}Use your product context and user research to decide what to change.
      </Callout>
      <Row gap="xs" wrap>
        <Select
          label="Priority"
          value={priorityFilter}
          options={[
            { value: 'all', label: 'All priorities' },
            { value: 'High priority', label: 'High priority' },
            { value: 'Review', label: 'Review' },
            { value: 'Consider', label: 'Consider' },
          ]}
          onChange={(value) => set(priorityFilterAtom, value)}
        />
        <Select
          label="Lens"
          value={lensFilter}
          options={[{ value: 'all', label: 'All lenses' }, ...lenses.map((lens) => ({ value: lens, label: lens }))]}
          onChange={(value) => set(lensFilterAtom, value)}
        />
      </Row>
      <Separator />
      {visible.length === 0 ? (
        <EmptyState title="No findings match these filters" description="Adjust a filter or start a new review." icon="filter" />
      ) : null}
      {lenses.map((lens) => {
        const grouped = visible.filter((finding) => finding.lens === lens)
        if (grouped.length === 0) return null
        return (
          <Stack key={lens} gap="sm">
            <Row justify="between" align="center">
              <Heading level={2}>{lens}</Heading>
              <Badge tone={lensTone[lens]}>{grouped.length}</Badge>
            </Row>
            {grouped.map((finding) => <FindingCard key={finding.id} finding={finding} />)}
          </Stack>
        )
      })}
      <Separator />
      <Button variant="outline" icon="refresh" onPress={resetReview}>Review another screen</Button>
    </Stack>
  )
}

export default function Panel() {
  const stage = read(stageAtom)
  return (
    <Stack gap="lg">
      <Row justify="between" align="center">
        <Stack gap="none">
          <Heading level={1}>Care Lens</Heading>
          <Text muted size="xs">Thoughtful prompts for designer judgment</Text>
        </Stack>
        <Badge tone="accent">Local MVP</Badge>
      </Row>
      <Separator />
      {stage === 'empty' ? <ReviewInput /> : null}
      {stage === 'reviewing' ? (
        <Stack gap="md">
          <Progress label="Five-lens review ready" value={100} />
          <Card title="Review complete" description="Accessibility · Clarity · Sensory load · Choice and control · Privacy and sensitivity" />
          <Text muted size="sm">Care Lens found prompts supported by the description you provided.</Text>
          <Button tone="accent" icon="next" onPress={() => set(stageAtom, 'complete')}>View findings</Button>
        </Stack>
      ) : null}
      {stage === 'complete' ? <Results /> : null}
      <Text muted size="xs">Findings are review prompts, not diagnoses or certification. Nothing is sent, stored, or changed automatically.</Text>
    </Stack>
  )
}
