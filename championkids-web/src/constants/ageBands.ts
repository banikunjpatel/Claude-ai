export const AGE_BANDS = [
  { label: '1–2',   min: 1,  max: 2,  name: 'Toddler',          bg: '#E1F5EE', text: '#085041' },
  { label: '3–4',   min: 3,  max: 4,  name: 'Early Pre-school',  bg: '#EEEDFE', text: '#3C3489' },
  { label: '5–6',   min: 5,  max: 6,  name: 'Pre-school',        bg: '#FAEEDA', text: '#633806' },
  { label: '7–8',   min: 7,  max: 8,  name: 'Primary',           bg: '#E6F1FB', text: '#0C447C' },
  { label: '9–10',  min: 9,  max: 10, name: 'Upper Primary',     bg: '#EAF3DE', text: '#27500A' },
  { label: '11–12', min: 11, max: 12, name: 'Secondary Ready',   bg: '#FAECE7', text: '#712B13' },
] as const

export function getAgeBand(dateOfBirth: string) {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return AGE_BANDS.find(b => age >= b.min && age <= b.max) ?? null
}

export function getAgeInYears(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}
