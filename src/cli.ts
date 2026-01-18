import { generateData } from "@/src/generator/index";
import { packNames } from "@/src/generator/config";

const getArgValue = (flag: string, defaultValue: string): string => {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return defaultValue;
  }
  const value = process.argv[index + 1];
  return value ?? defaultValue;
};

const main = async () => {
  const pack = getArgValue("--pack", "p2p_core_pack");
  if (!packNames.includes(pack as (typeof packNames)[number])) {
    throw new Error(`Invalid pack: ${pack}`);
  }
  const rows = Number(getArgValue("--rows", "1000"));
  const vendors = Number(getArgValue("--vendors", "200"));
  const seed = Number(getArgValue("--seed", "42"));
  const startDate = getArgValue("--startDate", "2024-01-01");
  const endDate = getArgValue("--endDate", "2024-12-31");

  const result = await generateData({
    rows,
    vendors,
    seed,
    startDate,
    endDate,
    pack: pack as (typeof packNames)[number]
  });

  console.log("Generation complete:", result);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
