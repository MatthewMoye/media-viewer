import { RandomizeButton } from "../../common/randomize-button";
import { useMediaViewer } from "../context/use-media-viewer";

export const RandomizeFilter = () => {
  const { shuffleMedia } = useMediaViewer();

  return (
    <fieldset>
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Order
      </legend>
      <div className="flex flex-wrap gap-2">
        <RandomizeButton onClick={shuffleMedia} />
      </div>
    </fieldset>
  );
};
