import { z } from 'zod'

export const evidenceSchema = z.object({
  sourceId: z.string(),
  location: z.string()
})

export type Evidence = z.infer<typeof evidenceSchema>

const evidenceList = z.array(evidenceSchema)

export type Rule = (
  | { kind: 'none' }
  | { kind: 'pass'; course: string }
  | { kind: 'and' | 'or'; rules: Rule[] }
  | { kind: 'credits'; minimum: number; basis: 'origin' | 'recognized' }
  | { kind: 'set'; courses: string[] }
  | { kind: 'cycles'; cycles: number[] }
  | { kind: 'unknown'; reason: string; references: string[] }
) & { evidence?: Evidence[] }

export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
  z.union([
    z.object({ kind: z.literal('none'), evidence: evidenceList.optional() }),
    z.object({
      kind: z.literal('pass'),
      course: z.string(),
      evidence: evidenceList.optional()
    }),
    z.object({
      kind: z.enum(['and', 'or']),
      rules: z.array(ruleSchema).min(1).max(100),
      evidence: evidenceList.optional()
    }),
    z.object({
      kind: z.literal('credits'),
      minimum: z.number().nonnegative().max(1000),
      basis: z.enum(['origin', 'recognized']),
      evidence: evidenceList.optional()
    }),
    z.object({
      kind: z.literal('set'),
      courses: z.array(z.string()).min(1),
      evidence: evidenceList.optional()
    }),
    z.object({
      kind: z.literal('cycles'),
      cycles: z.array(z.number().int().min(1).max(20)).min(1),
      evidence: evidenceList.optional()
    }),
    z.object({
      kind: z.literal('unknown'),
      reason: z.string(),
      references: z.array(z.string()),
      evidence: evidenceList.optional()
    })
  ])
)

export const codeSchema = z.string().regex(/^[A-Z]{2,8}-\d{2,5}$/)

export const periodSchema = z.string().regex(/^20\d{2}(10|20|30)$/)

export const courseSchema = z.object({
  id: z.string(),
  planId: z.string(),
  code: codeSchema,
  originalCode: z.string(),
  name: z.string(),
  cycle: z.number().int().min(1).max(20),
  credits: z.number().positive().max(30),
  required: z.boolean(),
  electiveGroup: z.string().nullable(),
  row: z.number().int(),
  prerequisite: ruleSchema,
  sources: z.record(z.string(), evidenceList)
})

export type Course = z.infer<typeof courseSchema>

export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.string(),
  reviewedAt: z.string(),
  plans: z.array(
    z.object({
      id: z.string(),
      program: z.string(),
      version: z.string(),
      effectiveFrom: periodSchema,
      coverage: z.string(),
      totalCredits: z.number().positive(),
      graduationVerified: z.boolean(),
      sources: z.array(z.string()),
      groups: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slots: z.number().int().positive(),
          creditsPerSlot: z.number().positive(),
          evidence: evidenceList
        })
      )
    })
  ),
  courses: z.array(courseSchema),
  originPlans: z.array(
    z.object({
      id: z.string(),
      program: z.string(),
      version: z.string(),
      effectiveFrom: periodSchema,
      effectiveUntil: periodSchema.nullable(),
      coverage: z.literal('partial'),
      totalCredits: z.null(),
      sources: z.array(z.string())
    })
  ),
  origins: z.array(
    z.object({
      planId: z.string(),
      code: codeSchema,
      name: z.string(),
      credits: z.number().positive().nullable(),
      evidence: evidenceList
    })
  ),
  equivalences: z.array(
    z.object({
      id: z.string(),
      fromPlan: z.string(),
      toPlan: z.string(),
      from: z.array(codeSchema).min(1),
      to: z.array(codeSchema).min(1),
      type: z.string(),
      verification: z.enum(['documented', 'pending']),
      conditions: z.string(),
      evidence: evidenceList
    })
  ),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      version: z.string(),
      scope: z.string(),
      sha256: z.string()
    })
  ),
  issues: z.array(
    z.object({
      id: z.string(),
      courseCode: z.string().nullable(),
      sourceId: z.string(),
      location: z.string(),
      fields: z.string(),
      description: z.string(),
      resolution: z.string()
    })
  )
})

export type Catalog = z.infer<typeof catalogSchema>

export const attemptSchema = z
  .object({
    id: z.string().min(1).max(100),
    planId: z.enum(['isia-2025', 'icsi-2022']),
    code: codeSchema,
    period: periodSchema,
    result: z.enum(['passed', 'in-progress', 'failed', 'pending']),
    originCredits: z.number().positive().max(30).nullable(),
    grade: z.number().min(0).max(20).optional()
  })
  .strict()

export type Attempt = z.infer<typeof attemptSchema>

export const recognitionSchema = z
  .object({
    id: z.string().max(100),
    equivalenceId: z.string().max(150),
    note: z.string().trim().min(3).max(1000)
  })
  .strict()

export const scenarioSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(80),
    planId: z.literal('isia-2025'),
    creditLimit: z.number().int().min(1).max(40),
    courseLimit: z.number().int().min(1).max(12),
    assumeInProgress: z.boolean(),
    includeUnverified: z.boolean().optional(),
    catalogVersion: z.string().max(80),
    periods: z
      .array(
        z
          .object({
            period: periodSchema,
            courses: z.array(codeSchema).max(20)
          })
          .strict()
      )
      .min(1)
      .max(12)
  })
  .strict()

export type Scenario = z.infer<typeof scenarioSchema>

export const profileSchema = z
  .object({
    cohort: periodSchema,
    entryPlan: z.enum(['isia-2025', 'icsi-2022', 'unconfirmed']),
    applicablePlan: z.literal('isia-2025'),
    transition: z.enum(['direct', 'transition', 'unconfirmed']),
    currentCycle: z.number().int().min(1).max(10).optional(),
    preferredCredits: z.number().int().min(1).max(40).optional()
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.transition === 'direct' && p.entryPlan !== 'isia-2025')
      ctx.addIssue({
        code: 'custom',
        message: 'Ingreso directo requiere confirmar ISIA como plan de ingreso.'
      })

    if (p.transition === 'transition' && p.entryPlan !== 'icsi-2022')
      ctx.addIssue({
        code: 'custom',
        message: 'Transición requiere confirmar el plan ICSI de ingreso.'
      })

    if (p.entryPlan === 'icsi-2022' && p.cohort < '202220')
      ctx.addIssue({
        code: 'custom',
        message:
          'El origen ICSI 2022 documenta inicio 202220. Confirma tu plan o elige situación por verificar.'
      })

    if (p.entryPlan === 'isia-2025' && p.cohort < '202510')
      ctx.addIssue({
        code: 'custom',
        message: 'ISIA documenta inicio 202510. Confirma otro plan de ingreso.'
      })
  })

export type Profile = z.infer<typeof profileSchema>

export const workspaceSchema = z
  .object({
    schemaVersion: z.literal(1),
    catalogVersion: z.string().max(80),
    mode: z.enum(['demo', 'personal']),
    profile: profileSchema,
    attempts: z.array(attemptSchema).max(2000),
    recognitions: z.array(recognitionSchema).max(200),
    scenarios: z.array(scenarioSchema).max(30),
    updatedAt: z.string().max(50)
  })
  .strict()

export type Workspace = z.infer<typeof workspaceSchema>

export const backupSchema = z
  .object({
    format: z.literal('rutacreditos'),
    version: z.literal(1),
    data: workspaceSchema
  })
  .strict()
