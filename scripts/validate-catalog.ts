import { validateCatalog } from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'

const errors = validateCatalog(catalog)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else
  console.log(
    `Catálogo ${catalog.version}: ${catalog.courses.length} cursos, total y referencias válidos. ${catalog.issues.length} incidencias preservadas.`
  )
