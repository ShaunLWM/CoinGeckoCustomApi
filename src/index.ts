import fetch from "node-fetch";
import pick from "lodash.pick";
import fs from "fs";

const wait = (ms = 2000) => new Promise((res) => setTimeout(res, ms));

(async () => {
  let canContinue = true;
  let page = 1;
  const arr = [];
  while (canContinue) {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`
    );
    const items = (await response.json()) as MarketItem[];
    arr.push(...items.map((p) => pick(p, ["id", "name", "symbol", "image"])));
    console.log(`Finished page ${page}`);
    if (items.length < 250) canContinue = false;
    page += 1;
    await wait();
  }

  fs.writeFileSync("minimal_marketcap_desc.json", JSON.stringify(arr, null, 2));
})();
