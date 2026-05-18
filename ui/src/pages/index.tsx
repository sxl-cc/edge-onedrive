import { useNavigate } from "@solidjs/router";

export default function Index() {
  const $n = useNavigate();

  $n("/v?type=folder", {
    replace: true,
  });

  return "";
}
