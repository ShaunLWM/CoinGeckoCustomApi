import fetch from "node-fetch";
import pick from "lodash.pick";
import fs from "fs";
import { diff } from "./lib/Helper";

const wait = (ms = 1500) => new Promise((res) => setTimeout(res, ms));

const getDate = (encode = false): string => {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    now.getDate() + `${encode ? "%20" : " "}` + months[now.getMonth()] + `${encode ? "%20" : " "}` + now.getFullYear()
  );
};

(async () => {
  console.time("GO");
  let canContinue = true;
  let page = 1;
  const minimal = [];
  const full = [];
  const top200m = [];
  const top500m = [];

  while (canContinue) {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`
    );
    const items = (await response.json()) as MarketItem[];
    full.push(...items);
    console.log(`Finished page ${page}`);
    if (items.length < 250) canContinue = false;
    page += 1;
    await wait();
  }

  minimal.push(...full.map((p) => pick(p, ["id", "name", "symbol", "image"])));
  top200m.push(...full.map((p) => pick(p, ["id", "name", "symbol", "image"])).slice(0, 200));
  top500m.push(...full.map((p) => pick(p, ["id", "name", "symbol", "image"])).slice(0, 500));

  /* ------------------ Create CHANGELOGs ------------------- */
  /*
  const oldTokens = (JSON.parse(fs.readFileSync("full_marketcap_desc.json", "utf8")) as MarketItem[])
    .map((p) => p.symbol)
    .sort();
  const diffTokens = diff(oldTokens, full.map((p) => p.symbol).sort());

  let hasAdded = false;
  let hasLines = false;
  let str = `### ${getDate()}`;
  if (diffTokens.added) {
    str += `\n\n- Added ${diffTokens.added}`;
    hasAdded = true;
    hasLines = true;
  }

  if (diffTokens.removed) {
    hasLines = true;
    str += `${hasAdded ? "" : "\n"}\n- Removed ${diffTokens.removed}`;
  }

  if (hasLines) {
    const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
    const addedChangelog = `${str}\n\n${changelog}`;
    fs.writeFileSync("CHANGELOG.md", addedChangelog, "utf8");
  }
  */

  fs.writeFileSync("minimal_marketcap_desc.json", JSON.stringify(minimal, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top200.json", JSON.stringify(top200m, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top500.json", JSON.stringify(top500m, null, 2));
  fs.writeFileSync("full_marketcap_desc.json", JSON.stringify(full, null, 2));

  const template = fs.readFileSync("./README.template.md", "utf8");
  let i = template.replace("{{count}}", `${minimal.length}`);
  i = i.replace("{{date}}", getDate(true));
  fs.writeFileSync("./README.md", i);
  console.timeEnd("GO");
})();
