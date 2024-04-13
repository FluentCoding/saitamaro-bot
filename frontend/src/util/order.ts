export function preferredOrder(obj: any, order: string[]) {
  let newObject: Record<string, string> = {};
  for (let i = 0; i < order.length; i++) {
    if (obj.hasOwnProperty(order[i])) {
      newObject[order[i]] = obj[order[i]];
    }
  }
  return newObject;
}
