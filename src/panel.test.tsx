import { assert, mount, test } from 'orca/testing'
import * as panel from './panel'

test('explains how to begin and validates an empty review', async () => {
  const view = await mount(panel)
  assert.equal(view.find({ label: 'No review yet' }) !== null, true)
  await view.press({ text: 'Review selection' })
  assert.equal(view.find({ label: 'Describe the selection first' }) !== null, true)
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('reviews a screen across five lenses', async () => {
  const view = await mount(panel)
  await view.type(
    { label: 'Selected screen or flow' },
    'A mobile subscription plan screen with two plan choices, a Try for free button, automatic renewal copy, and privacy links.',
    { replace: true },
  )
  await view.press({ text: 'Review selection' })
  await view.press({ text: 'View findings' })

  assert.equal(view.find({ label: '5 findings to consider' }) !== null, true)
  assert.equal(view.find({ text: 'Accessibility' }) !== null, true)
  assert.equal(view.find({ text: 'Clarity' }) !== null, true)
  assert.equal(view.find({ text: 'Sensory load' }) !== null, true)
  assert.equal(view.find({ text: 'Choice and control' }) !== null, true)
  assert.equal(view.find({ text: 'Privacy and sensitivity' }) !== null, true)
  assert.deepEqual(view.errors, [])
  await view.unmount()
})

test('supports copy, intentional, dismiss, and filters', async () => {
  const view = await mount(panel, { theme: 'dark' })
  await view.press({ text: 'Use example screen' })
  await view.press({ text: 'Review selection' })
  await view.press({ text: 'View findings' })

  await view.press({ text: 'Copy suggested fix', nth: 0 })
  assert.equal(view.find({ label: 'Suggested fix ready' }) !== null, true)

  await view.press({ text: 'Mark intentional', nth: 0 })
  assert.equal(view.find({ text: 'Marked intentional' }) !== null, true)

  await view.press({ text: 'Dismiss', nth: 0 })
  assert.equal(view.find({ label: '4 findings to consider' }) !== null, true)
  assert.deepEqual(view.errors, [])
  assert.deepEqual(view.warnings, [])
  await view.unmount()
})
