import fetch from "node-fetch";
import pick from "lodash.pick";
import fs from "fs";

const wait = (ms = 2000) => new Promise((res) => setTimeout(res, ms));

const getDate = (): string => {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return now.getDate() + "%20" + months[now.getMonth()] + "%20" + now.getFullYear();
};

(async () => {
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

  fs.writeFileSync("minimal_marketcap_desc.json", JSON.stringify(minimal, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top200.json", JSON.stringify(top200m, null, 2));
  fs.writeFileSync("minimal_marketcap_desc_top500.json", JSON.stringify(top500m, null, 2));
  fs.writeFileSync("full_marketcap_desc.json", JSON.stringify(full, null, 2));

  const template = fs.readFileSync("./README.template.md", "utf8");
  let i = template.replace("{{count}}", `${minimal.length}`);
  i = i.replace("{{date}}", getDate());
  fs.writeFileSync("./README.md", i);
})();
