export const diff = (oldArr: string[], newArr: string[]): ArrayDiff => {
  const obj: ArrayDiff = {
    removed: [],
    added: [],
  };

  for (const p of oldArr) {
    if (newArr.findIndex((o) => o === p) < 0) {
      obj.removed.push(p);
    }
  }

  for (const p of newArr) {
    if (oldArr.findIndex((o) => o === p) < 0) {
      obj.added.push(p);
    }
  }

  return obj;
};
