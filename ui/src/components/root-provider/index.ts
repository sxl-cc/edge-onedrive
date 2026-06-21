import { context } from "./context";

export { context as tinyUiContext } from "./context";
export const useRootProvider = context.useContext;
export {
  Color,
  RootProvider,
  RootProvider as TinyUiProvider,
} from "./provider";
