import fetch from "node-fetch";
import pick from "lodash.pick";
import fs from "fs";
import chunk from "lodash.chunk";

const wait = (ms = 1500) => new Promise((res) => setTimeout(res, ms));

const getDate = (encode = false): string => {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${now.getDate()}${encode ? "%20" : " "}${months[now.getMonth()]}${encode ? "%20" : " "}${now.getFullYear()}`;
};

(async () => {
  console.time("GO");
  const minimal = [];
  const full = [];
  const top200m = [];
  const top500m = [];

  const coinsList = await fetch("https://api.coingecko.com/api/v3/coins/list");
  const coinsListJson = (await coinsList.json()) as Coin[];
  const chunked = chunk(coinsListJson, 250);
  for (let i = 0; i < chunked.length; i += 1) {
    const chunky = chunked[i];
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&ids=${chunky
        .map((p) => p.id)
        .join(",")}`
    );
    const items = (await response.json()) as MarketItem[];
    full.push(...items);
    console.log(`Finished page ${i}`);
    await wait();
  }

  if (full.length < 1) {
    return;
  }

  const withMarketCap = full.filter((p) => p.market_cap_rank !== null && p.market_cap_rank > 0);
  withMarketCap.sort((a, b) => a.market_cap_rank - b.market_cap_rank);

  const noMarketCap = full.filter((p) => p.market_cap_rank == null || p.market_cap_rank < 1);
  withMarketCap.push(...noMarketCap);

  minimal.push(...withMarketCap.map((p) => pick(p, ["id", "name", "symbol", "image"])));
  top200m.push(...withMarketCap.map((p) => pick(p, ["id", "name", "symbol", "image"])).slice(0, 200));
  top500m.push(...withMarketCap.map((p) => pick(p, ["id", "name", "symbol", "image"])).slice(0, 500));

  /* ------------------ Create CHANGELOGs ------------------- */
  /*
  const added: string[] = [];
  const removed: string[] = [];

  const oldTokens = (JSON.parse(fs.readFileSync("full_marketcap_desc.json", "utf8")) as MarketItem[])
    .map((p) => p.symbol)
    .sort();
  const newTokens = full.map((p) => p.symbol);

  oldTokens.forEach((pre) => {
    const found = newTokens.find((p) => p === pre);
    if (!found) {
      removed.push(pre);
    }
  });

  newTokens.forEach((post) => {
    const found = oldTokens.find((p) => p === post);
    if (!found) {
      added.push(post);
    }
  });

  let str = `### ${getDate()}`;
  if (added.length > 0) {
    str += `\n\n- Added ${added.join(", ")}`;
  }

  if (removed.length > 0) {
    str += `${added.length > 0 ? "" : "\n"}\n- Removed ${removed.join(", ")}`;
  }

  if (added.length > 0 || removed.length > 0) {
    const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
    const addedChangelog = `${str}\n\n${changelog}`;
    fs.writeFileSync("CHANGELOG.md", addedChangelog, "utf8");
  }
  */

  fs.writeFileSync("minimal_marketcap_desc.json", JSON.stringify(minimal, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top200.json", JSON.stringify(top200m, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top500.json", JSON.stringify(top500m, null, 2));
  fs.writeFileSync("full_marketcap_desc.json", JSON.stringify(withMarketCap, null, 2));

  const template = fs.readFileSync("./README.template.md", "utf8");
  let i = template.replace("{{count}}", `${minimal.length}`);
  i = i.replace("{{date}}", getDate(true));
  fs.writeFileSync("./README.md", i);
  console.timeEnd("GO");
})();
