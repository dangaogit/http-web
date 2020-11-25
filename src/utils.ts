declare global {
  interface Window {
    ActiveXObject: {
      new (type: "Microsoft.XMLHTTP"): XMLHttpRequest;
    };
  }
}

export const isIE: boolean = window.ActiveXObject !== undefined;

export namespace URLUtil {
  export function getParam(url: string, key: string) {
    const reg = new RegExp(`([&?]${key}=)([^&]*)`, "g");
    const result = url.match(reg);
    if (!result) {
      return undefined;
    }
    const value = result[0] ? result[0].replace(new RegExp(`([&?]${key}=)`, "g"), "") : undefined;

    return typeof value === "string" ? decodeURIComponent(value) : undefined;
  }

  export function setParam(url: string, key: string, value: any) {
    if (url.indexOf("?") === -1) {
      url += "?";
    }
    if (typeof getParam(url, key) !== "undefined") {
      url = url.replace(new RegExp(`([&?]${key}=)([^&]*)`, "g"), `$1${value}`);
    } else {
      url += `${url.slice(-1) === "?" ? "" : "&"}${key}=${value}`;
    }
    return url;
  }

  export function delParam(url: string, key: string) {
    return url.replace(new RegExp(`((?<=\\?)&?${key}=[^&]*&?)|(&?${key}=[^&]*)`, "g"), "");
  }
}
