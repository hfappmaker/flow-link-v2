export function uniqueSkillNames(
  skills: { skill: { name: string } }[],
  customSkillNames: string[] = [],
) {
  return [...new Set([...skills.map(({ skill }) => skill.name), ...customSkillNames])];
}
