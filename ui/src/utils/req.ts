import { createFeqi, type Feqi, type FetchOptions } from "feqi";
import { useAppState } from "../states/app-state";

async function getRespJson(resp: Response) {
  // biome-ignore lint/suspicious/noExplicitAny: any
  let data = {} as any;
  try {
    data = await resp.json();
  } catch {
    // ignore
  }
  return data;
}

class Req {
  private readonly o: Feqi;

  onLogout?: () => void;

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
            if (resp.ok) {
              return resp;
            }

            const data = await getRespJson(resp);

            if (resp.status === 401) {
              const [state, actions] = useAppState();
              if (state.refreshToken && data.code === "DEPRECATED_API_KEY") {
                await actions.refresh();
                ctx.request.headers.set(
                  "Authorization",
                  `Bearer ${state.accessToken}`
                );
                const reResp = await fetch(ctx.request);
                if (reResp.ok) {
                  return reResp;
                }
              }
              actions.logout();
              this.onLogout?.();
            }

            if (data.message) {
              throw new Error(data.message);
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
