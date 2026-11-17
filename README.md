# Care Lens

Care Lens is a local-first Orca sidebar plugin that helps product designers review one screen at a time for potential barriers across five lenses: accessibility, clarity, sensory load, choice and control, and privacy and sensitivity.

The MVP uses a designer-provided description because Orca components panels do not expose pixels or selections from an external design tool. It generates respectful, actionable prompts; supports filtering, dismissal, and intentional decisions; and never changes the design automatically.

Care Lens does not claim that a design is accessible, safe, or trauma-informed. Findings are prompts for designer judgment, not diagnoses or certification.

## Develop

```sh
orca plugin validate .
orca plugin test .
orca plugin check .
orca plugin dev load .
orca plugin open local.care-lens
```
