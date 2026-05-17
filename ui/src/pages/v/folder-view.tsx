import { useLocation } from "@solidjs/router";
import { createQuery } from "solid-tiny-query";
import { createWatch } from "solid-tiny-utils";
import type { MsGraphDriveItem } from "~api";
import { DriveItemsView } from "../../components/diver-items-view";
import { normalizeUrlPath } from "../../utils/path";
import { req } from "../../utils/req";

const listItems = async (params: { path: string; next_token: string }) => {
  const res = await req.get<{
    next_token?: string;
    data: MsGraphDriveItem[];
  }>(`/api/v1/drive/list/${params.path}`, {
    page_size: 30,
    next_token: params.next_token,
  });

  return res;
};

export function FolderView(props: { path: string; refetchSignal: number }) {
  const location = useLocation();

  const query = createQuery({
    queryKey: () => ["drive-list", props.path],
    queryFn: async () => {
      const res = await listItems({
        path: props.path,
        next_token: "",
      });

      return {
        items: res.data,
        next_token: res.next_token,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  let loadingId = "";

  createWatch(
    () => [props.refetchSignal],
    () => {
      query.refetch();
    },
    { defer: true }
  );

  return (
    <DriveItemsView
      hasMore={Boolean(query.data?.next_token)}
      items={query.data?.items || []}
      itemUrl={(item) =>
        `${normalizeUrlPath(location.pathname, item.name)}?type=${item.is_folder ? "folder" : "file"}`
      }
      loading={query.isLoading}
      onLoadMore={async () => {
        const token = query.data?.next_token;
        const currentPath = props.path;
        const id = `${token}`;
        if (!token || loadingId === id) {
          return false;
        }

        loadingId = id;
        const data = await listItems({
          path: currentPath,
          next_token: token,
        });

        if (loadingId === id && currentPath === props.path) {
          query.mutate("items", (prev) => [...prev, ...data.data]);
          query.mutate("next_token", data.next_token);
        }

        return true;
      }}
    />
  );
}
