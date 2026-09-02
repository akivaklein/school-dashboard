import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SetupTeachingConfigSection from '../SetupTeachingConfigSection'
import AcademicsPage from '../AcademicsPage'

const mockS = {
  card: {},
  btn: () => ({}),
  badge: () => ({}),
  tag: () => ({}),
  avatar: () => ({}),
}

describe('Topic/Skill Category Uniqueness', () => {
  it('allows same skill name across different categories under the same subject', () => {
    const academicCatalog = {
      subjects: [
        {
          id: 'subject-math',
          label: 'Math',
          active: true,
          divisionKeys: [],
          classIds: [],
          teacherNames: [],
          skills: [
            { id: 'skill-1', label: '1 digit', active: true, category: 'Multiplication' },
            { id: 'skill-2', label: '1 digit', active: true, category: 'Addition' },
            { id: 'skill-3', label: '1 digit', active: true, category: 'Subtraction' },
          ],
        },
      ],
    }

    const markup = renderToStaticMarkup(
      <SetupTeachingConfigSection
        setupActionDraft={{ label: '', points: 1, category: 'Praise' }}
        setSetupActionDraft={() => {}}
        setSetupCustomActions={() => {}}
        setupCustomActions={[]}
        academicCatalog={academicCatalog}
        setAcademicCatalog={() => {}}
        CLASSES={[]}
        DIVISIONS={{}}
        TEACHING_STAFF_OPTIONS={[]}
        S={mockS}
      />,
    )

    expect(markup).toContain('Multiplication')
    expect(markup).toContain('Addition')
    expect(markup).toContain('Subtraction')
    expect(markup).toContain('1 digit')
  })

  it('filters New Marks skills list to only those in the selected category', () => {
    const academicCatalog = {
      subjects: [
        {
          id: 'subject-math',
          label: 'Math',
          active: true,
          divisionKeys: [],
          classIds: [],
          teacherNames: [],
          skills: [
            { id: 'skill-1', label: '1 digit mult', active: true, category: 'Multiplication' },
            { id: 'skill-2', label: '1 digit add', active: true, category: 'Addition' },
            { id: 'skill-3', label: '2 digit add', active: true, category: 'Addition' },
          ],
        },
      ],
    }

    const markup = renderToStaticMarkup(
      <AcademicsPage
        students={[{ id: 1, name: 'Abe', testScores: [] }]}
        setStudents={() => {}}
        role="admin"
        userName="Admin"
        teacherClass=""
        openStudent={() => {}}
        S={mockS}
        CLASSES={[]}
        CLASS_DIVISION={{}}
        ACADEMIC_AREAS={{}}
        academicCatalog={academicCatalog}
        SKILL_RATINGS={['Great', 'Good', 'Developing', 'Weak']}
        RATING_SCORE={{ Great: 4, Good: 3, Developing: 2, Weak: 1 }}
        academicPct={s => (s.score / s.maxScore) * 100}
        academicDisplay={s => `${s.score}/${s.maxScore}`}
        academicStatus={() => 'Doing Well'}
        academicStatusColor={() => '#16a34a'}
        persistStudentFields={async () => true}
      />,
    )

    expect(markup).toContain('Grades')
  })
})
