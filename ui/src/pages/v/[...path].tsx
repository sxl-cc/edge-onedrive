import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import { createQuery } from "solid-tiny-query";
import { Button, SpinRing } from "solid-tiny-ui";
import type { MsGraphDriveItem } from "~api";
import { normalizeUrlPath } from "../../utils/path";
import { req } from "../../utils/req";
import { FileView } from "./file-view";
import { FolderView } from "./folder-view";

const getPathType = async (path: string) => {
  const res = await req.get<MsGraphDriveItem>(`/api/v1/drive/get/${path}`, {
    select: "folder",
  });
  return res.is_folder ? "folder" : "file";
};

export default function IndexPage() {
  const params = useParams<{ path: string }>();
  const [searchParams] = useSearchParams<{ type?: "file" | "folder" }>();
  const [refetchSignal, setRefetchSignal] = createSignal(0);

  const $n = useNavigate();

  const query = createQuery({
    queryKey: () => ["item-type", params.path],
    queryFn: async ({ queryKey }) => {
      const res = await getPathType(queryKey[1]);
      return res;
    },
    staleTime: 1000 * 60 * 5,
    enabled: () => !["file", "folder"].includes(searchParams.type ?? ""),
  });

  const pathType = createMemo(() => {
    if (["file", "folder"].includes(searchParams.type ?? "")) {
      return searchParams.type;
    }

    return query.data;
  });

  return (
    <div class="relative flex h-full flex-col">
      <div class="absolute top-[-42px] right-4px flex w-full flex-shrink-0 items-start justify-end gap-4px">
        <Button
          disabled={normalizeUrlPath(params.path) === "/"}
          icon={<div class="i-ri:arrow-up-line c-text-label text-20px" />}
          onClick={() => {
            const paths = params.path.split("/");
            paths.pop();
            $n(`${normalizeUrlPath("v", ...paths)}?type=folder`);
          }}
          variant="text"
        />
        <Button
          icon={<div class="i-ri:refresh-line c-text-label text-18px" />}
          onClick={async () => {
            await query.refetch();
            setRefetchSignal((prev) => prev + 1);
          }}
          variant="text"
        />
        <Button
          icon={<div class="i-ri:settings-line c-text-label text-18px" />}
          onClick={() => $n("/settings")}
          variant="text"
        />
      </div>
      <div class="h-full w-full">
        <Show
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <SpinRing />
            </div>
          }
          when={!query.isLoading}
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
