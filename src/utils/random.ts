import seedrandom from "seedrandom";

export type Random = () => number;

export const createRng = (seed: string | number): Random => {
  const rng = seedrandom(String(seed));
  return () => rng();
};

export const randomInt = (rng: Random, min: number, max: number): number => {
  return Math.floor(rng() * (max - min + 1)) + min;
};

export const pickOne = <T>(rng: Random, list: T[]): T => {
  return list[Math.floor(rng() * list.length)];
};

export const chance = (rng: Random, probability: number): boolean => {
  return rng() < probability;
};
