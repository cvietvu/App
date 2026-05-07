export interface Round {
  id: string;
  date: string;
  course: string;
  teeTime?: string;
  stockShotShape?: string;
  goals?: string;
  fairwayPlacements: Record<number, { x: number; y: number }>;
  approachPlacements: Record<number, { x: number; y: number; distance: number }>;
  stats: {
    score: number;
    pars: number;
    birdies: number;
    eagles: number;
    bogeys: number;
    doubleBogeys: number;
    triplePutts: number;
    penalties: number;
    putts: number;
    gir: number;
    fir: number;
    upAndDowns: number;
    sandSaves: number;
    girMissedUnder100: number;
    girMissed100to125: number;
    girMissed125to150: number;
    girMissed150to175: number;
    girMissedOver175: number;
  };
  notes: string;
}

const ROUNDS_KEY = 'golfer-blueprint-rounds';
const ACTIVE_KEY = 'golfer-blueprint-active-round';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDefaultRound(): Round {
  return {
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    course: '',
    teeTime: '',
    stockShotShape: '',
    goals: '',
    fairwayPlacements: {},
    approachPlacements: {},
    stats: {
      score: 0,
      pars: 0,
      birdies: 0,
      eagles: 0,
      bogeys: 0,
      doubleBogeys: 0,
      triplePutts: 0,
      penalties: 0,
      putts: 0,
      gir: 0,
      fir: 0,
      upAndDowns: 0,
      sandSaves: 0,
      girMissedUnder100: 0,
      girMissed100to125: 0,
      girMissed125to150: 0,
      girMissed150to175: 0,
      girMissedOver175: 0,
    },
    notes: '',
  };
}

export function getRounds(): Round[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Round[];
  } catch {
    return [];
  }
}

export function saveRound(round: Round): void {
  const rounds = getRounds();
  const existingIndex = rounds.findIndex((r) => r.id === round.id);
  if (existingIndex >= 0) {
    rounds[existingIndex] = round;
  } else {
    rounds.unshift(round);
  }
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
}

export function deleteRound(id: string): void {
  const rounds = getRounds().filter((r) => r.id !== id);
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
}

export function getActiveRound(): Round | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Round;
  } catch {
    return null;
  }
}

export function saveActiveRound(round: Round): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(round));
}

export function clearActiveRound(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

export function hasActiveRound(): boolean {
  return !!getActiveRound();
}

export function getRoundById(id: string): Round | null {
  return getRounds().find((r) => r.id === id) ?? null;
}
