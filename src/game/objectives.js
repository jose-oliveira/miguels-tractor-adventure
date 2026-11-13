// A level's objectives are all required. New objective types only need a case here.
export function isObjectiveMet(objective, { position, collected, planted = [], fixed = [] }) {
  switch (objective.type) {
    case 'reach':
      return position[0] === objective.pos[0] && position[1] === objective.pos[1];
    case 'collect':
      return objective.ids.every((id) => collected.includes(id));
    case 'plant':
      return objective.tiles
        ? objective.tiles.every(([x, y]) => planted.includes(`${x},${y}`))
        : planted.length >= objective.count;
    case 'fix':
      return objective.tiles.every(([x, y]) => fixed.includes(`${x},${y}`));
    default:
      return false;
  }
}

export function objectivesComplete(objectives, state) {
  return objectives.every((objective) => isObjectiveMet(objective, state));
}
