import assert from 'node:assert/strict'
import { test } from 'node:test'

import { branches } from '@/components/CourseRoute/CourseRoute.constants'
import { references } from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'

test('cada conexión del explorador pertenece a un requisito real de la versión consultada', () => {
  for (const branch of branches)
    for (let index = 1; index < branch.codes.length; index++) {
      const course = catalog.courses.find(c => c.code === branch.codes[index])

      assert.ok(course)
      assert.ok(
        references(course.prerequisite).includes(branch.codes[index - 1])
      )
    }
})
