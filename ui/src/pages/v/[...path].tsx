import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import { createQuery } from "solid-tiny-query";
import type { MsGraphDriveItem } from "~api";
import { Button } from "../../components/button";
import { SpinRing } from "../../components/spin";
import { normalizeUrlPath } from "../../utils/path";
import { req } from "../../utils/req";
import { FileView } from "./file-view";
import { FolderView } from "./folder-view";

const getPathType = async (path: string) => {
  const res = await req.post<MsGraphDriveItem>("/api/v2/drive.get", {
    path,
    select: "folder",
  });
  return res.is_folder ? "folder" : "file";
};

export default function IndexPage() {
  const params = useParams<{ path: string }>();
  const [searchParams] = useSearchParams<{ type?: "file" | "folder" }>();
  const [refetchSignal, setRefetchSignal] = createSignal(0);

  const $n = useNavigate();

  const isSearchParamsOk = createMemo(() =>
    ["file", "folder"].includes(searchParams.type ?? "")
  );

  const query = createQuery({
    queryKey: () => ["item-type", params.path],
    queryFn: async ({ queryKey }) => {
      const res = await getPathType(queryKey[1]);
      return res;
    },
    staleTime: 1000 * 60 * 5,
    enabled: () => !isSearchParamsOk(),
  });

  const pathType = createMemo(() => {
    if (isSearchParamsOk()) {
      return searchParams.type;
    }

    return query.data;
  });

  return (
    <div class="relative flex h-full flex-col">
      <div class="absolute top-[-42px] right-4px flex items-start justify-end gap-4px">
        <Button
          disabled={normalizeUrlPath(params.path) === "/"}
          onClick={() => {
            const paths = params.path.split("/");
            paths.pop();
            $n(`${normalizeUrlPath("v", ...paths)}?type=folder`);
          }}
          variant="text"
        >
          <div class="i-ri:arrow-up-line c-text-label text-20px" />
        </Button>
        <Button
          onClick={async () => {
            await query.refetch();
            setRefetchSignal((prev) => prev + 1);
          }}
          variant="text"
        >
          <div class="i-ri:refresh-line c-text-label text-18px" />
        </Button>
        <Button onClick={() => $n("/settings")} variant="text">
          <div class="i-ri:settings-line c-text-label text-18px" />
        </Button>
      </div>
      <div class="h-full w-full">
        <Show
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <SpinRing />
            </div>
          }
          when={!query.isLoading && pathType()}
        >
          <Show
            fallback={
              <FileView path={params.path} refetchSignal={refetchSignal()} />
            }
            when={pathType() === "folder"}
          >
            <FolderView path={params.path} refetchSignal={refetchSignal()} />
          </Show>
        </Show>
      </div>
    </div>
  );
}
