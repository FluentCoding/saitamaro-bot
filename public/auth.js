let authToken = "";
window.fetch = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    if (!args[1]) args[1] = {};
    args[1].headers = { authorization: authToken };
    let temp = target.apply(that, args);
    return temp.then((res) => {
      if (res.status === 401) {
        const token = prompt(
          "Enter username and password! Format => user:password"
        );
        authToken = btoa(token);
        return fetch(...args);
      } else {
        return res;
      }
    });
  },
});
