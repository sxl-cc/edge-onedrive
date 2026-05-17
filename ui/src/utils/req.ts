import { createFeqi, type Feqi, type FetchOptions } from "feqi";
import { useAppState } from "../states/app-state";

class Req {
  private readonly o: Feqi;

  constructor(baseURL?: string) {
    this.o = createFeqi({
      baseURL,
      interceptors: {
        request: [
          (req) => {
            const [state] = useAppState();
            req.headers.set("Authorization", `Bearer ${state.accessToken}`);
            return req;
          },
        ],
        response: [
          async (resp, ctx) => {
            if (resp.status === 401) {
              try {
                const data = await resp.json();
                if (data.code === "deprecated_api_key") {
                  const [state, actions] = useAppState();
                  await actions.refresh();
                  ctx.request.headers.set(
                    "Authorization",
                    `Bearer ${state.accessToken}`
                  );
                  return fetch(ctx.request);
                }
              } catch {
                // ignore
              }
            }

            return resp;
          },
        ],
      },
    });
  }

  get<T>(
    path: string,
    query?: FetchOptions["query"],
    options?: Omit<FetchOptions, "query" | "method">
  ) {
    return this.o<T>(path, {
      ...options,
      query,
      method: "GET",
    });
  }

  post<T>(
    path: string,
    data?: FetchOptions["body"],
    options?: Omit<FetchOptions, "body" | "method">
  ) {
    return this.o<T>(path, {
      ...options,
      method: "POST",
      body: data,
    });
  }
}

export const req = new Req();
