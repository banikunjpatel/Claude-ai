import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:8000/api/v1/children', () =>
    HttpResponse.json({ success: true, data: [] })
  ),

  http.post('http://localhost:8000/api/v1/children', () =>
    HttpResponse.json(
      {
        success: true,
        data: {
          id: 'child-001',
          display_name: 'Test Child',
          date_of_birth: '2019-01-01',
          avatar_id: 1,
          skill_focuses: ['communication'],
        },
      },
      { status: 201 }
    )
  ),

  http.get('http://localhost:8000/api/v1/activities/today/:childId', () =>
    HttpResponse.json({
      success: true,
      data: {
        activity: {
          id: 'act-001',
          title: 'Story Time',
          coachingPrompt: 'Ask your child to make up a story.',
          timeEstimateMinutes: 5,
          skillCategory: { displayName: 'Communication', slug: 'communication', colourHex: '#9C51B6' },
          ageBand: { label: '5–6' },
          isLocked: false,
        },
        is_completed_today: false,
      },
    })
  ),

  http.post('http://localhost:8000/api/v1/activities/:activityId/complete', () =>
    HttpResponse.json({
      success: true,
      data: {
        completion_id: 'comp-001',
        current_streak_days: 1,
        longest_streak_days: 1,
        total_completions: 1,
      },
    })
  ),

  http.get('http://localhost:8000/api/v1/subscription/entitlement', () =>
    HttpResponse.json({
      success: true,
      data: {
        status: 'trial',
        hasFullAccess: true,
        isInTrial: true,
        trialDaysRemaining: 7,
      },
    })
  ),
]

export const server = setupServer(...handlers)
