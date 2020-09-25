# http-web
httpclient for browser

# install
> npm i @dangao/http-web --save

or
> yarn add @dangao/http-web

# case
```typescript
import { HttpClient, HttpClientContentType } from "@dangao/http-web";

async function baseHttp(options) {
  const http = new HttpClient();
  http.options.contentType = HttpClientContentType.json;
  http.options.responseType = "json";
  http.handleResponse = function(res) {
    if(res.code !== 200) {
      throw res;
    }
    return res.data; // Return data after unified processing
  }

  http.options = Object.assign(http.options, options);

  return http.send();
}

export async function get(url, query = {}, options = {}) {
  options.method = "GET";
  options.url = url;
  options.query = query;
  return baseHttp(options);
}

export async function post(url, body = {}, options = {}) {
  options.method = "POST";
  options.url = url;
  options.requestBody = body;
  return baseHttp(options);
}
```