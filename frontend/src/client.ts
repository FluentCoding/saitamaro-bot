import { treaty } from "@elysiajs/eden";
import type { Server } from "../../src";

window.fetch = new Proxy(window.fetch, {
  apply: async (target, that, args: Parameters<typeof window.fetch>) => {
    if (!args[1]) args[1] = {};
    args[1].headers = {
      ...args[1].headers,
      ...(localStorage.getItem("authToken") && {
        authorization: localStorage.getItem("authToken")!,
      }),
    };
    let temp = target.apply(that, args);
    const res = await temp;
    if (res.status === 401) {
      const token = prompt(
        "Enter username and password! Format => user:password"
      );
      localStorage.setItem("authToken", btoa(token ?? ""));
      return fetch(...args);
    } else {
      return res;
    }
  },
});

export const client = treaty<Server>("localhost:4000");
