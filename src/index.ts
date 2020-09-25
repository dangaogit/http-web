import { isIE, URLUtil } from "./utils";

type HttpClientMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
type HttpClientProtocol = "http" | "ftp" | "https" | "";
type HttpClientCore = "fetch" | "xmlhttprequest";
type HttpClientResponseType = "json" | "text" | "file";
export type HttpClientQuery = string | Record<string | number, any>;
export enum HttpClientContentType {
  json = "application/json",
  html = "text/html",
  xml = "text/xml",
  plain = "text/plain",
  formdata = "multipart/formdata",
}
export interface HttpClientOption {
  /** 完整URL，若填写此参数，则`host`、`port`、`path`不生效，若url中已填写query参数(即url中存在‘`?`’符号)则会与query参数合并 */
  url?: string;
  /** www.test.com */
  host?: string;
  /** 请求所使用的端口号，默认80 */
  port?: number;
  /** 资源地址 */
  path?: string;
  /** 默认为`GET` */
  method?: HttpClientMethod;
  /** 返回数据类型，如果是`json`,则会做`JSON.parse`操作, 默认为`json` */
  responseType?: HttpClientResponseType;
  query?: HttpClientQuery;
  /** 排除null undefined 空字符串的选项 */
  queryExcludeEmpty?: boolean;
  requestBody?: string | number | object;
  /** 请求使用contentType,默认为application/json。(`注意，只有method为 POST PUT时有效`) */
  contentType?: HttpClientContentType | string;
  /** content编码，默认为`utf-8` */
  charset?: string;
  /** 请求所使用header头（`!注意，在这里设置content-type是不生效的，请使用contentType属性`） */
  headers?: Record<string, string>;
  /** 指定请求所用协议 */
  protocol?: HttpClientProtocol;
  /** 请求使用核心 */
  core?: HttpClientCore;
  /** 请求超时时间，默认30 * 1000 /ms(`注意，目前仅core为xmlhttprequest时有效`) */
  timeout?: number;
  /** 是否异步请求，默认为true（`注意，只有core为xmlhttprequest时有效`） */
  async?: boolean;
  /**
   * fetch请求时是否携带cookie `默认为 same-origin`
   * >`include` -- 跨域请求携带cookie
   *
   * >`omit` -- 从不带cookie
   *
   * >`same-origin` -- 仅允许同域cookie
   */
  credentials?: "include" | "omit" | "same-origin";
  /**
   * 更多的fetch原生配置
   */
  moreFetchOption?: RequestInit;
}

export class HttpClient<T> {
  public options: Required<HttpClientOption>;

  constructor(options: HttpClientOption = {}) {
    this.options = this.getRequireOptions(options);
  }

  public send = (): Promise<T> => {
    return this.options.core === "fetch" ? this.fetch() : this.xmlhttprequest();
  };

  /** resolve前处理函数, send前可以直接覆盖该函数达到统一返回数据hook的效果 */
  public handleResponse(resp: T) {
    return resp;
  }

  /** 请求前的预处理 */
  public async handleRequest(options: Required<HttpClientOption>) {
    options;
  }

  /** 初始化参数，填充部分参数 */
  private getRequireOptions(opts: HttpClientOption): Required<HttpClientOption> {
    const {
      url = "",
      host = "",
      path = "",
      port = 80,
      method = "GET",
      query = "",
      requestBody = "",
      responseType = "json",
      async = true,
      contentType = "application/json",
      charset = "utf-8",
      headers = {},
      protocol = "",
      core: originCore,
      timeout = 30 * 1000,
      queryExcludeEmpty = false,
      credentials = "same-origin",
      moreFetchOption = {},
    } = opts;
    let core: HttpClientCore;
    if (originCore) {
      core = originCore;
    } else {
      core = isIE ? "xmlhttprequest" : "fetch";
    }

    return {
      url,
      host,
      async,
      port,
      path,
      method,
      query,
      requestBody,
      responseType,
      contentType,
      charset,
      headers,
      protocol,
      core,
      timeout,
      queryExcludeEmpty,
      credentials,
      moreFetchOption,
    };
  }

  private getUrl() {
    const { protocol, path, host, port, url: optionUrl } = this.options;
    let url = "";
    if (optionUrl.length === 0) {
      if (host !== "") {
        url = protocol;
        if (url !== "") {
          url += ":";
        }
        url += `//${host}`;
        if (port !== 80) {
          url += `:${port}`;
        }
      }
      if (path.length !== 0 && path.charAt(0) !== "/") {
        url += "/";
      }
      url += path;
    } else {
      url = optionUrl;
    }
    url = this.getQueryStringUrl();
    return url;
  }

  private getQueryStringUrl() {
    const { url, query, queryExcludeEmpty } = this.options;
    let result = url;
    if (typeof query === "string") {
      result += query;
    } else {
      Object.keys(query).forEach((name) => {
        let value = query[name];
        if (queryExcludeEmpty && this.paramIsEmpty(value)) {
          return;
        }
        if (["number", "null", "undefined", "object"].findIndex((type) => type === typeof value) !== -1) {
          value = JSON.stringify(value);
        }
        result = URLUtil.setParam(result, name, value);
      });
    }

    return result;
  }

  private paramIsEmpty(value: any) {
    return ["", undefined, null].includes(value);
  }

  private getContentTypeAndEncoding() {
    const { contentType, charset } = this.options;
    return `${contentType};charset=${charset}`;
  }

  private getRequestBody(): string | FormData {
    const { requestBody } = this.options;
    let result: string | FormData = "";
    if (requestBody instanceof FormData) {
      result = requestBody;
    } else if (typeof requestBody === "object") {
      result = JSON.stringify(requestBody);
    } else {
      result = requestBody + "";
    }
    return result;
  }

  /** fetch请求核心 */
  private async fetch(): Promise<any> {
    const { method, headers: _headers, responseType, credentials, moreFetchOption } = this.options;

    await this.handleRequest(this.options);

    const url = this.getUrl();
    const body = method === "GET" || method === "HEAD" ? undefined : this.getRequestBody();
    const headers: Record<string, string> = { ..._headers, "content-type": this.getContentTypeAndEncoding() };

    if (body instanceof FormData) {
      /** formdata请求不能设置content-type */
      delete headers["content-type"];
    }

    const res = await window.fetch(url, {
      method,
      credentials,
      headers,
      body,
      ...moreFetchOption,
    });
    return this.handleResponse(await (responseType === "json" ? res.json() : responseType === "text" ? res.text() : res.blob()));
  }

  /** xmlhttprequest请求核心 */
  private async xmlhttprequest(): Promise<any> {
    const { method, headers, responseType, async, timeout } = this.options;
    await this.handleRequest(this.options);
    const xhr: XMLHttpRequest = XMLHttpRequest ? new XMLHttpRequest() : new window.ActiveXObject("Microsoft.XMLHTTP");
    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const realResp = xhr.response || (xhr as XMLHttpRequest & { responseBody: any }).responseBody || xhr.responseText || xhr.responseXML;
          resolve(this.handleResponse(responseType === "json" ? JSON.parse(realResp) : realResp));
        }
      };
      xhr.onerror = (ev) => reject(ev);
      xhr.open(method, this.getUrl(), async);
      if (async) {
        xhr.timeout = timeout;
      }
      Object.keys(headers).forEach((header) => {
        xhr.setRequestHeader(header, headers[header]);
      });
      xhr.setRequestHeader("content-type", this.getContentTypeAndEncoding());
      xhr.send(this.getRequestBody());
    });
  }
}
